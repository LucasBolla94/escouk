import { NextResponse } from "next/server";
import Stripe from "stripe";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function POST(req) {
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Erro ao verificar webhook:", err.message);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_email;
    const amount = session.amount_total / 100; // Convertendo de centavos para a moeda principal

    if (!email) {
      return NextResponse.json({ error: "Email não encontrado" }, { status: 400 });
    }

    try {
      const userRef = admin.firestore().collection("users").doc(email);
      await userRef.update({
        wallet: admin.firestore.FieldValue.increment(amount),
      });

      console.log(`Crédito de ${amount} adicionado à wallet do usuário ${email}`);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Erro ao atualizar saldo no Firestore:", error);
      return NextResponse.json({ error: "Erro interno ao adicionar crédito" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

export const config = {
  api: {
    bodyParser: false, // Necessário para o Stripe processar a requisição corretamente
  },
};

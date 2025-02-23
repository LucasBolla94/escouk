import { NextResponse } from "next/server";
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

export async function POST(req) {
  try {
    const userEmail = "usuario@email.com"; // Aqui você pode pegar do token do usuário logado
    const amount = 100; // Defina o valor correto a ser adicionado

    if (!userEmail) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const userRef = admin.firestore().collection("users").doc(userEmail);
    await userRef.update({
      wallet: admin.firestore.FieldValue.increment(amount),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar saldo:", error);
    return NextResponse.json({ error: "Erro ao atualizar saldo" }, { status: 500 });
  }
}


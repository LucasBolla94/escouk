import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Inicializa o Firebase Admin SDK apenas uma vez
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
    console.log("🔥 Firebase Admin SDK inicializado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin:", error);
  }
}

export async function POST(req) {
  try {
    console.log("🔄 Recebendo requisição para atualizar saldo...");

    // Captura o cabeçalho de autenticação
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("🚨 Erro: Token não fornecido.");
      return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];

    // Verifica o token e obtém os dados do usuário
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    console.log(`🔑 Token verificado com sucesso! Usuário: ${userId}`);

    // Obtém o valor a ser incrementado do corpo da requisição
    const body = await req.json();
    console.log("📦 Corpo da requisição:", body);

    const { amount } = body;
    if (typeof amount !== "number") {
      console.error("🚨 Erro: Valor inválido.");
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }

    // Referência ao Firestore
    const userRef = admin.firestore().collection("users").doc(userId);
    await userRef.set(
      {
        balance: admin.firestore.FieldValue.increment(amount),
      },
      { merge: true }
    );

    console.log(`✅ Saldo atualizado para usuário ${userId}: +${amount}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Erro ao atualizar saldo:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar saldo." }, { status: 500 });
  }
}

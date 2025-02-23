import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Verifica se as variáveis de ambiente necessárias estão definidas
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  console.error("Variáveis de ambiente do Firebase não foram definidas corretamente.");
  throw new Error("Erro: Variáveis de ambiente do Firebase ausentes.");
}

// Inicializa o Firebase Admin somente se ainda não foi inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Converte as quebras de linha escapadas para quebras reais
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

/*
 * Função POST: Atualiza o saldo (balance) do usuário logado.
 * O endpoint espera que o token de autenticação do Firebase seja enviado no cabeçalho "Authorization" 
 * no formato "Bearer <token>".
 * O corpo da requisição deve conter:
 * - amount: valor a ser incrementado no saldo
 *
 * O ID do usuário (userId) será extraído do token verificado.
 */
export async function POST(req) {
  try {
    // Obtém o token de autenticação do cabeçalho "Authorization"
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de autenticação ausente ou inválido" },
        { status: 401 }
      );
    }
    const token = authHeader.split("Bearer ")[1];

    // Verifica e decodifica o token usando o Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Extrai o valor a ser incrementado do corpo da requisição
    const { amount } = await req.json();
    if (!amount) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    // Referência para o documento do usuário na coleção "users"
    const userRef = admin.firestore().collection("users").doc(userId);

    // Atualiza ou cria o campo "balance" incrementando o valor fornecido
    await userRef.set(
      {
        balance: admin.firestore.FieldValue.increment(amount),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar saldo:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar saldo" },
      { status: 500 }
    );
  }
}

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
 * Função POST: Atualiza o saldo (balance) do usuário.
 * Espera receber um JSON com os seguintes campos:
 * - userId: identificador do usuário (por exemplo, email ou id)
 * - amount: valor a ser incrementado no saldo
 *
 * Utilizamos `set` com merge:true para atualizar o campo balance,
 * criando o documento caso ele não exista.
 */
export async function POST(req) {
  try {
    const { userId, amount } = await req.json();

    if (!userId || !amount) {
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
    return NextResponse.json({ error: error.message || "Erro ao atualizar saldo" }, { status: 500 });
  }
}

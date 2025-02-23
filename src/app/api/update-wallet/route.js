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
      // O replace transforma os caracteres de nova linha "\n" para o formato correto
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

/*
 * Função POST: Atualiza o saldo (wallet) do usuário.
 * Neste exemplo, o email do usuário e o valor a ser incrementado estão fixos.
 * Em um cenário real, você pode extrair essas informações do corpo da requisição ou do token de autenticação.
 */
export async function POST(req) {
  try {
    // Exemplo fixo: em uma aplicação real, recupere esses dados do request ou da autenticação
    const userEmail = "usuario@email.com";
    const amount = 100;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Referência para o documento do usuário na coleção "users"
    const userRef = admin.firestore().collection("users").doc(userEmail);

    // Atualiza o campo "wallet", incrementando o valor especificado
    await userRef.update({
      wallet: admin.firestore.FieldValue.increment(amount),
    });

    // Retorna uma resposta JSON de sucesso
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar saldo:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar saldo" },
      { status: 500 }
    );
  }
}

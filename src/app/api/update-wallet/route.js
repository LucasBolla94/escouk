// /api/update-wallet/route.js

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Inicializa o Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req) {
  try {
    // Obtém o token de autenticação do cabeçalho da requisição
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido.' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];

    // Verifica o token e obtém os dados do usuário
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Obtém o valor a ser incrementado do corpo da requisição
    const { amount } = await req.json();
    if (typeof amount !== 'number') {
      return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 });
    }

    // Referência ao documento do usuário no Firestore
    const userRef = admin.firestore().collection('users').doc(userId);

    // Atualiza o campo 'balance' incrementando o valor especificado
    await userRef.set(
      {
        balance: admin.firestore.FieldValue.increment(amount),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar saldo:', error);
    return NextResponse.json({ error: 'Erro ao atualizar saldo.' }, { status: 500 });
  }
}

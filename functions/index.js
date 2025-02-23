const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Inicializa o Firebase Admin
admin.initializeApp();

// Inicializa o Stripe utilizando a variável de ambiente ou valor default (lembre-se de atualizar para produção)
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51QvPr7DWzdFGLvwk82tTPlACXTKYvWMueQB5iqCAWQMIZuydgWUhHRJQ43BRvvPv0RqjEZZUwR0OtGq0DXSdpiZh00iJVe8wnB');

// Chave do webhook, preferencialmente via variável de ambiente
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'rk_test_51QvPr7DWzdFGLvwkYtMp6gnuvpA5egAe2oJKYm1Fi3QbUI7P845we6OY7E7Jt7MZ19I4j5abcuhmUB3osDAa108C00OXs6NONL';

const app = express();
app.use(cors({ origin: true }));

// Rota do webhook do Stripe – usamos bodyParser.raw para manter o corpo intacto e validar a assinatura
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Erro na verificação do webhook:', err.message);
    return res.status(400).send(`Erro no webhook: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const amountPaid = session.amount_total; // valor em centavos

    if (userId) {
      try {
        // Recupera o fator de conversão da coleção "currency", documento "credit"
        const creditSnap = await admin.firestore().collection('currency').doc('credit').get();
        const conversionFactor = creditSnap.exists && creditSnap.data().value ? creditSnap.data().value : 1;
        const creditAmount = amountPaid * conversionFactor;

        // Atualiza ou cria o documento do usuário na coleção "users"
        const userRef = admin.firestore().collection('users').doc(userId);
        const userSnap = await userRef.get();

        if (userSnap.exists && typeof userSnap.data().balance === 'number') {
          await userRef.update({
            balance: admin.firestore.FieldValue.increment(creditAmount)
          });
          console.log(`Saldo do usuário ${userId} incrementado com +${creditAmount}.`);
        } else {
          await userRef.set({ balance: creditAmount }, { merge: true });
          console.log(`Documento do usuário ${userId} criado com saldo inicial de ${creditAmount}.`);
        }
      } catch (error) {
        console.error('Erro ao atualizar o saldo do usuário:', error);
      }
    } else {
      console.warn('userId não encontrado na metadata da sessão.');
    }
  }

  res.status(200).json({ received: true });
});

// Middleware para parsing de JSON nas demais rotas
app.use(express.json());

// Rota para criar uma sessão de checkout do Stripe
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { userId, amount, coupon } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valor de depósito inválido." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: 'Test Product' },
          unit_amount: amount, // em centavos
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://87.106.103.140/dashboard',
      cancel_url: 'https://87.106.103.140/dashboard',
      metadata: {
        userId: userId || 'defaultUser',
        coupon: coupon || ""
      }
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Erro ao criar a sessão do checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

exports.api = functions.https.onRequest(app);

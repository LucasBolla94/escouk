// Importa as funções do Firebase, o Express, o Stripe, o body-parser (para o webhook) e o Firebase Admin para acessar o Firestore
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Inicializa o Firebase Admin para acessar o Firestore
admin.initializeApp();

// Inicialize o Stripe com sua chave secreta
// IMPORTANTE: Em produção, guarde suas chaves em variáveis de ambiente para segurança.
const stripe = Stripe('sk_test_51QvPr7DWzdFGLvwk82tTPlACXTKYvWMueQB5iqCAWQMIZuydgWUhHRJQ43BRvvPv0RqjEZZUwR0OtGq0DXSdpiZh00iJVe8wnB');

// Obtenha a chave do webhook a partir de uma variável de ambiente ou hardcoded (aqui, para exemplo, usei o valor)
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'rk_test_51QvPr7DWzdFGLvwkYtMp6gnuvpA5egAe2oJKYm1Fi3QbUI7P845we6OY7E7Jt7MZ19I4j5abcuhmUB3osDAa108C00OXs6NONL';

// Cria uma instância do Express
const app = express();

// Habilita o CORS para permitir requisições de outros domínios
app.use(cors({ origin: true }));

// Para a rota do webhook, precisamos do corpo "raw" para validar a assinatura
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  // Verifica a assinatura do webhook para garantir que o evento veio do Stripe
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Falha na verificação do webhook:', err.message);
    return res.status(400).send(`Erro no webhook: ${err.message}`);
  }

  // Verifica se o evento é de checkout concluído
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Esperamos que o userId seja enviado via metadata na sessão do checkout.
    const userId = session.metadata && session.metadata.userId;
    // amount_total vem em centavos (ou na menor unidade da moeda)
    const amountPaid = session.amount_total;

    if (userId) {
      try {
        // Busca o fator de conversão na coleção "currency", documento "credit", campo "value"
        const creditDoc = await admin.firestore().collection('currency').doc('credit').get();
        const conversionFactor = creditDoc.exists && creditDoc.data().value ? creditDoc.data().value : 1;

        // Calcula o crédito a ser adicionado: valor pago * fator de conversão
        const creditAmount = amountPaid * conversionFactor;

        // Atualiza o saldo do usuário na coleção "users" (campo "balance")
        const userRef = admin.firestore().collection('users').doc(userId);
        await userRef.update({
          balance: admin.firestore.FieldValue.increment(creditAmount)
        });

        console.log(`Saldo do usuário ${userId} atualizado com +${creditAmount}.`);
      } catch (error) {
        console.error('Erro ao atualizar o saldo do usuário:', error);
        // Em caso de erro, pode ser interessante registrar e notificar
      }
    } else {
      console.warn('userId não encontrado na metadata da sessão.');
    }
  }

  // Responde que o evento foi recebido com sucesso
  res.status(200).json({ received: true });
});

// Middleware para o parsing de JSON nas demais rotas
app.use(express.json());

/**
 * Rota para criar uma sessão de checkout do Stripe.
 * Quando o cliente acessar essa rota, ele receberá uma sessão para iniciar o pagamento.
 * Importante: aqui, vamos adicionar o userId na metadata para usarmos no webhook.
 */
app.post('/create-checkout-session', async (req, res) => {
  try {
    // Supondo que o body contenha o userId do cliente
    const { userId } = req.body;
    
    // Cria a sessão de checkout com detalhes do pagamento e inclui o userId na metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp', // Define a moeda (ex.: usd, brl)
          product_data: {
            name: 'Test Product', // Nome do produto
          },
          unit_amount: 2000, // Valor em centavos (2000 = £20.00)
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://seu-dominio.com/success',
      cancel_url: 'https://seu-dominio.com/cancel',
      metadata: {
        userId: userId || 'defaultUser'
      }
    });
    
    // Retorna o ID da sessão para que o front-end possa redirecionar o usuário
    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Erro ao criar a sessão do checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exporta a API como uma função HTTP do Firebase
exports.api = functions.https.onRequest(app);

// Importa as funções do Firebase, o Express e outras dependências
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

// Obtém a chave secreta do Stripe corretamente via Firebase Functions
const stripe = Stripe(functions.config().stripe.secret_key || process.env.STRIPE_SECRET_KEY);

// Cria uma instância do Express
const app = express();

// Habilita o CORS para permitir requisições de outros domínios
app.use(cors({ origin: true }));

// Permite o parsing de JSON no corpo das requisições
app.use(express.json());

/**
 * Rota para verificar se a API está rodando.
 */
app.get('/', (req, res) => {
  res.status(200).send('API Stripe está rodando corretamente!');
});

/**
 * Rota para criar uma sessão de checkout do Stripe.
 */
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount, currency, coupon, userId } = req.body;

    // Valida se o valor fornecido é válido
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valor de pagamento inválido' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency || 'gbp',
          product_data: {
            name: 'Depósito',
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://seu-dominio.com/success',
      cancel_url: 'https://seu-dominio.com/cancel',
      metadata: { userId: userId || 'desconhecido', coupon: coupon || 'nenhum' },
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Erro ao criar a sessão do checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

// **IMPORTANTE: NÃO CHAME `app.listen(PORT)`!!**
// O Firebase Functions gerencia o servidor automaticamente

// Exporta a API como uma função HTTP do Firebase
exports.api = functions.https.onRequest(app);

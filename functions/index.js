// Importa as funções do Firebase, o Express e outras dependências
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

// Inicialize o Stripe com sua chave secreta
// IMPORTANTE: Em produção, guarde suas chaves em variáveis de ambiente para segurança.
const stripe = Stripe('sk_test_51QvPr7DWzdFGLvwk82tTPlACXTKYvWMueQB5iqCAWQMIZuydgWUhHRJQ43BRvvPv0RqjEZZUwR0OtGq0DXSdpiZh00iJVe8wnB');

// Cria uma instância do Express
const app = express();

// Habilita o CORS para permitir requisições de outros domínios
app.use(cors({ origin: true }));

// Permite o parsing de JSON no corpo das requisições
app.use(express.json());

/**
 * Rota para criar uma sessão de checkout do Stripe.
 * Quando o cliente acessar essa rota, ele receberá uma sessão para iniciar o pagamento.
 */
app.post('/create-checkout-session', async (req, res) => {
  try {
    // Aqui definimos os detalhes do produto e do pagamento.
    // Você pode adaptar os valores conforme a sua necessidade.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd', // Define a moeda (ex.: usd, brl)
          product_data: {
            name: 'Test Product', // Nome do produto
          },
          unit_amount: 2000, // Valor em centavos (2000 = US$20.00)
        },
        quantity: 1, // Quantidade do produto
      }],
      mode: 'payment',
      // URLs de redirecionamento após o pagamento
      success_url: 'https://seu-dominio.com/success', // Altere para sua URL de sucesso
      cancel_url: 'https://seu-dominio.com/cancel',   // Altere para sua URL de cancelamento
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

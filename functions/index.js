// Importa a função onRequest da nova API do Firebase Functions v2
const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

// Obtenha a chave secreta do Stripe a partir das variáveis de ambiente.
// Configure essa variável com: firebase functions:secrets:set STRIPE_SECRET_KEY --data="SUA_CHAVE"
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_51QvPr7DWzdFGLvwk82tTPlACXTKYvWMueQB5iqCAWQMIZuydgWUhHRJQ43BRvvPv0RqjEZZUwR0OtGq0DXSdpiZh00iJVe8wnB";
const stripe = Stripe(stripeSecretKey);

// Cria uma instância do Express
const app = express();

// Habilita o CORS e o parsing de JSON
app.use(cors({ origin: true }));
app.use(express.json());

// Rotas simples para teste
app.get("/", (req, res) => {
  res.status(200).send("API Stripe está rodando corretamente!");
});

app.get("/test", (req, res) => {
  res.status(200).send("Rota de teste funcionando corretamente!");
});

// Rota para criar uma sessão de checkout com o Stripe
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { amount, currency = "gbp", coupon = "nenhum", userId = "desconhecido" } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Valor de pagamento inválido" });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: "Depósito" },
            unit_amount: amount, // valor em centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://seu-dominio.com/success",
      cancel_url: "https://seu-dominio.com/cancel",
      metadata: { userId, coupon },
    });
    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Erro ao criar a sessão do checkout:", error);
    res.status(500).json({ error: error.message });
  }
});

// Exporta a função com as opções especificadas
exports.api = onRequest({ region: "us-central1", timeoutSeconds: 60 }, app);

"use client";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc 
} from "firebase/firestore";
import app from "@/lib/firebase";
import { useAuth } from "@/lib/protectRoute";

// Carrega o Stripe com a chave pública definida nas variáveis de ambiente
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Finance() {
  const db = getFirestore(app);
  const user = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  // Estados para Depósito e Cupom de Desconto
  const [depositAmount, setDepositAmount] = useState("");
  const [couponCode, setCouponCode] = useState("");

  // Função para buscar transações do usuário
  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "transactions"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const transactionsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(transactionsList);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    }
  };

  // Função para buscar o saldo atual do usuário
  const fetchUserBalance = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setBalance(data.balance || 0);
      }
    } catch (error) {
      console.error("Erro ao buscar o saldo do usuário:", error);
    }
  };

  // Ao carregar ou quando o usuário muda, busca transações e saldo
  useEffect(() => {
    if (user) {
      Promise.all([fetchTransactions(), fetchUserBalance()]).then(() => setLoading(false));
    }
  }, [user]);

  // Função para processar o pagamento via Stripe
  const handleStripePayment = async () => {
    // Converte o valor do depósito para número
    const depositValue = parseFloat(depositAmount);

    if (isNaN(depositValue) || depositValue <= 0) {
      alert("Informe um valor válido para depósito");
      return;
    }

    // Converte o valor para centavos (requerido pelo Stripe)
    const amountInCents = Math.round(depositValue * 100);

    try {
      // Prepara os dados para enviar ao endpoint da sua função
      // Aqui garantimos que o cupom seja tratado (removendo espaços) e que enviamos a moeda e o valor
      const payload = {
        amount: amountInCents,
        currency: "GBP", // Use a moeda em letras maiúsculas conforme recomendação do Stripe
        coupon: couponCode.trim() || "",
        userId: user ? user.uid : null,
      };

      const response = await fetch(
        "https://us-central1-escorts-uk.cloudfunctions.net/api/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (data.error) {
        console.error("Erro na função do Stripe:", data.error);
        alert("Erro ao iniciar o pagamento: " + data.error);
        return;
      }
      console.log("Checkout Session criada com sucesso:", data.id);

      // Redireciona para a sessão de checkout do Stripe
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
      if (error) {
        console.error("Erro no redirecionamento para o checkout:", error);
        alert("Erro ao redirecionar para o checkout");
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      alert("Erro ao processar pagamento");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Financeiro</h2>

      <div className="mb-4 p-4 bg-gray-100 rounded-lg flex justify-between">
        <span className="text-lg font-semibold">Saldo Atual:</span>
        <span className={`text-lg font-bold ${balance >= 0 ? "text-green-500" : "text-red-500"}`}>
          £{balance.toFixed(2)}
        </span>
      </div>

      {loading ? (
        <p>Carregando transações...</p>
      ) : transactions.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <li key={transaction.id} className="py-3 flex justify-between">
              <span className="font-medium">{transaction.description}</span>
              <span className={`font-semibold ${transaction.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                {transaction.amount > 0 ? "+" : ""}£{transaction.amount.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhuma transação encontrada.</p>
      )}

      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold mb-2">Depósito</h3>
        <div className="flex space-x-2 mb-2">
          <button onClick={() => setDepositAmount("5")} className="px-4 py-2 bg-blue-500 text-white rounded">
            £5,00
          </button>
          <button onClick={() => setDepositAmount("10")} className="px-4 py-2 bg-blue-500 text-white rounded">
            £10,00
          </button>
          <button onClick={() => setDepositAmount("30")} className="px-4 py-2 bg-blue-500 text-white rounded">
            £30,00
          </button>
        </div>
        <input
          type="number"
          step="0.01"
          placeholder="Digite o valor do depósito"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold mb-2">Cupom de Desconto</h3>
        <input
          type="text"
          placeholder="Digite seu cupom (Reffer Code)"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mt-6">
        <button onClick={handleStripePayment} className="w-full py-3 bg-green-600 text-white rounded-lg text-lg">
          Pagar Agora
        </button>
        <p className="text-center text-sm text-gray-600 mt-2">
          Aceitamos Apple Pay, Google Pay e Cartões
        </p>
      </div>
    </div>
  );
}

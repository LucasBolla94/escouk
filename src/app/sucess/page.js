"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import app from "@/lib/firebase"; // Certifique-se de que o Firebase está sendo inicializado corretamente

export default function SuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [bonusPercentage, setBonusPercentage] = useState(0);
  const [valorPagoNoStripe, setValorPagoNoStripe] = useState(10); // Valor inicial pago no Stripe
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Usuário não autenticado.");
        setLoading(false);
        return;
      }

      try {
        const userToken = await user.getIdToken();
        setToken(userToken);
      } catch (error) {
        console.error("❌ Erro ao obter token:", error.message);
        setError("Erro ao obter credenciais do usuário.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const handleApplyCoupon = async () => {
    if (!coupon) {
      setError("Por favor, insira um cupom.");
      return;
    }

    try {
      const q = query(
        collection(db, "reffer-code"),
        where("code", "==", coupon),
        where("bonus-type", "==", true)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Cupom inválido ou não aplicável.");
        return;
      }

      const couponData = querySnapshot.docs[0].data();
      const bonus = couponData.value; // Supondo que 'value' seja um número representando a porcentagem de bônus

      setBonusPercentage(bonus);
      setError(null); // Limpa qualquer erro anterior
    } catch (error) {
      console.error("❌ Erro ao verificar o cupom:", error.message);
      setError("Erro ao verificar o cupom.");
    }
  };

  useEffect(() => {
    if (!token) return;

    const processPayment = async () => {
      try {
        const currencyDocRef = doc(db, "currency", "credit");
        const currencyDocSnap = await getDoc(currencyDocRef);

        if (!currencyDocSnap.exists()) {
          throw new Error("Configuração de moeda não encontrada.");
        }

        const creditValue = currencyDocSnap.data().value;
        let amount = creditValue * valorPagoNoStripe;

        if (bonusPercentage > 0) {
          const bonusAmount = (bonusPercentage / 100) * amount;
          amount += bonusAmount;
        }

        console.log("🔄 Enviando requisição com token...");

        const response = await fetch("/api/update-wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
        });

        const data = await response.json();
        console.log("📩 Resposta da API:", data);

        if (!response.ok) {
          throw new Error(data.error || "Erro ao atualizar saldo.");
        }

        console.log("✅ Saldo atualizado com sucesso!");
      } catch (error) {
        console.error("❌ Erro na requisição:", error.message);
        setError(error.message);
      } finally {
        setLoading(false);
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      }
    };

    processPayment();
  }, [token, router, db, valorPagoNoStripe, bonusPercentage]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          {error ? "Erro no Pagamento" : "Pagamento Concluído!"}
        </h2>
        <p className="text-gray-600 mt-2">
          {error ? error : "Processando seu saldo..."}
        </p>

        <div className="mt-4">
          <input
            type="text"
            placeholder="Digite seu cupom"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={handleApplyCoupon}
            className="ml-2 p-2 bg-blue-500 text-white rounded"
          >
            Aplicar Cupom
          </button>
        </div>

        {bonusPercentage > 0 && (
          <p className="text-green-600 mt-4">
            Cupom aplicado! Você receberá um bônus de {bonusPercentage}% em seu crédito.
          </p>
        )}

        {loading && (
          <div className="mt-4 flex justify-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && !error && (
          <p className="text-green-600 mt-4">Redirecionando para o painel...</p>
        )}
      </div>
    </div>
  );
}

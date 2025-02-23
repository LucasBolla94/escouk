import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";

export default function SuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const processPayment = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("Usuário não autenticado.");
        }
        const token = await user.getIdToken(); // Obtém o token correto do Firebase Auth
        const amount = 100;

        console.log("🔄 Enviando requisição com token...");

        const response = await fetch("/api/update-wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Agora enviando corretamente
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
  }, [router, auth]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          {error ? "Erro no Pagamento" : "Pagamento Concluído!"}
        </h2>
        <p className="text-gray-600 mt-2">
          {error ? error : "Processando seu saldo..."}
        </p>

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

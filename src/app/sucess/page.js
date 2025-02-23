"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Estado para armazenar erros

  useEffect(() => {
    const processPayment = async () => {
      try {
        const userId = "id-do-usuario-logado"; // Substitua isso com o ID real do usuário autenticado
        const amount = 100;

        const response = await fetch("/api/update-wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, amount }),
        });

        if (!response.ok) {
          throw new Error("Erro ao atualizar saldo.");
        }

        console.log("Saldo atualizado com sucesso!");
      } catch (error) {
        console.error("Erro na requisição:", error);
        setError("Erro ao processar o pagamento. Tente novamente.");
      } finally {
        setLoading(false); // Define que o carregamento foi concluído
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      }
    };

    processPayment();
  }, [router]);

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

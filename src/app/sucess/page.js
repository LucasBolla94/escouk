"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Requisição para o backend que atualiza o saldo do usuário.
        const response = await fetch("/api/update-wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          console.log("Saldo atualizado com sucesso!");
        } else {
          console.error("Erro ao atualizar saldo.");
        }
      } catch (error) {
        console.error("Erro na requisição:", error);
      } finally {
        // Aguarda 3 segundos antes de redirecionar para o dashboard.
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      }
    };

    processPayment();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800">Pagamento Concluído!</h2>
        <p className="text-gray-600 mt-2">Processando seu saldo...</p>
        <div className="mt-4 flex justify-center">
          {/* Loading Spinner */}
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { useAuth } from "@/lib/protectRoute";
import app from "@/lib/firebase";
import { useRouter } from "next/navigation";

// Importando o componente do Chart.js
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrando os componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Ads() {
  const db = getFirestore(app);
  const user = useAuth();
  const router = useRouter();

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Configura uma assinatura em tempo real para os anúncios do usuário
      const q = query(collection(db, "ads"), where("createdBy", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const adsList = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setAds(adsList);
        setLoading(false);
      }, (error) => {
        console.error("Erro ao buscar anúncios:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, db]);

  // Função para excluir um ad
  const handleDeleteAd = async (adId) => {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este anúncio?");
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "ads", adId));
    } catch (error) {
      console.error("Erro ao excluir anúncio:", error);
    }
  };

  // Função para editar um ad (navega para a página de edição)
  const handleEditAd = (adId) => {
    router.push(`/edit-ad/${adId}`);
  };

  // Função para reativar um ad expirado
  const handleReactivateAd = async (adId) => {
    try {
      await updateDoc(doc(db, "ads", adId), { status: "ativo" });
    } catch (error) {
      console.error("Erro ao reativar anúncio:", error);
    }
  };

  // Função para destacar um ad (exemplo simples)
  const handlePromoteAd = async (adId) => {
    try {
      await updateDoc(doc(db, "ads", adId), { promoted: true });
      alert("Anúncio promovido com sucesso!");
    } catch (error) {
      console.error("Erro ao promover anúncio:", error);
    }
  };

  // Componente interno para renderizar o gráfico de barras de cada anúncio com atualização em tempo real
  function AdChart({ ad }) {
    const [totalClicks, setTotalClicks] = useState(0);
    const [clicksToday, setClicksToday] = useState(0);

    useEffect(() => {
      // Configura uma assinatura em tempo real para os cliques do anúncio
      const clicksQuery = query(
        collection(db, "clicks"),
        where("adsId", "==", ad.id)
      );
      const unsubscribe = onSnapshot(clicksQuery, (clicksSnapshot) => {
        const total = clicksSnapshot.size;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        let todayCount = 0;
        clicksSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.clickTime && data.clickTime.toMillis) {
            const clickTime = data.clickTime.toMillis();
            if (clickTime >= startOfToday.getTime()) {
              todayCount++;
            }
          }
        });
        setTotalClicks(total);
        setClicksToday(todayCount);
      }, (error) => {
        console.error("Erro ao buscar cliques:", error);
      });
      return () => unsubscribe();
    }, [ad.id, db]);

    // Calcula quantos dias o anúncio está online (assumindo que ad.createdAt é um Timestamp)
    const daysOnline =
      ad.createdAt && ad.createdAt.toMillis
        ? Math.floor((Date.now() - ad.createdAt.toMillis()) / (1000 * 60 * 60 * 24))
        : 0;

    const data = {
      labels: ["Cliques Hoje", "Cliques Totais"],
      datasets: [
        {
          label: `Tempo online: ${daysOnline} dia(s)`,
          data: [clicksToday, totalClicks],
          backgroundColor: ["#36A2EB", "#FF6384"],
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: {
          display: true,
          text: "Cliques comparados com o tempo online",
        },
      },
    };

    return <Bar data={data} options={options} />;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Meus Anúncios</h2>
      {loading ? (
        <p>Carregando anúncios...</p>
      ) : ads.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {ads.map((ad) => (
            <li key={ad.id} className="py-4 flex flex-col">
              <h3 className="text-lg font-semibold">{ad.tittle}</h3>
              <p className="text-gray-600">{ad.content}</p>

              {/* Área do gráfico de barras para mostrar cliques e tempo online */}
              <div className="mt-4">
                <AdChart ad={ad} />
              </div>

              <div className="flex justify-between items-center mt-2">
                <span
                  className={`px-3 py-1 rounded text-sm ${
                    ad.status === "ativo"
                      ? "bg-green-200 text-green-700"
                      : "bg-red-200 text-red-700"
                  }`}
                >
                  {ad.status}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEditAd(ad.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteAd(ad.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    Excluir
                  </button>
                  {ad.status !== "ativo" && (
                    <button
                      onClick={() => handleReactivateAd(ad.id)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
                    >
                      Reativar
                    </button>
                  )}
                  {!ad.promoted && (
                    <button
                      onClick={() => handlePromoteAd(ad.id)}
                      className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
                    >
                      Promover
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum anúncio encontrado.</p>
      )}
    </div>
  );
}

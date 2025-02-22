"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";
import app from "@/lib/firebase";

export default function HomePage() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState(10); // Raio padrão de 10 milhas
  const [locationError, setLocationError] = useState(null);
  const [ads, setAds] = useState([]); // Lista de anúncios
  const db = getFirestore(app);

  // Estado para a categoria selecionada
  const [category, setCategory] = useState("");

  // Obtém a localização do usuário
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Localização obtida: Lat ${latitude}, Lng ${longitude}`);
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data.address && data.address.city) {
              setCity(data.address.city);
            } else {
              setLocationError("Não foi possível detectar sua cidade automaticamente.");
            }
          } catch (error) {
            console.error("Erro ao buscar cidade:", error);
            setLocationError("Erro ao obter localização.");
          }
        },
        (error) => {
          console.error("Erro ao obter localização:", error.message);
          setLocationError("Permissão de localização negada ou erro ao acessar.");
        }
      );
    } else {
      setLocationError("Geolocalização não é suportada pelo seu navegador.");
    }
  }, []);

  // Busca os anúncios do Firestore
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "ads"));
        const fetchedAds = [];
        querySnapshot.forEach((doc) => {
          fetchedAds.push({ id: doc.id, ...doc.data() });
        });
        // Ordena os anúncios: primeiro os VIPs
        fetchedAds.sort((a, b) => (b.vip === true) - (a.vip === true));
        setAds(fetchedAds);
      } catch (error) {
        console.error("Erro ao buscar anúncios:", error);
      }
    };
    fetchAds();
  }, [db]);

  const handleSearch = () => {
    if (!category) {
      alert("Por favor, selecione uma categoria.");
      return;
    }
    // Redireciona para a página de pesquisa com os parâmetros corretos
    router.push(
      `/search/${category}?city=${encodeURIComponent(city)}&radius=${radius}`
    );
  };

  // Função para registrar o clique e redirecionar para os detalhes do anúncio
  const handleAdClick = async (createdBy, adsId) => {
    const clickData = {
      adsId: adsId,
      userId: createdBy,
      clickTime: new Date().toISOString(),
    };
    try {
      await addDoc(collection(db, "clicks"), clickData);
      await addDoc(collection(db, "ads", adsId, "clicks"), clickData);
    } catch (error) {
      console.error("Erro ao registrar o clique:", error);
    } finally {
      router.push(`/${createdBy}/${adsId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Conteúdo Principal */}
      <div className="flex flex-col items-center justify-center mt-10 px-4">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Encontre anúncios na sua região
        </h2>

        {/* Box de Seleção de Categoria */}
        <div className="mb-4 w-full max-w-3xl">
          <label className="block text-gray-700 mb-1">
            Categoria (MAIOR DE 18 ANOS)
          </label>
          <select
            className="w-full p-2 border rounded"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Selecione uma categoria</option>
            <option value="car">Car</option>
            <option value="van">Van</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="rental-property">Rentals (Property)</option>
            <option value="sales-property">Sales (Property)</option>
            <option value="electronics">Electronics</option>
            <option value="pets">Pets</option>
            <option value="fashion-accessorie">Fashion and Accessories</option>
            <option value="sport-leisure">Sports and Leisure</option>
            <option value="escorts">Escorts</option>
          </select>
        </div>

        {/* Barra de Busca Responsiva */}
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full max-w-3xl">
          <input
            type="text"
            placeholder="Digite a cidade"
            className="flex-1 p-2 border rounded w-full"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <select
            className="p-2 border rounded w-full sm:w-auto"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          >
            <option value="5">5 milhas</option>
            <option value="10">10 milhas</option>
            <option value="25">25 milhas</option>
            <option value="50">50 milhas</option>
          </select>
          <button
            onClick={handleSearch}
            className="p-2 bg-blue-500 text-white rounded w-full sm:w-auto"
          >
            Buscar
          </button>
        </div>

        {/* Exibe erro de localização, se houver */}
        {locationError && (
          <p className="text-red-500 text-sm mt-2">{locationError}</p>
        )}
      </div>

      {/* Lista de Anúncios */}
      <div className="max-w-6xl mx-auto p-4 mt-10">
        <h3 className="text-2xl font-semibold mb-4">Anúncios em destaque</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {ads.length > 0 ? (
            ads.map((ad) => (
              <div
                key={ad.id}
                className={`p-4 border rounded-lg shadow-md bg-white cursor-pointer ${
                  ad.vip ? "border-yellow-500" : "border-gray-300"
                }`}
                onClick={() => handleAdClick(ad.createdBy, ad.id)}
              >
                <img
                  src={ad.album?.[0] || "https://via.placeholder.com/150"}
                  alt={ad.tittle}
                  className="w-full h-40 object-cover rounded-md"
                />
                <h4 className="text-lg font-bold mt-2">{ad.tittle}</h4>
                <p className="text-gray-600">
                  {ad.city || "Localização não informada"}
                </p>
                {ad.vip && (
                  <span className="text-yellow-500 font-semibold">★ VIP</span>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-600">
              Nenhum anúncio disponível no momento.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import app from "@/lib/firebase";

export default function AdDetailsPage() {
  const { userid, ads } = useParams(); // Obtém o ID do usuário e do anúncio
  const router = useRouter();
  const db = getFirestore(app);
  const [adData, setAdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    const fetchAd = async () => {
      if (!userid || !ads) return;
      const adRef = doc(db, "ads", ads);
      const adSnap = await getDoc(adRef);
      if (adSnap.exists()) {
        setAdData(adSnap.data());
      } else {
        setAdData(null);
      }
      setLoading(false);
    };

    fetchAd();
  }, [userid, ads, db]);

  if (loading)
    return <p className="text-center mt-10 text-gray-700">Carregando anúncio...</p>;
  if (!adData)
    return <p className="text-center mt-10 text-red-500">Anúncio não encontrado!</p>;

  // Combina as mídias: fotos (album) e vídeos (videos) – vídeos serão tratados com player
  const mediaItems = [];
  if (adData.album && adData.album.length > 0) {
    adData.album.forEach((url) =>
      mediaItems.push({ type: "image", url })
    );
  }
  if (adData.videos && adData.videos.length > 0) {
    adData.videos.forEach((url) =>
      mediaItems.push({ type: "video", url })
    );
  }

  const prevMedia = () => {
    setCurrentMediaIndex((prev) =>
      (prev - 1 + mediaItems.length) % mediaItems.length
    );
  };

  const nextMedia = () => {
    setCurrentMediaIndex((prev) =>
      (prev + 1) % mediaItems.length
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-4 text-center">{adData.tittle}</h2>

        {/* Carousel de Mídia */}
        {mediaItems.length > 0 ? (
          <div className="relative w-full mb-4">
            {mediaItems[currentMediaIndex].type === "image" ? (
              <img
                src={mediaItems[currentMediaIndex].url}
                alt="Mídia do anúncio"
                className="w-full h-auto object-cover rounded-md"
              />
            ) : (
              <video
                src={mediaItems[currentMediaIndex].url}
                controls
                className="w-full h-auto object-cover rounded-md"
              />
            )}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={prevMedia}
                  className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                >
                  &#8592;
                </button>
                <button
                  onClick={nextMedia}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                >
                  &#8594;
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center mb-4">Nenhuma mídia disponível</p>
        )}

        {/* Descrição */}
        <p className="mt-4 text-gray-700">{adData.content}</p>

        {/* Preços */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Preços</h3>
          {adData.prices && adData.prices.length > 0 ? (
            <ul className="list-disc list-inside text-gray-600">
              {adData.prices.map((price, index) => (
                <li key={index}>
                  {typeof price === "object"
                    ? `${price.amount} ${price.unit} - ${price.time}`
                    : price}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Nenhum preço informado</p>
          )}
        </div>

        {/* Contatos */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Contatos</h3>
          {adData.contact && adData.contact.length > 0 ? (
            <ul className="list-disc list-inside text-gray-600">
              {adData.contact.map((contact, index) => (
                <li key={index}>{contact}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Nenhum contato informado</p>
          )}
        </div>

        {/* Status VIP */}
        {adData.vip && (
          <div className="mt-4 text-yellow-500 font-bold text-center">
            ★ Anúncio VIP ★
          </div>
        )}

        {/* Botão Voltar */}
        <button
          onClick={() => router.back()}
          className="w-full p-2 mt-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}

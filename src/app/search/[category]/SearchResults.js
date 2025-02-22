// SearchResults.js (Client Component)
"use client"; // Importante: esta diretiva indica que o componente roda no cliente

import { useSearchParams } from "next/navigation";

export default function SearchResults({ ads, category }) {
  const searchParams = useSearchParams();
  const city = searchParams.get("city") || "";
  const radius = searchParams.get("radius") || "10";

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">
        {category === "all" ? "Todos os Anúncios" : `Resultados para ${category}`}
      </h1>
      <p className="text-gray-600">Cidade: {city} | Raio: {radius} milhas</p>

      {ads.length === 0 ? (
        <p className="text-center text-gray-500">Nenhum anúncio encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {ads.map((ad) => (
            <div key={ad.id} className="p-4 border rounded-lg shadow-md">
              <img
                src={ad.image || "/placeholder.jpg"}
                alt={ad.title}
                className="w-full h-40 object-cover rounded"
              />
              <h2 className="text-xl font-semibold mt-2">{ad.title}</h2>
              <p className="text-gray-500">
                {ad.city} • £{ad.price}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

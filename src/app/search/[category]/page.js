import { useSearchParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function SearchPage({ params }) {
  const { category } = params;
  const searchParams = useSearchParams();
  const city = searchParams.get("city") || "";
  const radius = searchParams.get("radius") || "10";

  // 🔥 Buscar os anúncios do Firestore
  let adsRef = collection(db, "ads");
  let q;

  if (category === "all") {
    // Se for "all", busca TODOS os anúncios
    q = query(adsRef);
  } else {
    // Busca somente os da categoria selecionada
    q = query(adsRef, where("category", "==", category));
  }

  const querySnapshot = await getDocs(q);
  const ads = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
          {ads.map(ad => (
            <div key={ad.id} className="p-4 border rounded-lg shadow-md">
              <img src={ad.image || "/placeholder.jpg"} alt={ad.title} className="w-full h-40 object-cover rounded" />
              <h2 className="text-xl font-semibold mt-2">{ad.title}</h2>
              <p className="text-gray-500">{ad.city} • £{ad.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

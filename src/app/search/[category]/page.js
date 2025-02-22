// page.js (Server Component)
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SearchResults from "./SearchResults"; // componente client

export default async function SearchPage({ params }) {
  const { category } = params;

  // Buscar os anúncios do Firestore
  const adsRef = collection(db, "ads");
  let q;

  if (category === "all") {
    // Se for "all", busca TODOS os anúncios
    q = query(adsRef);
  } else {
    // Busca somente os da categoria selecionada
    q = query(adsRef, where("category", "==", category));
  }

  const querySnapshot = await getDocs(q);
  const ads = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Passa os dados para o componente client
  return <SearchResults ads={ads} category={category} />;
}

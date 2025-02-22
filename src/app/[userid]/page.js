"use client";
import { useAuth } from "@/lib/protectRoute";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import app from "@/lib/firebase";
import { logout } from "@/lib/auth";

export default function UserDashboard() {
  const { userid } = useParams(); // Obtém o ID do usuário da URL
  const user = useAuth(); // Verifica se o usuário está autenticado
  const [userData, setUserData] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState("perfil"); // Estado para controle do menu selecionado
  const db = getFirestore(app);
  const router = useRouter(); // Para redirecionamento

  useEffect(() => {
    if (userid) {
      const fetchUserData = async () => {
        const docRef = doc(db, "users", userid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);

          // Se o setup ainda não foi feito, redireciona para a página de configuração
          if (data.setup === false) {
            router.push(`/../setup`);
          }
        } else {
          setUserData(null);
        }
      };

      fetchUserData();
    }
  }, [userid, router, db]);

  const handleLogout = async () => {
    await logout();
    router.push("/auth"); // Redireciona para a tela de login após logout
  };

  const handleCreateAd = () => {
    router.push(`/../ads`); // Redireciona para a página de criação de anúncios
  };

  // Função para renderizar o conteúdo de acordo com a opção selecionada
  const renderContent = () => {
    switch (selectedMenu) {
      case "perfil":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Perfil</h2>
            <p>Nome: {userData?.name || "Não disponível"}</p>
            <p>Email: {userData?.email || "Não disponível"}</p>
          </div>
        );
      case "anuncios":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Anúncios</h2>
            <button
              onClick={handleCreateAd}
              className="w-full p-2 mt-4 bg-green-500 text-white rounded"
            >
              Criar Anúncio
            </button>
            {/* Aqui você pode adicionar a listagem dos anúncios do usuário */}
          </div>
        );
      case "financeiro":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Financeiro</h2>
            <p>Aqui você verá seu histórico financeiro e faturas.</p>
          </div>
        );
      case "configuracoes":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Configurações</h2>
            <p>Atualize suas informações e preferências.</p>
          </div>
        );
      default:
        return null;
    }
  };

  if (!user) return <p>Carregando...</p>;

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p>{userData?.name || "Usuário"}</p>
        </div>
        <nav className="p-6">
          <ul>
            <li>
              <button
                className={`w-full text-left py-2 px-4 rounded ${
                  selectedMenu === "perfil" ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                }`}
                onClick={() => setSelectedMenu("perfil")}
              >
                Perfil
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left py-2 px-4 rounded ${
                  selectedMenu === "anuncios" ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                }`}
                onClick={() => setSelectedMenu("anuncios")}
              >
                Anúncios
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left py-2 px-4 rounded ${
                  selectedMenu === "financeiro" ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                }`}
                onClick={() => setSelectedMenu("financeiro")}
              >
                Financeiro
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left py-2 px-4 rounded ${
                  selectedMenu === "configuracoes" ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                }`}
                onClick={() => setSelectedMenu("configuracoes")}
              >
                Configurações
              </button>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="w-full text-left py-2 px-4 rounded mt-4 bg-red-500 text-white hover:bg-red-600"
              >
                Sair da Conta
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {renderContent()}
      </main>
    </div>
  );
}

"use client";
import { useAuth } from "@/lib/protectRoute";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import app from "@/lib/firebase";
import { logout } from "@/lib/auth";

// Importação dos componentes de cada seção
import Perfil from "./components/perfil";
import Ads from "./components/ads";
import Finance from "./components/finance";
import Conf from "./components/conf";
import CreateAds from "./components/createads"; // Novo componente para criar ADS

export default function UserDashboard() {
  const { userid } = useParams(); // Obtém o ID do usuário da URL
  const user = useAuth(); // Verifica se o usuário está autenticado
  const [userData, setUserData] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState("perfil"); // Estado para controle do menu selecionado
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

          // Se setup = false, redireciona para a página de configuração
          if (data.setup === false) {
            router.push(`/setup`);
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
    setSelectedMenu("createads");
  };

  // Função para renderizar o conteúdo de acordo com a opção selecionada
  const renderContent = () => {
    switch (selectedMenu) {
      case "perfil":
        return <Perfil userData={userData} />;
      case "analitics":
        return <Ads />;
      case "createads":
        return <CreateAds />;
      case "financeiro":
        return <Finance />;
      case "configuracoes":
        return <Conf />;
      default:
        return <p>Selecione uma opção do menu.</p>;
    }
  };

  if (!user) return <p>Carregando...</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header Mobile */}
      <header className="bg-white shadow-md md:hidden flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="text-gray-600 focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar para Desktop */}
        <aside className="hidden md:block w-64 bg-white shadow-md">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-gray-700">{userData?.name || "Usuário"}</p>
          </div>
          <nav className="p-6">
            <ul>
              <li>
                <button
                  className={`w-full text-left py-2 px-4 rounded ${
                    selectedMenu === "perfil"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setSelectedMenu("perfil")}
                >
                  Perfil
                </button>
              </li>
              <li className="mt-2">
                <button
                  className={`w-full text-left py-2 px-4 rounded ${
                    selectedMenu === "analitics"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setSelectedMenu("analitics")}
                >
                  Analitics
                </button>
              </li>
              <li className="mt-2">
                <button
                  className={`w-full text-left py-2 px-4 rounded ${
                    selectedMenu === "createads"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-200 text-gray-700"
                  }`}
                  onClick={handleCreateAd}
                >
                  Create ADS
                </button>
              </li>
              <li className="mt-2">
                <button
                  className={`w-full text-left py-2 px-4 rounded ${
                    selectedMenu === "financeiro"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setSelectedMenu("financeiro")}
                >
                  Financeiro
                </button>
              </li>
              <li className="mt-2">
                <button
                  className={`w-full text-left py-2 px-4 rounded ${
                    selectedMenu === "configuracoes"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-200 text-gray-700"
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

        {/* Mobile Sidebar Off-canvas */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="w-64 bg-white shadow-md">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold">Dashboard</h1>
                  <p className="text-gray-700">{userData?.name || "Usuário"}</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-600 focus:outline-none"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="p-6">
                <ul>
                  <li>
                    <button
                      className={`w-full text-left py-2 px-4 rounded ${
                        selectedMenu === "perfil"
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => {
                        setSelectedMenu("perfil");
                        setMobileMenuOpen(false);
                      }}
                    >
                      Perfil
                    </button>
                  </li>
                  <li className="mt-2">
                    <button
                      className={`w-full text-left py-2 px-4 rounded ${
                        selectedMenu === "analitics"
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => {
                        setSelectedMenu("analitics");
                        setMobileMenuOpen(false);
                      }}
                    >
                      Analitics
                    </button>
                  </li>
                  <li className="mt-2">
                    <button
                      className={`w-full text-left py-2 px-4 rounded ${
                        selectedMenu === "createads"
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => {
                        handleCreateAd();
                        setMobileMenuOpen(false);
                      }}
                    >
                      Create ADS
                    </button>
                  </li>
                  <li className="mt-2">
                    <button
                      className={`w-full text-left py-2 px-4 rounded ${
                        selectedMenu === "financeiro"
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => {
                        setSelectedMenu("financeiro");
                        setMobileMenuOpen(false);
                      }}
                    >
                      Financeiro
                    </button>
                  </li>
                  <li className="mt-2">
                    <button
                      className={`w-full text-left py-2 px-4 rounded ${
                        selectedMenu === "configuracoes"
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => {
                        setSelectedMenu("configuracoes");
                        setMobileMenuOpen(false);
                      }}
                    >
                      Configurações
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left py-2 px-4 rounded mt-4 bg-red-500 text-white hover:bg-red-600"
                    >
                      Sair da Conta
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
            {/* Overlay para fechar o menu */}
            <div
              className="flex-1 bg-black opacity-50"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
          </div>
        )}

        {/* Conteúdo Principal */}
        <main className="flex-1 p-6">{renderContent()}</main>
      </div>
    </div>
  );
}

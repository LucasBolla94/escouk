"use client"; // Garantindo que este componente é do lado do cliente

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "../../lib/firebase"; // Caminho ajustado

export default function NavBar() {
  const router = useRouter();
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [isOpaque, setIsOpaque] = useState(true);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false); // Estado para o menu mobile

  // Monitorando o estado de autenticação do Firebase
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Lógica para alterar a opacidade com base no scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      if (currentScrollPos > prevScrollPos) {
        setIsOpaque(false);
      } else {
        setIsOpaque(true);
      }
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos]);

  // Redirecionamento condicional: se estiver logado, vai para Dashboard; caso contrário, para Login
  const handleButtonClick = () => {
    if (user) {
      router.push(`../dashboard/`);
    } else {
      router.push("/auth");
    }
  };

  return (
    <header
      className={`w-full fixed top-0 left-0 z-50 p-4 flex flex-col md:flex-row justify-between items-center transition-colors duration-300 ${
        isOpaque ? "bg-white bg-opacity-100 shadow-md" : "bg-white bg-opacity-80 shadow-md"
      }`}
    >
      <div className="w-full flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-bold text-blue-500 cursor-pointer">Esco UK</h1>
        </Link>
        {/* Botão Hamburger para Mobile */}
        <button
          className="md:hidden text-blue-500 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        {/* Navegação para Desktop */}
        <nav className="hidden md:flex space-x-4">
          <button
            onClick={handleButtonClick}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {user ? "Dashboard" : "Login"}
          </button>
          <Link href="/sobre" className="px-4 py-2 text-blue-500 hover:text-blue-700">
            Sobre
          </Link>
          <Link href="/contato" className="px-4 py-2 text-blue-500 hover:text-blue-700">
            Contato
          </Link>
        </nav>
      </div>
      {/* Navegação para Mobile */}
      {menuOpen && (
        <nav className="mt-4 md:hidden flex flex-col space-y-2 w-full">
          <button
            onClick={handleButtonClick}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded"
          >
            {user ? "Dashboard" : "Login"}
          </button>
          <Link href="/sobre" className="w-full px-4 py-2 text-blue-500 hover:text-blue-700">
            Sobre
          </Link>
          <Link href="/contato" className="w-full px-4 py-2 text-blue-500 hover:text-blue-700">
            Contato
          </Link>
        </nav>
      )}
    </header>
  );
}

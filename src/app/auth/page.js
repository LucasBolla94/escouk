"use client";
import { useState, useEffect } from "react";
import { signUpWithEmail, signInWithEmail, signInWithGoogle, logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc 
} from "firebase/firestore";
import app from "@/lib/firebase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refferCode, setRefferCode] = useState(""); // Campo para o código de referência
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore(app);

  // Se o usuário já estiver logado, redireciona automaticamente para o dashboard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push(`/dashboard/`);
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  // Função que trata a autenticação (login ou cadastro)
  const handleAuth = async () => {
    let user;

    if (isLogin) {
      // Caso seja login, apenas efetua a autenticação com email e senha
      user = await signInWithEmail(email, password);
    } else {
      // Cadastro: processa o código de referência (se informado) e cria o usuário
      let referralBonus = 0;
      let referralBonusType = null;

      // Se o usuário informou um código de referência
      if (refferCode.trim() !== "") {
        try {
          // Consulta o documento correspondente na coleção 'reffer-code'
          const refferDocRef = doc(db, "reffer-code", refferCode);
          const refferDocSnap = await getDoc(refferDocRef);

          if (refferDocSnap.exists()) {
            const refferData = refferDocSnap.data();
            // Verifica se o código ainda não foi utilizado
            if (refferData.used === false) {
              referralBonus = refferData.bonus; // Valor do bônus
              referralBonusType = refferData["bonus-type"]; // false: ganha crédito; true: ganha % de desconto
            } else {
              alert("Código de referência já foi utilizado.");
              return;
            }
          } else {
            alert("Código de referência inválido.");
            return;
          }
        } catch (error) {
          console.error("Erro ao verificar o código de referência:", error);
          alert("Erro ao validar o código de referência.");
          return;
        }
      }

      // Cria o usuário com email e senha
      user = await signUpWithEmail(email, password);

      if (user) {
        // Se houver um código de referência válido e o bônus for do tipo crédito (bonus-type false)
        if (refferCode.trim() !== "" && referralBonusType === false) {
          try {
            // Atualiza o documento do usuário na coleção 'users', adicionando o bônus ao 'balance'
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, { balance: referralBonus }, { merge: true });
          } catch (error) {
            console.error("Erro ao atualizar o saldo do usuário:", error);
          }
        }

        // Após processar o bônus, marca o código de referência como usado
        if (refferCode.trim() !== "") {
          try {
            const refferDocRef = doc(db, "reffer-code", refferCode);
            await updateDoc(refferDocRef, { used: true });
          } catch (error) {
            console.error("Erro ao atualizar o código de referência:", error);
          }
        }
      }
    }

    if (user) {
      // Após login ou cadastro bem-sucedido, redireciona para a área do usuário
      router.push(`/app/${user.uid}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-80">
        <h2 className="text-xl font-semibold mb-4">
          {isLogin ? "Login" : "Cadastro"}
        </h2>

        {/* Campo de email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Campo de senha */}
        <input
          type="password"
          placeholder="Senha"
          className="w-full p-2 mb-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Campo de Reffer Code é exibido apenas no cadastro */}
        {!isLogin && (
          <input
            type="text"
            placeholder="Reffer Code"
            className="w-full p-2 mb-2 border rounded"
            value={refferCode}
            onChange={(e) => setRefferCode(e.target.value)}
          />
        )}

        <button 
          onClick={handleAuth} 
          className="w-full p-2 bg-blue-500 text-white rounded"
        >
          {isLogin ? "Entrar" : "Cadastrar"}
        </button>

        <button 
          onClick={signInWithGoogle} 
          className="w-full p-2 mt-2 bg-red-500 text-white rounded"
        >
          Login com Google
        </button>

        <p className="mt-4 text-sm">
          {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
          <button 
            className="text-blue-500" 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Cadastre-se" : "Faça login"}
          </button>
        </p>

        <button 
          onClick={logout} 
          className="w-full p-2 mt-4 bg-gray-500 text-white rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

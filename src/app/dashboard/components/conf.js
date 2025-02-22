"use client";
import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import app from "@/lib/firebase";
import { useAuth } from "@/lib/protectRoute";

export default function Conf() {
  const db = getFirestore(app);
  const user = useAuth();
  
  const [configData, setConfigData] = useState({
    name: "",
    email: "",
    phone: "",
    isProfilePublic: true, // Perfil visível para todos ou restrito
    emailNotifications: true, // Notificações por email
    pushNotifications: true, // Notificações push
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserConfig();
    }
  }, [user]);

  // Busca as configurações do usuário no Firestore
  const fetchUserConfig = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        setConfigData(docSnap.data());
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
    }
  };

  // Atualiza as configurações do usuário no Firestore
  const handleSaveConfig = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, configData);
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Configurações</h2>

      {/* Nome */}
      <div className="mb-4">
        <label className="block text-gray-700">Nome</label>
        <input
          type="text"
          value={configData.name}
          onChange={(e) => setConfigData({ ...configData, name: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Email (desabilitado) */}
      <div className="mb-4">
        <label className="block text-gray-700">Email</label>
        <input
          type="email"
          value={configData.email}
          disabled
          className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
        />
      </div>

      {/* Telefone */}
      <div className="mb-4">
        <label className="block text-gray-700">Telefone</label>
        <input
          type="text"
          value={configData.phone}
          onChange={(e) => setConfigData({ ...configData, phone: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="(XX) 99999-9999"
        />
      </div>

      {/* Privacidade do Perfil */}
      <div className="mb-4">
        <label className="block text-gray-700">Perfil Público</label>
        <select
          value={configData.isProfilePublic}
          onChange={(e) => setConfigData({ ...configData, isProfilePublic: e.target.value === "true" })}
          className="w-full p-2 border rounded"
        >
          <option value="true">Visível para todos</option>
          <option value="false">Somente para seguidores</option>
        </select>
      </div>

      {/* Notificações */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Notificações</h3>

        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            checked={configData.emailNotifications}
            onChange={(e) => setConfigData({ ...configData, emailNotifications: e.target.checked })}
            className="mr-2"
          />
          <label className="text-gray-700">Receber notificações por email</label>
        </div>

        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            checked={configData.pushNotifications}
            onChange={(e) => setConfigData({ ...configData, pushNotifications: e.target.checked })}
            className="mr-2"
          />
          <label className="text-gray-700">Receber notificações push</label>
        </div>
      </div>

      {/* Botão de Salvar */}
      <button
        onClick={handleSaveConfig}
        className="w-full p-2 bg-blue-500 text-white rounded"
        disabled={loading}
      >
        {loading ? "Salvando..." : "Salvar Configurações"}
      </button>
    </div>
  );
}

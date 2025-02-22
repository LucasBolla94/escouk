"use client";
import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, updateProfile } from "firebase/auth";
import app from "@/lib/firebase";
import { useAuth } from "@/lib/protectRoute";

export default function Perfil() {
  const db = getFirestore(app);
  const auth = getAuth(app);
  const user = useAuth();
  
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    photoURL: "",
  });
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Busca os dados do usuário no Firestore
  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData({
          name: data.name || "",
          email: data.email || user.email || "",
          photoURL: data.photoURL || "",
        });
        setNewName(data.name || "");
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  };

  // Atualiza o nome do usuário no Firestore e Firebase Auth
  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { name: newName });

      await updateProfile(auth.currentUser, { displayName: newName });

      setUserData((prev) => ({ ...prev, name: newName }));
      setEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Perfil</h2>

      {/* Foto de Perfil */}
      <div className="flex items-center space-x-4">
        <img
          src={userData.photoURL || "/default-avatar.png"}
          alt="Foto de Perfil"
          className="w-16 h-16 rounded-full border"
        />
        <div>
          <p className="text-lg font-semibold">{userData.name}</p>
          <p className="text-gray-600">{userData.email}</p>
        </div>
      </div>

      {/* Edição do Nome */}
      {editing ? (
        <div className="mt-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border rounded p-2 w-full"
          />
          <button
            onClick={handleUpdateProfile}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
          >
            Salvar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Editar Nome
        </button>
      )}
    </div>
  );
}

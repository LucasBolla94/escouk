"use client";
import { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "firebase/firestore";
import app from "@/lib/firebase";

export default function AdminPanel() {
  const db = getFirestore(app);
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({ label: "", dbField: "", type: "text", required: false });
  const [loading, setLoading] = useState(false);

  // Buscar os campos já existentes no Firestore
  useEffect(() => {
    const fetchFields = async () => {
      const querySnapshot = await getDocs(collection(db, "setupFields"));
      const fetchedFields = [];
      querySnapshot.forEach((doc) => {
        fetchedFields.push({ id: doc.id, ...doc.data() });
      });
      setFields(fetchedFields);
    };

    fetchFields();
  }, []);

  // Adicionar campo ao Firestore
  const handleAddField = async () => {
    if (!newField.label.trim()) return alert("Digite um nome para o campo!");
    if (!newField.dbField.trim()) return alert("Digite o nome da propriedade no banco!");

    setLoading(true);
    try {
      const fieldData = {
        label: newField.label.trim(),
        dbField: newField.dbField.trim(),
        type: newField.type,
        required: newField.required,
      };

      const docRef = await addDoc(collection(db, "setupFields"), fieldData);
      setFields([...fields, { id: docRef.id, ...fieldData }]);
      setNewField({ label: "", dbField: "", type: "text", required: false });
    } catch (error) {
      console.error("Erro ao adicionar campo:", error);
      alert("Erro ao adicionar campo.");
    }
    setLoading(false);
  };

  // Remover campo
  const handleDeleteField = async (fieldId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "setupFields", fieldId));
      setFields(fields.filter((field) => field.id !== fieldId));
    } catch (error) {
      console.error("Erro ao remover campo:", error);
      alert("Erro ao remover campo.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
      <h2 className="text-3xl font-bold mb-6">Painel do Administrador</h2>

      {/* Criar Novo Campo */}
      <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-3xl flex items-center space-x-4">
        <input
          type="text"
          className="w-1/4 p-2 border rounded"
          placeholder="Nome da pergunta"
          value={newField.label}
          onChange={(e) => setNewField({ ...newField, label: e.target.value })}
        />

        <input
          type="text"
          className="w-1/4 p-2 border rounded"
          placeholder="Nome da propriedade (DB)"
          value={newField.dbField}
          onChange={(e) => setNewField({ ...newField, dbField: e.target.value })}
        />

        <select
          className="w-1/4 p-2 border rounded"
          value={newField.type}
          onChange={(e) => setNewField({ ...newField, type: e.target.value })}
        >
          <option value="text">Texto</option>
          <option value="number">Número</option>
          <option value="date">Data</option>
          <option value="file">Enviar Foto</option>
          <option value="select">Seleção</option>
        </select>

        <div className="flex items-center">
          <input
            type="checkbox"
            className="mr-2"
            checked={newField.required}
            onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
          />
          <label className="text-gray-700">Obrigatório</label>
        </div>

        <button
          onClick={handleAddField}
          className="p-2 bg-blue-500 text-white rounded"
          disabled={loading}
        >
          {loading ? "Adicionando..." : "Adicionar"}
        </button>
      </div>

      {/* Lista de Campos Criados */}
      <div className="mt-6 w-full max-w-3xl">
        <h3 className="text-lg font-semibold mb-4">Campos Criados</h3>
        {fields.length > 0 ? (
          <table className="w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Pergunta</th>
                <th className="p-2 text-left">Propriedade no DB</th>
                <th className="p-2 text-left">Tipo</th>
                <th className="p-2 text-left">Obrigatório</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.id} className="border-b">
                  <td className="p-2">{field.label}</td>
                  <td className="p-2 text-blue-600">{field.dbField}</td>
                  <td className="p-2">{field.type}</td>
                  <td className="p-2">{field.required ? "✅ Sim" : "❌ Não"}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDeleteField(field.id)}
                      className="p-2 bg-red-500 text-white rounded"
                      disabled={loading}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">Nenhum campo cadastrado.</p>
        )}
      </div>
    </div>
  );
}

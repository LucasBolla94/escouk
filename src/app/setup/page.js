"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "@/lib/firebase";

export default function SetupPage() {
  const router = useRouter();
  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");

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

  const handleNext = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const field = fields[currentIndex];
    let valueToStore = inputValue;

    // Upload de arquivos para Firebase Storage
    if (field.type === "file" && inputValue) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileRef = ref(storage, `users/${user.uid}/${field.dbField}_${timestamp}`);
      await uploadBytes(fileRef, inputValue);
      valueToStore = await getDownloadURL(fileRef);
    }

    const updatedFormData = { ...formData, [field.dbField]: valueToStore };
    setFormData(updatedFormData);
    setInputValue("");
    setCurrentIndex(currentIndex + 1);

    await setDoc(doc(db, "users", user.uid), updatedFormData, { merge: true });
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setInputValue(formData[fields[currentIndex - 1]?.dbField] || "");
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleEdit = (dbField) => {
    setInputValue(formData[dbField] || "");
    setCurrentIndex(fields.findIndex(field => field.dbField === dbField));
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "users", user.uid), { setup: true }, { merge: true });
    }
    console.log("Dados do formulário:", formData);
    alert("Formulário enviado com sucesso!");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Configuração do Perfil</h2>

        {/* Lista de respostas já preenchidas */}
        <ul className="mb-4 opacity-75">
          {Object.entries(formData).map(([dbField, value]) => (
            <li key={dbField} className="flex items-center gap-2 text-gray-700">
              ✅ {fields.find(field => field.dbField === dbField)?.label}: {value} 
              <button onClick={() => handleEdit(dbField)} className="ml-2 text-blue-500">✏️</button>
            </li>
          ))}
        </ul>

        {/* Exibir a etapa atual */}
        {fields.length > 0 && currentIndex < fields.length ? (
          <div className="mb-3">
            <label className="block text-gray-700">{fields[currentIndex].label}</label>

            {fields[currentIndex].type === "text" && (
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={inputValue}
                required={fields[currentIndex].required}
                onChange={(e) => setInputValue(e.target.value)}
              />
            )}

            {fields[currentIndex].type === "number" && (
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={inputValue}
                required={fields[currentIndex].required}
                onChange={(e) => setInputValue(e.target.value)}
              />
            )}

            {fields[currentIndex].type === "date" && (
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={inputValue}
                required={fields[currentIndex].required}
                onChange={(e) => setInputValue(e.target.value)}
              />
            )}

            {fields[currentIndex].type === "file" && (
              <input
                type="file"
                className="w-full p-2 border rounded"
                required={fields[currentIndex].required}
                onChange={(e) => setInputValue(e.target.files[0])}
              />
            )}

            {fields[currentIndex].type === "select" && Array.isArray(fields[currentIndex].options) && (
              <select
                className="w-full p-2 border rounded"
                value={inputValue}
                required={fields[currentIndex].required}
                onChange={(e) => setInputValue(e.target.value)}
              >
                <option value="">Selecione uma opção</option>
                {fields[currentIndex].options.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            )}

            {/* Botões de Navegação */}
            <div className="flex justify-between mt-4">
              {currentIndex > 0 && (
                <button onClick={handleBack} className="p-2 bg-gray-500 text-white rounded">
                  Voltar
                </button>
              )}
              {inputValue && (
                <button onClick={handleNext} className="p-2 bg-blue-500 text-white rounded">
                  Próximo
                </button>
              )}
            </div>
          </div>
        ) : (
          <button onClick={handleSubmit} className="w-full p-2 bg-green-500 text-white rounded mt-4">
            Finalizar
          </button>
        )}
      </div>
    </div>
  );
}

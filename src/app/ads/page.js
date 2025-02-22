"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "@/lib/firebase";

export default function CreateAdPage() {
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth(app);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Verifica se o usuário está autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("../auth"); // Redireciona para a tela de login se não estiver autenticado
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Estado dos campos do formulário
  const [tittle, setTittle] = useState("");
  const [content, setContent] = useState("");
  const [album, setAlbum] = useState([]);
  const [prices, setPrices] = useState([""]); // Array de preços
  const [contact, setContact] = useState([""]); // Array de contatos
  const [vip, setVip] = useState(false); // Padrão: false

  // Adiciona novo campo de preço
  const addPriceField = () => setPrices([...prices, ""]);

  // Atualiza um campo de preço
  const updatePrice = (index, value) => {
    const newPrices = [...prices];
    newPrices[index] = value;
    setPrices(newPrices);
  };

  // Adiciona novo campo de contato
  const addContactField = () => setContact([...contact, ""]);

  // Atualiza um campo de contato
  const updateContact = (index, value) => {
    const newContacts = [...contact];
    newContacts[index] = value;
    setContact(newContacts);
  };

  // Lida com o upload das imagens
  const handleAlbumUpload = async (files) => {
    setLoading(true);
    const uploadedImages = [];

    for (let file of files) {
      const storageRef = ref(storage, `ads/${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      uploadedImages.push(imageUrl);
    }

    setAlbum(uploadedImages);
    setLoading(false);
  };

  // Lida com o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tittle || !content) return alert("Preencha todos os campos obrigatórios!");

    setLoading(true);
    try {
      // Ao criar o anúncio, adicionamos o campo 'createdBy' para salvar o ID do usuário que criou o anúncio.
      await addDoc(collection(db, "ads"), {
        createdBy: user?.uid, // ID do usuário que criou o anúncio
        tittle,
        content,
        album,
        prices,
        contact,
        vip, // Salva o status VIP corretamente (true se marcado, false se não)
      });

      alert("Anúncio criado com sucesso!");
      router.push(`/${user?.uid}`); // Redireciona para o perfil do usuário
    } catch (error) {
      console.error("Erro ao criar anúncio:", error);
      alert("Erro ao criar anúncio. Tente novamente.");
    }
    setLoading(false);
  };

  if (!user) {
    return <p className="text-center mt-10 text-gray-700">Verificando autenticação...</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Criar Novo Anúncio</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-gray-700">Título</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={tittle}
              onChange={(e) => setTittle(e.target.value)}
              required
            />
          </div>

          {/* Conteúdo */}
          <div>
            <label className="block text-gray-700">Conteúdo</label>
            <textarea
              className="w-full p-2 border rounded"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* Upload de Imagens */}
          <div>
            <label className="block text-gray-700">Álbum de Imagens</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="w-full p-2 border rounded"
              onChange={(e) => handleAlbumUpload(e.target.files)}
            />
            {loading && <p className="text-blue-500 text-sm">Enviando imagens...</p>}
            {album.length > 0 && (
              <div className="flex space-x-2 mt-2">
                {album.map((img, index) => (
                  <img key={index} src={img} alt="Prévia" className="w-16 h-16 rounded-md" />
                ))}
              </div>
            )}
          </div>

          {/* Preços */}
          <div>
            <label className="block text-gray-700">Preços</label>
            {prices.map((price, index) => (
              <input
                key={index}
                type="text"
                className="w-full p-2 border rounded mt-1"
                placeholder="Ex: R$100/hora"
                value={price}
                onChange={(e) => updatePrice(index, e.target.value)}
              />
            ))}
            <button type="button" onClick={addPriceField} className="text-blue-500 mt-1">
              + Adicionar mais preços
            </button>
          </div>

          {/* Contato */}
          <div>
            <label className="block text-gray-700">Contato</label>
            {contact.map((c, index) => (
              <input
                key={index}
                type="text"
                className="w-full p-2 border rounded mt-1"
                placeholder="Ex: WhatsApp (XX) 99999-9999"
                value={c}
                onChange={(e) => updateContact(index, e.target.value)}
              />
            ))}
            <button type="button" onClick={addContactField} className="text-blue-500 mt-1">
              + Adicionar mais contatos
            </button>
          </div>

          {/* VIP */}
          <div className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={vip}
              onChange={(e) => setVip(e.target.checked)}
            />
            <label className="text-gray-700">VIP</label>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded"
            disabled={loading}
          >
            {loading ? "Criando..." : "Criar Anúncio"}
          </button>
        </form>
      </div>
    </div>
  );
}

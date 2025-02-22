"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "@/lib/firebase";

function formatPrice(input) {
  // Remove qualquer caractere não-numérico
  let digits = input.replace(/\D/g, "");
  if (!digits) return "";
  let num = parseInt(digits, 10);
  // Divide por 100 para obter dólares e centavos
  let dollars = Math.floor(num / 100);
  let cents = num % 100;
  // Garante que haverá pelo menos 2 dígitos para a parte inteira
  let dollarsStr = dollars < 10 ? "0" + dollars : dollars.toString();
  let centsStr = cents < 10 ? "0" + cents : cents.toString();
  return dollarsStr + "." + centsStr;
}

export default function CreateAds() {
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth(app);

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // Para obter o balance do usuário
  const [vipPrice, setVipPrice] = useState(null); // Valor VIP vindo do Firestore
  const [loading, setLoading] = useState(false);

  // Constante para duração máxima de vídeo (em segundos) – facilmente ajustável
  const VIDEO_DURATION_LIMIT = 10;

  // Detecta se é mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Busca o valor do VIP do Firestore
  useEffect(() => {
    const fetchVipPrice = async () => {
      const vipDocRef = doc(db, "vip_price", "vip-price");
      const vipSnap = await getDoc(vipDocRef);
      if (vipSnap.exists()) {
        setVipPrice(vipSnap.data().price);
      } else {
        console.error("Documento VIP não encontrado");
      }
    };
    fetchVipPrice();
  }, [db]);

  // Verifica se o usuário está autenticado e obtém dados adicionais
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
      } else {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      }
    });
    return () => unsubscribe();
  }, [router, auth, db]);

  // Estados dos campos do formulário
  const [tittle, setTittle] = useState("");
  const [content, setContent] = useState("");
  const [album, setAlbum] = useState([]);
  const [videos, setVideos] = useState([]);

  // Preços – array de objetos { amount, time, unit }
  const [prices, setPrices] = useState([{ amount: "", time: "", unit: "hrs" }]);
  const addPriceField = () =>
    setPrices([...prices, { amount: "", time: "", unit: "hrs" }]);
  const updatePrice = (index, field, value) => {
    // Se for o campo "amount", formata dinamicamente
    if (field === "amount") {
      const formatted = formatPrice(value);
      const newPrices = [...prices];
      newPrices[index] = { ...newPrices[index], [field]: formatted };
      setPrices(newPrices);
    } else {
      const newPrices = [...prices];
      newPrices[index] = { ...newPrices[index], [field]: value };
      setPrices(newPrices);
    }
  };

  // Contatos – array de objetos { code, number, customCode? }
  const [contacts, setContacts] = useState([{ code: "+44", number: "" }]);
  const addContactField = () =>
    setContacts([...contacts, { code: "+44", number: "" }]);
  const updateContact = (index, field, value) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setContacts(newContacts);
  };

  // Estado VIP com toggle e tooltip
  const [vip, setVip] = useState(false);
  const [showVipInfo, setShowVipInfo] = useState(false);

  // Limites de upload de mídia
  const photoLimit = vip ? 10 : 3;
  const videoLimit = vip ? 3 : 1;

  // Ref para input de mídia unificado
  const mediaInputRef = useRef(null);

  // Dispara o input de mídia
  const triggerMediaUpload = () => {
    if (album.length < photoLimit || videos.length < videoLimit) {
      mediaInputRef.current.click();
    } else {
      alert("Limite de mídia atingido.");
    }
  };

  // Função para verificar a duração do vídeo
  const checkVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = url;
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        if (video.duration > VIDEO_DURATION_LIMIT) {
          reject(video.duration);
        } else {
          resolve(video.duration);
        }
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject("Erro ao carregar metadados do vídeo");
      };
    });
  };

  // Lida com o upload dos arquivos (imagens e vídeos)
  const handleMediaUpload = async (files) => {
    setLoading(true);
    let currentPhotoCount = album.length;
    let currentVideoCount = videos.length;
    for (let file of files) {
      if (file.type.startsWith("image/")) {
        if (currentPhotoCount < photoLimit) {
          const storageRef = ref(storage, `ads/${file.name}`);
          await uploadBytes(storageRef, file);
          const imageUrl = await getDownloadURL(storageRef);
          currentPhotoCount++;
          setAlbum((prev) => [...prev, imageUrl].slice(0, photoLimit));
        } else {
          alert(`Limite de ${photoLimit} fotos atingido.`);
        }
      } else if (file.type.startsWith("video/")) {
        if (currentVideoCount < videoLimit) {
          try {
            await checkVideoDuration(file);
          } catch (duration) {
            alert(
              `Vídeo com duração de ${parseFloat(duration).toFixed(
                2
              )} segundos excede o limite de ${VIDEO_DURATION_LIMIT} segundos.`
            );
            continue;
          }
          const storageRef = ref(storage, `ads/videos/${file.name}`);
          await uploadBytes(storageRef, file);
          const videoUrl = await getDownloadURL(storageRef);
          currentVideoCount++;
          setVideos((prev) => [...prev, videoUrl].slice(0, videoLimit));
        } else {
          alert(`Limite de ${videoLimit} vídeos atingido.`);
        }
      }
    }
    setLoading(false);
  };

  // Lida com o envio do formulário (incluindo verificação final dos limites de mídia)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tittle || !content)
      return alert("Preencha todos os campos obrigatórios!");

    // Verifica os limites de mídia na submissão
    if (album.length > (vip ? 10 : 3) || videos.length > (vip ? 3 : 1)) {
      return alert("Quantidade de mídia excedida para este tipo de anúncio.");
    }

    if (vip) {
      if (!userData || userData.balance < vipPrice) {
        return alert("Saldo insuficiente para ativar o anúncio VIP.");
      }
      // Para atualizar o balance, descomente e ajuste conforme necessário:
      // const userDocRef = doc(db, "users", user.uid);
      // await updateDoc(userDocRef, { balance: userData.balance - vipPrice });
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "ads"), {
        createdBy: user?.uid,
        tittle,
        content,
        album,
        videos,
        prices,
        contacts,
        vip,
        status: "ativo",
        promoted: false,
      });
      alert("Anúncio criado com sucesso!");
      router.push("/"); // Redireciona para a tela principal
    } catch (error) {
      console.error("Erro ao criar anúncio:", error);
      alert("Erro ao criar anúncio. Tente novamente.");
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <p className="text-center mt-10 text-gray-700">
        Verificando autenticação...
      </p>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-4 text-center">Criar Novo Anúncio</h2>

        {/* Seção VIP */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <label className="inline-flex relative items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={vip}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (userData && userData.balance >= vipPrice) {
                      setVip(true);
                    } else {
                      alert("Saldo insuficiente para ativar o VIP.");
                    }
                  } else {
                    setVip(false);
                  }
                }}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
            <span className="ml-3 text-gray-700 font-semibold">VIP</span>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowVipInfo(!showVipInfo)}
              className="text-blue-500 hover:text-blue-700 focus:outline-none"
            >
              ?
            </button>
            {showVipInfo && (
              <div className="absolute right-0 mt-2 w-64 p-2 bg-white border border-gray-300 rounded shadow-md z-10">
                <p className="text-sm text-gray-700">
                  VIP são anúncios que ficam na frente de todos. Ao ativar VIP você poderá adicionar até 10 fotos e 3 vídeos de até 10 segundos, e será descontado {vipPrice} do seu saldo. Caso não seja VIP, você poderá adicionar 3 fotos e 1 vídeo de até 10 segundos.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Informações de limite de uploads */}
        <div className="mb-4 p-3 bg-gray-50 border rounded text-sm text-gray-600">
          {vip
            ? "Você pode adicionar até 10 fotos e 3 vídeos de até 10 segundos."
            : "Você pode adicionar até 3 fotos e 1 vídeo de até 10 segundos."}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-gray-700 mb-1">Título</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500"
              value={tittle}
              onChange={(e) => setTittle(e.target.value)}
              required
            />
          </div>
          {/* Conteúdo */}
          <div>
            <label className="block text-gray-700 mb-1">Conteúdo</label>
            {isMobile ? (
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite seu conteúdo (negrito e itálico disponíveis)"
                required
              />
            ) : (
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Editor de conteúdo rico (suporte a negrito, itálico, emojis, etc.)"
                required
              />
            )}
          </div>

          {/* Upload de Mídia (Fotos e Vídeos) */}
          <div>
            <label className="block text-gray-700 mb-1">Mídia</label>
            <div className="flex flex-wrap gap-3">
              {album.map((img, index) => (
                <img
                  key={`img-${index}`}
                  src={img}
                  alt="Prévia"
                  className="w-24 h-24 object-cover rounded-md"
                />
              ))}
              {videos.map((video, index) => (
                <video
                  key={`vid-${index}`}
                  src={video}
                  controls
                  className="w-24 h-24 object-cover rounded-md"
                />
              ))}
              {(album.length < photoLimit || videos.length < videoLimit) && (
                <button
                  type="button"
                  onClick={triggerMediaUpload}
                  className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:bg-gray-100"
                >
                  +
                </button>
              )}
            </div>
            <input
              type="file"
              accept="image/*, video/*"
              multiple
              ref={mediaInputRef}
              className="hidden"
              onChange={(e) => handleMediaUpload(e.target.files)}
            />
            {loading && (
              <p className="text-blue-500 text-sm mt-1">Enviando mídia...</p>
            )}
          </div>

          {/* Preços */}
          <div>
            <label className="block text-gray-700 mb-1">Preços</label>
            {prices.map((price, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row md:items-center gap-2 mt-2"
              >
                <div className="flex flex-col gap-1 w-full md:w-auto">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-semibold">£</span>
                    <input
                      type="text"
                      className="w-full md:w-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                      placeholder="Valor"
                      value={price.amount}
                      onChange={(e) => updatePrice(index, "amount", e.target.value)}
                      onBlur={(e) => updatePrice(index, "amount", formatPrice(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1 w-full md:w-auto">
                  <input
                    type="text"
                    maxLength={2}
                    className="w-full md:w-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                    placeholder="Tempo"
                    value={price.time}
                    onChange={(e) => updatePrice(index, "time", e.target.value)}
                  />
                  <select
                    className="w-full md:w-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                    value={price.unit}
                    onChange={(e) => updatePrice(index, "unit", e.target.value)}
                  >
                    <option value="hrs">hrs</option>
                    <option value="mins">mins</option>
                  </select>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addPriceField}
              className="text-blue-500 mt-2"
            >
              + Adicionar mais preços
            </button>
          </div>

          {/* Contato */}
          <div>
            <label className="block text-gray-700 mb-1">Contato</label>
            {contacts.map((contact, index) => (
              <div key={index} className="mt-2 flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                    value={contact.code}
                    onChange={(e) => updateContact(index, "code", e.target.value)}
                  >
                    <option value="+44">+44 (UK)</option>
                    <option value="other">Other</option>
                  </select>
                  {contact.code === "other" && (
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                      placeholder="+Country Code"
                      value={contact.customCode || ""}
                      onChange={(e) =>
                        updateContact(index, "customCode", e.target.value)
                      }
                    />
                  )}
                </div>
                <div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={11}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                    placeholder="Número de contato (11 dígitos)"
                    value={contact.number}
                    onChange={(e) =>
                      updateContact(index, "number", e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addContactField}
              className="text-blue-500 mt-2"
            >
              + Adicionar mais contatos
            </button>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            className="w-full p-3 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            {loading ? "Criando..." : "Criar Anúncio"}
          </button>
        </form>
      </div>
    </div>
  );
}

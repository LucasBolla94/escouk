const processPayment = async () => {
  try {
    const userId = "id-do-usuario-logado"; // Removido (ID vem do token)
    const amount = 100;

    // Obtém o token do usuário autenticado no Firebase
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }
    const token = await user.getIdToken();

    console.log("🔄 Enviando requisição com token...");

    const response = await fetch("/api/update-wallet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json();
    console.log("📩 Resposta da API:", data);

    if (!response.ok) {
      throw new Error(data.error || "Erro ao atualizar saldo.");
    }

    console.log("✅ Saldo atualizado com sucesso!");
  } catch (error) {
    console.error("❌ Erro na requisição:", error.message);
    setError(error.message);
  } finally {
    setLoading(false);
    setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
  }
};

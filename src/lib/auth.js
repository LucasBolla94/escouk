import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import app from "./firebase";

const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Salva informações do usuário no Firestore
const saveUserToFirestore = async (user) => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    name: user.displayName || "Usuário Anônimo",
    email: user.email,
    uid: user.uid,
  }, { merge: true });
};

// Registro com email e senha
export const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await saveUserToFirestore(user);
    return user;
  } catch (error) {
    console.error("Erro ao registrar usuário:", error.message);
  }
};

// Login com email e senha
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Erro ao fazer login:", error.message);
  }
};

// Login com Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    await saveUserToFirestore(result.user);
    return result.user;
  } catch (error) {
    console.error("Erro ao autenticar com Google:", error.message);
  }
};

// Função de logout
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao fazer logout:", error.message);
  }
};
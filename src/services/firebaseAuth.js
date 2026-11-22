import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Substitua pelos dados do seu projeto no Console do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBZlMfzBjGO4znlcoLcefa9kYg7MGWN41Q",
  authDomain: "fitflow-9f38b.firebaseapp.com",
  projectId: "fitflow-9f38b",
  storageBucket: "fitflow-9f38b.firebasestorage.app",
  messagingSenderId: "703975034950",
  appId: "1:703975034950:web:a3aed424d6f75b23d23a47",
  measurementId: "G-XCHRKE47BN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Provedores Sociais
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// 1. Login com Google
export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

// 2. Login com Apple (pronto para quando ativar no Apple Developer)
export const loginWithApple = async () => {
  const result = await signInWithPopup(auth, appleProvider);
  return result.user;
};

// 3. Login com E-mail e Senha
export const loginWithEmail = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

// 4. Cadastro com E-mail, Senha e Nome
export const registerWithEmail = async (name, email, password) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(result.user, { displayName: name });
  }
  return result.user;
};

// 5. Sair da Conta
export const logoutUser = () => signOut(auth);

// 6. Observador de Sessão (mantém o usuário logado ao dar F5)
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  type Auth
} from "firebase/auth";

// Firebase Configuration from Vite Environment Variables with fallback defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDMz9QbQWgxpOpIKLz8zFsZp6O_fdsdASA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "autofixer-ai-2896c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "autofixer-ai-2896c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "autofixer-ai-2896c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "732997179016",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:732997179016:web:3bc62a6141b84b9ff2313d"
};

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your_api_key" &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let authInstance: Auth | null = null;
let googleAuthProvider: GoogleAuthProvider | null = null;
let githubAuthProvider: GithubAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(app);

    googleAuthProvider = new GoogleAuthProvider();
    googleAuthProvider.setCustomParameters({ prompt: "select_account" });

    githubAuthProvider = new GithubAuthProvider();
    githubAuthProvider.addScope("read:user");
    githubAuthProvider.addScope("user:email");
    githubAuthProvider.addScope("repo");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export const auth = authInstance;
export const googleProvider = googleAuthProvider;
export const githubProvider = githubAuthProvider;

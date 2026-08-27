import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  type Auth
} from "firebase/auth";

// Firebase Configuration from Vite Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
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
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export const auth = authInstance;
export const googleProvider = googleAuthProvider;
export const githubProvider = githubAuthProvider;

import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, AuthContextType } from "../types/auth";
import {
  auth,
  googleProvider,
  githubProvider,
  isFirebaseConfigured
} from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";

const STORAGE_KEY = "autofixer_auth_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Convert a Firebase User into our application's User object
  const mapFirebaseUser = (fbUser: FirebaseUser, providerType?: string): User => {
    const providerId = fbUser.providerData[0]?.providerId || providerType || "";
    let provider: "github" | "google" | "credentials" = "credentials";
    if (providerId.includes("github")) provider = "github";
    else if (providerId.includes("google")) provider = "google";

    return {
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split("@")[0] || "Developer",
      username: fbUser.email?.split("@")[0] || "dev",
      email: fbUser.email || "developer@autofixer.dev",
      avatarUrl: fbUser.photoURL || undefined,
      provider: provider,
      role: "developer",
      createdAt: fbUser.metadata.creationTime || new Date().toISOString()
    };
  };

  // Listen to Firebase Auth state or load local storage
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const appUser = mapFirebaseUser(fbUser);
          setUser(appUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
        } else {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Fallback local storage session when Firebase config is pending
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && parsed.email) {
            setUser(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to load local auth session:", e);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const saveUserSession = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  };

  // Real GitHub OAuth Sign In
  const signInWithGithub = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured && auth && githubProvider) {
        const result = await signInWithPopup(auth, githubProvider);
        const appUser = mapFirebaseUser(result.user, "github");
        saveUserSession(appUser);
      } else {
        // Fallback simulation if Firebase keys not provided yet in .env
        await new Promise((r) => setTimeout(r, 600));
        const simulatedUser: User = {
          id: "gh_" + Math.random().toString(36).substring(2, 9),
          name: "GitHub Developer",
          username: "octocat-dev",
          email: "developer@github.com",
          avatarUrl: "https://avatars.githubusercontent.com/u/9919?v=4",
          provider: "github",
          role: "developer",
          createdAt: new Date().toISOString()
        };
        saveUserSession(simulatedUser);
      }
    } catch (error: any) {
      console.error("GitHub Auth Error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Real Google OAuth Sign In
  const signInWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured && auth && googleProvider) {
        const result = await signInWithPopup(auth, googleProvider);
        const appUser = mapFirebaseUser(result.user, "google");
        saveUserSession(appUser);
      } else {
        // Fallback simulation if Firebase keys not provided yet in .env
        await new Promise((r) => setTimeout(r, 600));
        const simulatedUser: User = {
          id: "goog_" + Math.random().toString(36).substring(2, 9),
          name: "Google Developer",
          username: "google_dev",
          email: "engineer@gmail.com",
          avatarUrl: "https://lh3.googleusercontent.com/a/default-user",
          provider: "google",
          role: "developer",
          createdAt: new Date().toISOString()
        };
        saveUserSession(simulatedUser);
      }
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Email & Password Sign In / Registration
  const signInWithCredentials = async (
    usernameOrEmail: string,
    password: string,
    name?: string,
    isRegister?: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (!usernameOrEmail || !usernameOrEmail.trim()) {
      setIsLoading(false);
      return { success: false, error: "Please enter your username or email address." };
    }

    if (!password || password.length < 6) {
      setIsLoading(false);
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const cleanInput = usernameOrEmail.trim();
    const formattedEmail = cleanInput.includes("@") ? cleanInput : `${cleanInput}@autofixer.dev`;

    try {
      if (isFirebaseConfigured && auth) {
        if (isRegister) {
          // Create new Firebase account
          const userCred = await createUserWithEmailAndPassword(auth, formattedEmail, password);
          if (name?.trim()) {
            await updateProfile(userCred.user, { displayName: name.trim() });
          }
          const appUser = mapFirebaseUser(userCred.user, "credentials");
          saveUserSession(appUser);
        } else {
          // Sign in existing Firebase account
          const userCred = await signInWithEmailAndPassword(auth, formattedEmail, password);
          const appUser = mapFirebaseUser(userCred.user, "credentials");
          saveUserSession(appUser);
        }
      } else {
        // Fallback local account when Firebase keys are not in .env
        await new Promise((r) => setTimeout(r, 400));
        const derivedName = name?.trim() || cleanInput.split("@")[0];
        const credUser: User = {
          id: "usr_" + Math.random().toString(36).substring(2, 9),
          name: derivedName.charAt(0).toUpperCase() + derivedName.slice(1),
          username: cleanInput.split("@")[0],
          email: formattedEmail,
          provider: "credentials",
          role: "developer",
          createdAt: new Date().toISOString()
        };
        saveUserSession(credUser);
      }
      return { success: true };
    } catch (error: any) {
      console.error("Credentials Auth Error:", error);
      let errorMsg = "Authentication failed. Please check your credentials.";
      if (error.code === "auth/email-already-in-use") {
        errorMsg = "An account already exists with this email address.";
      } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMsg = "Incorrect email or password.";
      } else if (error.code === "auth/user-not-found") {
        errorMsg = "No account found. Click 'Create Account' to register.";
      } else if (error.message) {
        errorMsg = error.message;
      }
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const signInAsDemo = async (role: "judge" | "developer" = "judge"): Promise<void> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const demoUser: User = {
      id: "demo_judge",
      name: role === "judge" ? "Hackathon Judge" : "Guest Developer",
      username: role === "judge" ? "judge_evaluator" : "guest_dev",
      email: role === "judge" ? "judge@hackathon.org" : "guest@autofixer.dev",
      provider: "demo",
      role: role,
      createdAt: new Date().toISOString()
    };

    saveUserSession(demoUser);
    setIsLoading(false);
  };

  const signOut = async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signInWithGithub,
        signInWithGoogle,
        signInWithCredentials,
        signInAsDemo,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, AuthContextType } from "../types/auth";

const STORAGE_KEY = "autofixer_auth_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load session from localStorage on initial mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.email) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load auth session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserSession = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  };

  const signInWithGithub = async (): Promise<void> => {
    setIsLoading(true);
    // Simulate brief network handshake
    await new Promise((resolve) => setTimeout(resolve, 600));

    const githubUser: User = {
      id: "gh_" + Math.random().toString(36).substring(2, 9),
      name: "GitHub Developer",
      username: "octocat-dev",
      email: "developer@github.com",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      provider: "github",
      role: "developer",
      createdAt: new Date().toISOString()
    };

    saveUserSession(githubUser);
    setIsLoading(false);
  };

  const signInWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const googleUser: User = {
      id: "goog_" + Math.random().toString(36).substring(2, 9),
      name: "Google Developer",
      username: "ai_architect",
      email: "engineer@google.com",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      provider: "google",
      role: "developer",
      createdAt: new Date().toISOString()
    };

    saveUserSession(googleUser);
    setIsLoading(false);
  };

  const signInWithCredentials = async (
    usernameOrEmail: string,
    password: string,
    name?: string,
    _isRegister?: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!usernameOrEmail || !usernameOrEmail.trim()) {
      setIsLoading(false);
      return { success: false, error: "Please enter your username or email address." };
    }

    if (!password || password.length < 4) {
      setIsLoading(false);
      return { success: false, error: "Password must be at least 4 characters." };
    }

    const cleanInput = usernameOrEmail.trim();
    const isEmail = cleanInput.includes("@");
    const derivedName = name?.trim() || cleanInput.split("@")[0];

    const credUser: User = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name: derivedName.charAt(0).toUpperCase() + derivedName.slice(1),
      username: isEmail ? cleanInput.split("@")[0] : cleanInput,
      email: isEmail ? cleanInput : `${cleanInput}@autofixer.local`,
      provider: "credentials",
      role: "developer",
      createdAt: new Date().toISOString()
    };

    saveUserSession(credUser);
    setIsLoading(false);
    return { success: true };
  };

  const signInAsDemo = async (role: "judge" | "developer" = "judge"): Promise<void> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

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

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
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

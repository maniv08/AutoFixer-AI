export type AuthProvider = "github" | "google" | "credentials" | "demo";

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  provider: AuthProvider;
  role: "judge" | "developer" | "admin";
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGithub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithCredentials: (usernameOrEmail: string, password: string, name?: string, isRegister?: boolean) => Promise<{ success: boolean; error?: string }>;
  signInAsDemo: (role?: "judge" | "developer") => Promise<void>;
  signOut: () => void;
}

export type AuthProvider = "github" | "google" | "credentials" | "demo";

export interface GithubRepoItem {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  language: string | null;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  provider: AuthProvider;
  role: "judge" | "developer" | "admin";
  githubAccessToken?: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRepos: GithubRepoItem[];
  isLoadingRepos: boolean;
  fetchUserGithubRepos: () => Promise<GithubRepoItem[]>;
  signInWithGithub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithCredentials: (usernameOrEmail: string, password: string, name?: string, isRegister?: boolean) => Promise<{ success: boolean; error?: string }>;
  signInAsDemo: (role?: "judge" | "developer") => Promise<void>;
  signOut: () => void;
}

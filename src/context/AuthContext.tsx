import { createContext, useContext, useState } from "react";
import api from "../services/api"; // adapte le chemin si besoin
import type { User } from "../types/User";

interface LoginResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResult> => {
    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        console.error("Login failed: missing token or user in response", response.data);
        return {
          success: false,
          message: "Réponse inattendue du serveur",
        };
      }

      // 🔐 stocker séparément le token
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);

      return { success: true };
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string }, status?: number } };
      const message =
        apiError.response?.data?.message ||
        "Email ou mot de passe incorrect";

      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout"); // optionnel si tu as une route logout
    } catch (error) {
      console.warn("Logout API error (ignored)");
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
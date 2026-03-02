import { createContext, useContext, useState } from "react";
import api from "../services/api"; // adapte le chemin si besoin
import type { User } from "../types/User";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      // 🔐 stocker séparément le token
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);

      return true;
    } catch (error) {
      console.error("Erreur login:", error);
      return false;
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
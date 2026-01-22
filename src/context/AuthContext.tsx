import { createContext, useContext, useState } from "react";

export interface User {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STATIC_EMAIL = "snrakotoarivony@outsourcia-group.com";
const STATIC_PASSWORD = "Snrakotoarivony_456";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string) => {
    await new Promise((res) => setTimeout(res, 1200)); // fake API delay

    if (email === STATIC_EMAIL && password === STATIC_PASSWORD) {
      const connectedUser: User = {
        email,
        firstName: "SNR",
        lastName: "Rakotoarivony",
        role: "Administrateur",
      };

      setUser(connectedUser);
      localStorage.setItem("user", JSON.stringify(connectedUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
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

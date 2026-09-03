import { createContext, useContext, useState, ReactNode } from "react";
import { api } from "@/services/api";
import { getToken, getUsername, setSession, clearSession } from "@/lib/auth";

interface AuthContextValue {
  user: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(() => getToken() ? getUsername() : null);

  const login = async (username: string, password: string) => {
    const res = await api.auth.login(username, password);
    setSession(res.access_token, res.username);
    setUser(res.username);
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

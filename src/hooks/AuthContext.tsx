import { createContext, useContext, useState, ReactNode } from "react";
import { api } from "@/services/api";
import { getToken, getUsername, setSession, clearSession } from "@/lib/auth";
import type { ReferenciasData } from "@/types/cotizacion.types";

interface AuthContextValue {
  user: string | null;
  referencias: ReferenciasData | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshReferencias: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(() => getToken() ? getUsername() : null);
  const [referencias, setReferencias] = useState<ReferenciasData | null>(null);

  const login = async (username: string, password: string) => {
    const res = await api.auth.login(username, password);
    setSession(res.access_token, res.username);
    setUser(res.username);
    setReferencias(res.referencias ?? null);
  };

  const refreshReferencias = async () => {
    try {
      const data = await api.auth.referencias();
      setReferencias(data);
    } catch {
      // Si falla, se conserva la última copia cargada.
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setReferencias(null);
  };

  return (
    <AuthContext.Provider value={{ user, referencias, login, logout, refreshReferencias }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
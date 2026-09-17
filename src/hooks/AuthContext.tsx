import { createContext, useContext, useState, ReactNode } from "react";
import { api } from "@/services/api";
import { getToken, getUsername, setSession, clearSession, isDemo as sesionEsDemo } from "@/lib/auth";
import type { ReferenciasData } from "@/types/cotizacion.types";

interface AuthContextValue {
  user: string | null;
  demo: boolean;
  referencias: ReferenciasData | null;
  login: (username: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  refreshReferencias: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(() => getToken() ? getUsername() : null);
  const [demo, setDemo] = useState<boolean>(() => getToken() ? sesionEsDemo() : false);
  const [referencias, setReferencias] = useState<ReferenciasData | null>(null);

  const login = async (username: string, password: string) => {
    const res = await api.auth.login(username, password);
    setSession(res.access_token, res.username, false);
    setUser(res.username);
    setDemo(false);
    setReferencias(res.referencias ?? null);
  };

  const demoLogin = async () => {
    const res = await api.auth.demoLogin();
    setSession(res.access_token, res.username, true);
    setUser(res.username);
    setDemo(true);
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
    setDemo(false);
    setReferencias(null);
  };

  return (
    <AuthContext.Provider value={{ user, demo, referencias, login, demoLogin, logout, refreshReferencias }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
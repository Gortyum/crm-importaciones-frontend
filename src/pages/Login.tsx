import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        const res = await api.auth.register(username.trim(), password);
        await login(res.username, password);
      }
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Error de inicio de sesión");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">CRM/ERP</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === "login" ? "Inicia sesión para continuar" : "Crea una cuenta nueva"}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="username">Usuario</Label>
            <div className="relative mt-1">
              <User size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <Input
                id="username"
                autoComplete={mode === "login" ? "username" : "new-username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9"
                placeholder="tu usuario"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative mt-1">
              <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Procesando…" : mode === "login" ? "Ingresar" : "Registrarse"}
          </Button>
        </form>
        <button
          type="button"
          onClick={switchMode}
          className="mt-4 w-full text-center text-sm text-blue-600 hover:underline"
        >
          {mode === "login" ? "¿No tienes cuenta? Regístrate" : "Ya tengo cuenta, iniciar sesión"}
        </button>
      </div>
    </div>
  );
}

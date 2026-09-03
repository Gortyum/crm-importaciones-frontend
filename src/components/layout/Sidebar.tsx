import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  FileText,
  ShoppingCart,
  Ship,
  Settings,
  LogOut,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/AuthContext";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { api } from "@/services/api";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/proveedores", label: "Proveedores", icon: Truck },
  { to: "/productos", label: "Productos", icon: Package },
  { to: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { to: "/ordenes-compra", label: "Órdenes de Compra", icon: ShoppingCart },
  { to: "/importaciones", label: "Importaciones", icon: Ship },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pwActual, setPwActual] = useState("");
  const [pwNueva, setPwNueva] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const openDialog = () => {
    setPwActual("");
    setPwNueva("");
    setMsg("");
    setError("");
    setDialogOpen(true);
  };

  const cambiarPassword = async () => {
    setError("");
    setMsg("");
    setLoading(true);
    try {
      await api.auth.cambiarPassword(pwActual, pwNueva);
      setMsg("Contraseña actualizada correctamente");
      setPwActual("");
      setPwNueva("");
    } catch (e: any) {
      setError(e.message || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-lg font-bold tracking-tight">CRM/ERP</h1>
          <p className="text-xs text-slate-400 mt-1">Cotizaciones v0.1</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-700 space-y-2">
          <div className="px-3 py-2 rounded-md bg-slate-800">
            <p className="text-sm font-medium text-white">Usuario: {user}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openDialog}
              className="flex-1 bg-transparent border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              <KeyRound size={14} className="mr-1" /> Contraseña
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex-1 bg-transparent border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              <LogOut size={14} className="mr-1" /> Salir
            </Button>
          </div>
        </div>
      </aside>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Cambiar contraseña">
        <div className="space-y-4">
          <div>
            <Label htmlFor="pwActual">Contraseña actual</Label>
            <Input id="pwActual" type="password" value={pwActual} onChange={(e) => setPwActual(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="pwNueva">Nueva contraseña</Label>
            <Input id="pwNueva" type="password" value={pwNueva} onChange={(e) => setPwNueva(e.target.value)} className="mt-1" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {msg && <p className="text-green-600 text-sm font-medium">{msg}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={cambiarPassword} disabled={loading || !pwActual || !pwNueva}>
              {loading ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

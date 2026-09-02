import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Truck, Package, FileText, ShoppingCart, Ship, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-lg font-bold tracking-tight">CRM/ERP</h1>
        <p className="text-xs text-slate-400 mt-1">Cotizaciones v0.1</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
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
    </aside>
  );
}

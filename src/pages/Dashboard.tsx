import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Users, Package, TrendingUp } from "lucide-react";
import { api } from "@/services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({ clientes: 0, proveedores: 0, productos: 0, cotizaciones: 0 });
  const [ultimas, setUltimas] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.clientes.list(),
      api.proveedores.list(),
      api.productos.list(),
      api.cotizaciones.list(),
    ]).then(([clientes, proveedores, productos, cotizaciones]) => {
      setStats({
        clientes: clientes.length,
        proveedores: proveedores.length,
        productos: productos.length,
        cotizaciones: cotizaciones.length,
      });
      setUltimas(cotizaciones.slice(0, 5));
    });
  }, []);

  const cards = [
    { label: "Clientes", value: stats.clientes, icon: Users, color: "bg-blue-500" },
    { label: "Proveedores", value: stats.proveedores, icon: Package, color: "bg-emerald-500" },
    { label: "Productos", value: stats.productos, icon: Package, color: "bg-amber-500" },
    { label: "Cotizaciones", value: stats.cotizaciones, icon: FileText, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen del sistema</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card p-5 flex items-center gap-4">
            <div className={`${c.color} text-white p-3 rounded-lg`}>
              <c.icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-sm text-slate-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Últimas cotizaciones</h2>
          <Link to="/cotizaciones" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
        </div>
        {ultimas.length === 0 ? (
          <p className="text-slate-400 text-sm">No hay cotizaciones aún</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="pb-2">Correlativo</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {ultimas.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2">
                    <Link to={`/cotizaciones/${c.id}`} className="text-blue-600 hover:underline">
                      {c.correlativo}
                    </Link>
                  </td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100">{c.estado}</span>
                  </td>
                  <td className="py-2 text-right font-medium">
                    {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(c.total_general)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

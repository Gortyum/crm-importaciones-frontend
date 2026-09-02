import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, ChevronRight } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { formatCLP } from "@/lib/utils";

interface Cotizacion {
  id: number; correlativo: string; estado: string; fecha: string; total_general: number;
}

const ESTADO_COLORS: Record<string, string> = {
  Creada: "bg-slate-100 text-slate-700",
  Enviada: "bg-blue-100 text-blue-700",
  Cerrada: "bg-green-100 text-green-700",
  "En Produccion": "bg-amber-100 text-amber-700",
  Entregada: "bg-emerald-100 text-emerald-700",
  Cancelada: "bg-red-100 text-red-700",
};

export default function CotizacionesList() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);

  useEffect(() => { api.cotizaciones.list().then(setCotizaciones); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
          <p className="text-slate-500 text-sm mt-1">{cotizaciones.length} registros</p>
        </div>
        <Link to="/cotizaciones/nueva">
          <Button><Plus size={16} className="mr-1" /> Nueva cotización</Button>
        </Link>
      </div>

      <div className="bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b bg-slate-50">
              <th className="p-3">Correlativo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Fecha</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cotizaciones.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3 font-mono font-medium">{c.correlativo}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[c.estado] || "bg-slate-100"}`}>
                    {c.estado}
                  </span>
                </td>
                <td className="p-3 text-slate-500">{new Date(c.fecha).toLocaleDateString("es-CL")}</td>
                <td className="p-3 text-right font-medium">{formatCLP(c.total_general)}</td>
                <td className="p-3 text-right">
                  <Link to={`/cotizaciones/${c.id}`}>
                    <Button variant="ghost" size="sm"><Eye size={14} /></Button>
                  </Link>
                </td>
              </tr>
            ))}
            {cotizaciones.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Sin cotizaciones. <Link to="/cotizaciones/nueva" className="text-blue-600 hover:underline">Crear primera cotización</Link></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

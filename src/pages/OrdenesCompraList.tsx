import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { formatCLP } from "@/lib/utils";

interface OC {
  id: number; correlativo: string; proveedor_nombre: string; estado: string; created_at: string; total_general: number;
}

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: "bg-slate-100 text-slate-700",
  Confirmada: "bg-blue-100 text-blue-700",
  "En Produccion": "bg-amber-100 text-amber-700",
  Recibida: "bg-green-100 text-green-700",
  Cancelada: "bg-red-100 text-red-700",
};

export default function OrdenesCompraList() {
  const [ordenes, setOrdenes] = useState<OC[]>([]);

  useEffect(() => { api.ordenesCompra.list().then(setOrdenes); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Órdenes de Compra</h1>
          <p className="text-slate-500 text-sm mt-1">{ordenes.length} registros</p>
        </div>
      </div>

      <div className="bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b bg-slate-50">
              <th className="p-3">Correlativo</th>
              <th className="p-3">Proveedor</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Fecha</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((oc) => (
              <tr key={oc.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3 font-mono font-medium">{oc.correlativo}</td>
                <td className="p-3">{oc.proveedor_nombre}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[oc.estado] || "bg-slate-100"}`}>
                    {oc.estado}
                  </span>
                </td>
                <td className="p-3 text-slate-500">{new Date(oc.created_at).toLocaleDateString("es-CL")}</td>
                <td className="p-3 text-right font-medium">{formatCLP(oc.total_general)}</td>
                <td className="p-3 text-right">
                  <Link to={`/ordenes-compra/${oc.id}`}>
                    <Button variant="ghost" size="sm"><Eye size={14} /></Button>
                  </Link>
                </td>
              </tr>
            ))}
            {ordenes.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Sin órdenes de compra aún. Se generan desde una cotización.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils";

const ESTADO_COLORS: Record<string, string> = {
  Borrador: "bg-slate-100 text-slate-700",
  "En Transito": "bg-blue-100 text-blue-700",
  "En Bodega": "bg-amber-100 text-amber-700",
  Cerrada: "bg-green-100 text-green-700",
  Cancelada: "bg-red-100 text-red-700",
};

export default function ImportacionesList() {
  const navigate = useNavigate();
  const [importaciones, setImportaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.importaciones.list().then(setImportaciones).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const del = async (id: number) => {
    if (!confirm("¿Eliminar esta importación? Se desvinculará de su cotización si existe.")) return;
    await api.importaciones.delete(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Importaciones</h1>
          <p className="text-slate-500 text-sm mt-1">Costeo multimoneda Brasil → Chile · {importaciones.length} registros</p>
        </div>
        <Button onClick={() => navigate("/importaciones/nueva")}><Plus size={16} className="mr-1" /> Nueva importación</Button>
      </div>

      <div className="bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b bg-slate-50">
              <th className="p-3">Correlativo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Transporte</th>
              <th className="p-3 text-right">Costo almacén</th>
              <th className="p-3 text-right">P. venta total</th>              <th className="p-3">Vinculada a</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {importaciones.map((imp) => (
              <tr key={imp.id} className="border-b last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/importaciones/${imp.id}`)}>
                <td className="p-3 font-mono font-medium">{imp.correlativo}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[imp.estado] || "bg-slate-100"}`}>{imp.estado}</span>
                </td>
                <td className="p-3">{imp.transporte}</td>
                <td className="p-3 text-right">{formatMoney(imp.resultado?.costo_almacen_clp || 0, "CLP")}</td>
                <td className="p-3 text-right font-medium">{formatMoney(imp.resultado?.totales_venta?.total || 0, "CLP")}</td>
                <td className="p-3 text-xs">{imp.cotizacion_correlativo ? <span className="text-blue-600">→ {imp.cotizacion_correlativo}</span> : "—"}</td>
                <td className="p-3 text-right space-x-1">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/importaciones/${imp.id}`); }}><ArrowRight size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); del(imp.id); }}><Trash2 size={14} className="text-red-500" /></Button>
                </td>
              </tr>
            ))}
            {importaciones.length === 0 && !loading && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400">Sin importaciones registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
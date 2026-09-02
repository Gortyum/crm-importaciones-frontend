import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, ChevronRight } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { formatCLP } from "@/lib/utils";
import { generarOC_PDF } from "@/lib/oc-pdf-generator";

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: "bg-slate-100 text-slate-700",
  Confirmada: "bg-blue-100 text-blue-700",
  "En Produccion": "bg-amber-100 text-amber-700",
  Recibida: "bg-green-100 text-green-700",
  Cancelada: "bg-red-100 text-red-700",
};

const ESTADOS_OC = ["Pendiente", "Confirmada", "En Produccion", "Recibida", "Cancelada"];

export default function DetalleOrdenCompra() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [oc, setOc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.ordenesCompra.get(Number(id));
      setOc(data);
    } catch { navigate("/ordenes-compra"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const cambiarEstado = async (estado: string) => {
    if (!confirm(`¿Cambiar estado a "${estado}"?`)) return;
    await api.ordenesCompra.changeEstado(oc.id, estado);
    load();
  };

  const handlePDF = async () => {
    if (!oc) return;
    const data = await api.ordenesCompra.pdfData(oc.id);
    generarOC_PDF(data);
  };

  if (loading || !oc) return <div className="p-8 text-slate-400">Cargando...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/ordenes-compra")}><ArrowLeft size={16} /></Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">{oc.correlativo}</h1>
            <p className="text-slate-500 text-sm mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[oc.estado] || "bg-slate-100"}`}>
                {oc.estado}
              </span>
              <span className="ml-2 text-slate-400">· Generada desde {oc.cotizacion_correlativo || `Cotización #${oc.cotizacion_id}`}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePDF}><Download size={14} className="mr-1" /> PDF Orden</Button>
          {ESTADOS_OC.filter((e) => e !== oc.estado).map((e) => (
            <Button key={e} variant={e === "Cancelada" ? "destructive" : "default"} onClick={() => cambiarEstado(e)}>
              {e} <ChevronRight size={14} className="ml-1" />
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-card p-5 col-span-2">
          <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3">Proveedor</h2>
          <p className="font-medium">{oc.proveedor_nombre}</p>
        </div>
        <div className="bg-card p-5">
          <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3">Datos</h2>
          <p className="text-sm text-slate-500">Cotización: <strong>{oc.cotizacion_correlativo || `#${oc.cotizacion_id}`}</strong></p>
          <p className="text-sm text-slate-500">Fecha: <strong>{new Date(oc.created_at).toLocaleDateString("es-CL")}</strong></p>
        </div>
      </div>

      <div className="bg-card p-5">
        <h2 className="font-semibold text-sm uppercase text-slate-500 mb-4">Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="pb-2">Descripción</th>
              <th className="pb-2 text-center">Cant.</th>
              <th className="pb-2">Tipo</th>
              <th className="pb-2 text-right">Costo Unit.</th>
              <th className="pb-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {oc.items?.map((item: any) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2">{item.descripcion}</td>
                <td className="py-2 text-center">{item.cantidad}</td>
                <td className="py-2"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{item.tipo_personalizacion}</span></td>
                <td className="py-2 text-right">{formatCLP(item.costo_unitario)}</td>
                <td className="py-2 text-right font-medium">{formatCLP(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-card p-5 flex justify-end">
        <div className="text-right space-y-1">
          <p className="text-xl font-bold text-blue-700">Total: {formatCLP(oc.total_general)}</p>
        </div>
      </div>

      {oc.notas && (
        <div className="bg-card p-5">
          <h2 className="font-semibold text-sm uppercase text-slate-500 mb-2">Notas</h2>
          <p className="text-sm text-slate-600">{oc.notas}</p>
        </div>
      )}
    </div>
  );
}

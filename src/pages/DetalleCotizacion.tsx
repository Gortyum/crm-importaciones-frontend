import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, ChevronRight, ShoppingCart } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { formatCLP } from "@/lib/utils";
import { generarPDF } from "@/lib/pdf-generator";
import { generarOC_PDF } from "@/lib/oc-pdf-generator";

const ESTADO_COLORS: Record<string, string> = {
  Creada: "bg-slate-100 text-slate-700",
  Enviada: "bg-blue-100 text-blue-700",
  Cerrada: "bg-green-100 text-green-700",
  "En Produccion": "bg-amber-100 text-amber-700",
  Entregada: "bg-emerald-100 text-emerald-700",
  Cancelada: "bg-red-100 text-red-700",
};

const TRANSICIONES: Record<string, string[]> = {
  Creada: ["Enviada", "Cancelada"],
  Enviada: ["Cerrada", "Cancelada"],
  Cerrada: ["En Produccion", "Cancelada"],
  "En Produccion": ["Entregada", "Cancelada"],
  Entregada: [],
  Cancelada: [],
};

export default function DetalleCotizacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cot, setCot] = useState<any>(null);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ocProveedorId, setOcProveedorId] = useState<number | null>(null);
  const [creandoOC, setCreandoOC] = useState(false);

  const load = async () => {
    try {
      const [cotData, provs] = await Promise.all([
        api.cotizaciones.get(Number(id)),
        api.proveedores.list(),
      ]);
      setCot(cotData);
      setProveedores(provs);
    } catch { navigate("/cotizaciones"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const cambiarEstado = async (estado: string) => {
    if (!confirm(`¿Cambiar estado a "${estado}"?`)) return;
    await api.cotizaciones.changeEstado(cot.id, estado);
    load();
  };

  const handlePDF = async () => {
    if (!cot) return;
    const data = await api.cotizaciones.pdfData(cot.id);
    generarPDF(data);
  };

  const crearOC = async () => {
    if (!ocProveedorId || !cot) return;
    setCreandoOC(true);
    try {
      const oc = await api.ordenesCompra.create({
        cotizacion_id: cot.id,
        proveedor_id: ocProveedorId,
        notas: `Generada desde ${cot.correlativo}`,
      });
      const pdfData = await api.ordenesCompra.pdfData(oc.id);
      generarOC_PDF(pdfData);
      navigate(`/ordenes-compra/${oc.id}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreandoOC(false);
    }
  };

  if (loading || !cot) return <div className="p-8 text-slate-400">Cargando...</div>;

  const transiciones = TRANSICIONES[cot.estado] || [];

  const proveedoresConItems = (() => {
    const map = new Map<number, any[]>();
    for (const item of cot.items || []) {
      if (!item.proveedor_id) continue;
      if (!map.has(item.proveedor_id)) map.set(item.proveedor_id, []);
      map.get(item.proveedor_id)!.push(item);
    }
    return Array.from(map.entries()).map(([provId, items]) => {
      const prov = proveedores.find((p: any) => p.id === provId);
      return { provId, provNombre: prov?.razon_social || `Proveedor #${provId}`, items };
    });
  })();

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/cotizaciones")}><ArrowLeft size={16} /></Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">{cot.correlativo}</h1>
            <p className="text-slate-500 text-sm mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[cot.estado] || "bg-slate-100"}`}>
                {cot.estado}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePDF}><Download size={14} className="mr-1" /> PDF Cotización</Button>
          {transiciones.map((e) => (
            <Button key={e} variant={e === "Cancelada" ? "destructive" : "default"} onClick={() => cambiarEstado(e)}>
              {e} <ChevronRight size={14} className="ml-1" />
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-card p-5 col-span-2">
          <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3">Cliente</h2>
          <p className="font-medium">{cot.cliente?.razon_social || `Cliente #${cot.cliente_id}`}</p>
          <p className="text-sm text-slate-500">{cot.cliente?.rut || ""} {cot.cliente?.direccion ? `· ${cot.cliente.direccion}` : ""}</p>
          {cot.contacto && <p className="text-sm text-slate-500 mt-1">Contacto: {cot.contacto.nombre} ({cot.contacto.email})</p>}
        </div>
        <div className="bg-card p-5">
          <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3">Resumen</h2>
          <p className="text-sm text-slate-500">Divisa: <strong>{cot.divisa_original}</strong></p>
          <p className="text-sm text-slate-500">TC: <strong>{cot.tipo_cambio}</strong></p>
          <p className="text-sm text-slate-500">Fecha: <strong>{new Date(cot.fecha).toLocaleDateString("es-CL")}</strong></p>
        </div>
      </div>

      <div className="bg-card p-5">
        <h2 className="font-semibold text-sm uppercase text-slate-500 mb-4">Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="pb-2">Descripción</th>
              <th className="pb-2 text-center">Cant.</th>
              <th className="pb-2">Divisa</th>
              <th className="pb-2">Personalización</th>
              <th className="pb-2">Proveedor</th>
              <th className="pb-2 text-right">P. Unit.</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {cot.items?.map((item: any) => {
              const prov = proveedores.find((p: any) => p.id === item.proveedor_id);
              return (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {item.imagen_url && (
                        <img src={item.imagen_url} alt="" className="max-w-10 max-h-10 object-contain rounded border flex-shrink-0" />
                      )}
                      <span>{item.descripcion}</span>
                    </div>
                  </td>
                  <td className="py-2 text-center">{item.cantidad}</td>
                  <td className="py-2"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{item.divisa_origen}</span></td>
                  <td className="py-2"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{item.tipo_personalizacion}</span></td>
                  <td className="py-2 text-xs text-slate-400">{prov?.razon_social || "—"}</td>
                  <td className="py-2 text-right">{formatCLP(item.precio_venta_unitario)}</td>
                  <td className="py-2 text-right font-medium">{formatCLP(item.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-card p-5 flex justify-end">
        <div className="text-right space-y-1">
          <p className="text-sm text-slate-500">Subtotal: <strong>{formatCLP(cot.items?.reduce((s: number, i: any) => s + i.subtotal, 0) || 0)}</strong></p>
          <p className="text-sm text-slate-500">IVA: <strong>{formatCLP(cot.items?.reduce((s: number, i: any) => s + i.iva_monto, 0) || 0)}</strong></p>
          {(() => {
            const envioTotal = cot.items?.reduce((s: number, i: any) => s + i.costo_envio * i.cantidad, 0) || 0;
            return envioTotal > 0 ? <p className="text-sm text-slate-500">Envío: <strong>{formatCLP(envioTotal)}</strong></p> : null;
          })()}
          <p className="text-xl font-bold text-blue-700">Total: {formatCLP(cot.total_general)}</p>
        </div>
      </div>

      {proveedoresConItems.length > 0 && (
        <div className="bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase text-slate-500">Crear Orden de Compra</h2>
          <p className="text-sm text-slate-500">Genera una orden de compra por proveedor. Solo incluye los items asociados a ese proveedor.</p>
          {proveedoresConItems.map(({ provId, provNombre, items }) => (
            <div key={provId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">{provNombre}</p>
                <p className="text-xs text-slate-400">{items.length} item(s) · {formatCLP(items.reduce((s: number, i: any) => s + i.total, 0))}</p>
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  setCreandoOC(true);
                  try {
                    const oc = await api.ordenesCompra.create({
                      cotizacion_id: cot.id,
                      proveedor_id: provId,
                      notas: `Generada desde ${cot.correlativo}`,
                    });
                    const pdfData = await api.ordenesCompra.pdfData(oc.id);
                    generarOC_PDF(pdfData);
                    navigate(`/ordenes-compra/${oc.id}`);
                  } catch (e: any) { alert(e.message); }
                  finally { setCreandoOC(false); }
                }}
                disabled={creandoOC}
              >
                <ShoppingCart size={14} className="mr-1" /> Generar OC
              </Button>
            </div>
          ))}
        </div>
      )}

      {cot.notas && (
        <div className="bg-card p-5">
          <h2 className="font-semibold text-sm uppercase text-slate-500 mb-2">Notas</h2>
          <p className="text-sm text-slate-600">{cot.notas}</p>
        </div>
      )}
    </div>
  );
}

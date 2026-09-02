import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, FileText, Link2, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { Dialog } from "@/components/ui/Dialog";
import { formatMoney } from "@/lib/utils";
import { COSTOS_POR_TRANSPORTE } from "@/lib/importacion";

const ESTADO_COLORS: Record<string, string> = {
  Borrador: "bg-slate-100 text-slate-700",
  "En Transito": "bg-blue-100 text-blue-700",
  "En Bodega": "bg-amber-100 text-amber-700",
  Cerrada: "bg-green-100 text-green-700",
  Cancelada: "bg-red-100 text-red-700",
};

const TRANSICIONES: Record<string, string[]> = {
  Borrador: ["En Transito", "Cancelada"],
  "En Transito": ["En Bodega", "Cancelada"],
  "En Bodega": ["Cerrada", "Cancelada"],
  Cerrada: [],
  Cancelada: [],
};

const NOMBRE_COSTOS: Record<string, string> = {
  Flete_Courier: "Flete Courier (Brasil → Chile)",
  Gastos_Despacho_Courier: "Gastos Despacho Courier",
  Flete_Aereo_Int: "Flete Aéreo Internacional",
  Seguro_Internacional: "Seguro Internacional",
  Gastos_Terminal_Aereo: "Gastos Terminal Aérea",
  Flete_Terrestre_Int: "Flete Terrestre Internacional",
  Seguro_Transito_Terr: "Seguro de Tránsito Terrestre",
  Gastos_Frontera_PuertoSeco: "Gastos Frontera / Puerto Seco",
  Honorarios_Agente_Aduana: "Honorarios Agente de Aduana",
  Flete_Terrestre_Local: "Flete Terrestre Local (Chile)",
};
const NOMBRE_COSTO = (cat: string) => NOMBRE_COSTOS[cat] || COSTOS_POR_TRANSPORTE.Aereo.find((x) => x.categoria === cat)?.etiqueta || cat;

export default function DetalleImportacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imp, setImp] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [pasarState, setPasarState] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [idata, clis] = await Promise.all([api.importaciones.get(Number(id)), api.clientes.list()]);
      setImp(idata);
      setClientes(clis);
    } catch { navigate("/importaciones"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const cambiarEstado = async (estado: string) => {
    if (!confirm(`¿Cambiar estado a "${estado}"?`)) return;
    await api.importaciones.changeEstado(imp.id, estado);
    load();
  };

  const pasarACotizacion = async () => {
    if (!clienteId) return;
    setPasarState(true);
    setError("");
    try {
      const updated = await api.importaciones.pasarACotizacion(imp.id, clienteId);
      setImp(updated);
      setDialogOpen(false);
    } catch (e: any) { setError(e.message); }
    finally { setPasarState(false); }
  };

  const eliminar = async () => {
    if (!confirm("¿Eliminar esta importación? Se desvinculará de su cotización.")) return;
    await api.importaciones.delete(imp.id);
    navigate("/importaciones");
  };

  if (loading || !imp) return <div className="p-8 text-slate-400">Cargando...</div>;

  const r = imp.resultado || {};
  const transiciones = TRANSICIONES[imp.estado] || [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/importaciones")}><ArrowLeft size={16} /></Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">{imp.correlativo}</h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[imp.estado] || "bg-slate-100"}`}>{imp.estado}</span>
              <span>{imp.transporte}</span>
              <span>·</span>
              <span>{certLabel(imp.cert_origen)}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!imp.cotizacion_id && (
            <Button onClick={() => { setDialogOpen(true); setError(""); }}>
              <FileText size={14} className="mr-1" /> Pasar a Cotización
            </Button>
          )}
          {transiciones.map((e) => (
            <Button key={e} variant={e === "Cancelada" ? "destructive" : "default"} onClick={() => cambiarEstado(e)}>
              {e} <ChevronRight size={14} className="ml-1" />
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={eliminar}><Trash2 size={14} className="text-red-500" /></Button>
        </div>
      </div>

      {imp.cotizacion_id && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-sm">
          <Link2 size={16} className="text-blue-600" />
          <span>Vinculada a la cotización:</span>
          <Link to={`/cotizaciones/${imp.cotizacion_id}`} className="font-mono font-medium text-blue-700 hover:underline">{imp.cotizacion_correlativo}</Link>
        </div>
      )}

      <div className="bg-card p-5">
        <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3">Resumen de costeo</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-500">FOB</p>
            <p className="font-mono font-medium">{formatMoney(r.fob_total_usd || 0, "USD")}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Flete + Seguro</p>
            <p className="font-mono font-medium">{formatMoney((r.flete_usd || 0) + (r.seguro_usd || 0), "USD")}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">CIF</p>
            <p className="font-mono font-semibold text-blue-700">{formatMoney(r.cif_total_usd || 0, "USD")}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">TC USD→CLP</p>
            <p className="font-mono font-medium">{formatMoney(imp.tc_usd_clp, "CLP")} / USD</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Contingencia ({imp.contingencia_pct}%)</p>
            <p className="font-mono font-medium">{formatMoney(r.contingencia_usd || 0, "USD")}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Arancel ({r.config?.arancel_pct || 0}%)</p>
            <p className="font-mono font-medium">{formatMoney(r.arancel_usd || 0, "USD")}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">IVA importación (informativo)</p>
            <p className="font-mono font-medium text-amber-600">{formatMoney(r.iva_importacion_clp || 0, "CLP")}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Costo unitario promedio</p>
            <p className="font-mono font-medium">{formatMoney(r.costo_unitario_promedio_clp || 0, "CLP")}</p>
          </div>
          <div className="col-span-4 pt-2 border-t">
            <p className="text-sm text-slate-500">Costo total almacén</p>
            <p className="text-3xl font-bold text-blue-700 font-mono">{formatMoney(r.costo_almacen_clp || 0, "CLP")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card p-5">
          <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3">Items / Precios de venta</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-center">Cant.</th>
                <th className="pb-2 text-right">Costo unit. (CLP)</th>
                <th className="pb-2 text-right">P. neto (CLP)</th>
                <th className="pb-2 text-right">P. público (CLP)</th>
              </tr>
            </thead>
            <tbody>
              {(imp.items || []).map((item: any) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">
                    <p className="font-medium">{item.descripcion}</p>
                    <p className="text-xs text-slate-400">Fábrica {formatMoney(item.precio_unitario_fabrica, item.divisa)} · margen {item.margen_pct}%</p>
                  </td>
                  <td className="py-2 text-center">{item.cantidad}</td>
                  <td className="py-2 text-right">{formatMoney(item.costo_unitario_neto_clp, "CLP")}</td>
                  <td className="py-2 text-right">{formatMoney(item.precio_venta_neto_clp, "CLP")}</td>
                  <td className="py-2 text-right font-medium">{formatMoney(item.precio_venta_total_clp, "CLP")}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t">
                <td className="pt-2">Totales</td>
                <td></td>
                <td></td>
                <td className="pt-2 text-right">{formatMoney(r.totales_venta?.neto || 0, "CLP")}</td>
                <td className="pt-2 text-right text-blue-700">{formatMoney(r.totales_venta?.total || 0, "CLP")}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="bg-card p-5">
          <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3">Costos de importación</h2>
          <table className="w-full text-sm">
            <tbody>
              {(imp.costos || []).map((c: any) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2">
                    <p className="font-medium">{NOMBRE_COSTO(c.categoria)}</p>
                    {c.proveedor && <p className="text-xs text-slate-400">{c.proveedor}</p>}
                  </td>
                  <td className="py-2 text-right font-mono">{formatMoney(c.monto, c.divisa)}</td>
                </tr>
              ))}
              {(!imp.costos || imp.costos.length === 0) && (
                <tr><td className="py-4 text-center text-slate-400">Sin costos registrados</td></tr>
              )}
            </tbody>
          </table>
          <div className="mt-4 pt-3 border-t space-y-1">
            <p className="text-sm text-slate-500 flex justify-between"><span>Gastos locales</span><span className="font-mono">{formatMoney(r.gastos_locales_clp || 0, "CLP")}</span></p>
            <p className="text-sm text-slate-900 flex justify-between font-semibold"><span>Costo almacén</span><span className="font-mono">{formatMoney(r.costo_almacen_clp || 0, "CLP")}</span></p>
          </div>
        </div>
      </div>

      {imp.proveedores && imp.proveedores.length > 0 && (
        <div className="bg-card p-5">
          <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3">Proveedores</h2>
          <div className="flex gap-3 flex-wrap">
            {imp.proveedores.map((p: any) => (
              <span key={p.id} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
                <span className="text-slate-400 text-xs font-medium uppercase mr-1">{p.categoria}:</span> {p.razon_social}
              </span>
            ))}
          </div>
        </div>
      )}

      {imp.notas && (
        <div className="bg-card p-5">
          <h2 className="font-semibold text-sm uppercase text-slate-500 mb-2">Notas</h2>
          <p className="text-sm text-slate-600">{imp.notas}</p>
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Pasar a Cotización">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Se generará una cotización con el costo calculado y el margen definido por item.</p>
          <div>
            <Label>Cliente</Label>
            <Select value={clienteId ?? ""} onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">— Seleccionar cliente —</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </Select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={pasarACotizacion} disabled={!clienteId || pasarState}>{pasarState ? "Generando..." : "Generar cotización"}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function certLabel(certOrigen: boolean): string {
  return certOrigen ? "Cert. Origen SÍ · Arancel 0%" : "Cert. Origen NO · Arancel 6%";
}
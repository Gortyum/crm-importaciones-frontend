import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Ship, ArrowRight } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { formatCLP } from "@/lib/utils";

interface ItemCotizacion {
  id: number; descripcion: string; cantidad: number; precio_venta_unitario: number;
  subtotal: number; iva_monto: number; total: number;
}

interface Cotizacion {
  id: number; correlativo: string; estado: string; fecha: string; total_general: number;
  importacion_id?: number | null; importacion_correlativo?: string;
  historial_estados?: { estado: string; fecha: string }[] | null;
  cliente?: { razon_social: string } | null;
  items?: ItemCotizacion[];
}

/** Orden del flujo: de la etapa inicial a la final. Las canceladas se agrupan aparte, debajo. */
const COLUMNAS = ["Creada", "Enviada", "Cerrada", "En Produccion", "Entregada"];
const TERMINALES = ["Entregada", "Cancelada"];
const UMBRAL_ALERTA_DIAS = 7;

const ACCENT: Record<string, string> = {
  Creada: "bg-slate-400",
  Enviada: "bg-blue-500",
  Cerrada: "bg-green-500",
  "En Produccion": "bg-amber-500",
  Entregada: "bg-emerald-500",
  Cancelada: "bg-red-500",
};

function esDropValido(desde: string, hacia: string): boolean {
  if (desde === hacia) return false;
  if (hacia === "Cancelada") return !TERMINALES.includes(desde);
  const i = COLUMNAS.indexOf(desde);
  const j = COLUMNAS.indexOf(hacia);
  return i >= 0 && j > i;
}

function diasEnEstado(c: Cotizacion): number {
  const entries = c.historial_estados ?? [];
  let ref = c.fecha;
  const last = entries[entries.length - 1];
  if (last?.fecha) ref = last.fecha;
  return Math.max(0, Math.round((Date.now() - new Date(ref).getTime()) / 86400000));
}

export default function CotizacionesList() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [dragId, setDragId] = useState<number | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [modal, setModal] = useState<Cotizacion | null>(null);
  const ptrInicio = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { api.cotizaciones.list().then(setCotizaciones); }, []);

  const movible = (c: Cotizacion) => !TERMINALES.includes(c.estado);

  const porEstado = (estado: string) =>
    cotizaciones
      .filter((c) => c.estado === estado && filtrar(c))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const filtrar = (c: Cotizacion) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return (
      c.correlativo.toLowerCase().includes(q) ||
      (c.cliente?.razon_social ?? "").toLowerCase().includes(q)
    );
  };

  const canceladas = porEstado("Cancelada");

  const mover = async (c: Cotizacion, destino: string) => {
    const anterior = c;
    const clon: Cotizacion = {
      ...c,
      estado: destino,
      historial_estados: [
        ...(c.historial_estados ?? []),
        { estado: destino, fecha: new Date().toISOString() },
      ],
    };
    setCotizaciones((prev) => prev.map((p) => (p.id === c.id ? clon : p)));
    setSobre(null);
    setDragId(null);
    try {
      const nuevo = await api.cotizaciones.changeEstado(c.id, destino);
      setCotizaciones((prev) => prev.map((p) => (p.id === c.id ? { ...p, ...nuevo } : p)));
    } catch (e: any) {
      setCotizaciones((prev) => prev.map((p) => (p.id === c.id ? anterior : p)));
      alert(e.message || "No se pudo cambiar el estado");
    }
  };

  const alSoltar = (estado: string) => {
    if (dragId == null) return;
    const c = cotizaciones.find((x) => x.id === dragId);
    if (c && esDropValido(c.estado, estado)) mover(c, estado);
    setSobre(null);
  };

  const abrirDetalle = (c: Cotizacion, e: MouseEvent) => {
    const p = ptrInicio.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 5) return;
    setModal(c);
  };

  const Card = ({ c }: { c: Cotizacion }) => {
    const items = c.items ?? [];
    const dias = diasEnEstado(c);
    return (
      <div
        draggable={movible(c)}
        onPointerDown={(e) => { ptrInicio.current = { x: e.clientX, y: e.clientY }; }}
        onDragStart={(e) => { setDragId(c.id); e.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => { setDragId(null); setSobre(null); }}
        onClick={(e) => abrirDetalle(c, e)}
        className={`bg-white rounded-md shadow-sm border border-slate-200 p-3 hover:shadow-md hover:border-blue-300 transition-shadow ${movible(c) ? "cursor-grab active:cursor-grabbing" : ""} ${dragId === c.id ? "opacity-50" : ""}`}
      >
        <p className="font-mono text-[0.65rem] text-slate-400 uppercase tracking-wide">{c.correlativo}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 line-clamp-1">{c.cliente?.razon_social || "—"}</p>
        {c.importacion_correlativo && c.importacion_id != null && (
          <Link
            to={`/importaciones/${c.importacion_id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[0.65rem] font-semibold text-sky-700 hover:bg-sky-200"
          >
            <Ship size={11} /> {c.importacion_correlativo}
          </Link>
        )}
        {items.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {items.slice(0, 3).map((i) => (
              <li key={i.id} className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-slate-600 truncate">{i.descripcion}</span>
                <span className="text-slate-400 shrink-0">{i.cantidad}×</span>
              </li>
            ))}
            {items.length > 3 && <li className="text-[0.65rem] text-slate-400">+{items.length - 3} más</li>}
          </ul>
        ) : null}
        <div className="flex items-center justify-between mt-3 text-xs">
          {movible(c) ? (
            <span className={dias >= UMBRAL_ALERTA_DIAS ? "text-amber-600 font-medium" : "text-slate-400"}>
              {dias} día{dias !== 1 ? "s" : ""} en {c.estado}
            </span>
          ) : (
            <span className="text-slate-400">{new Date(c.fecha).toLocaleDateString("es-CL")}</span>
          )}
          <span className="font-semibold">{formatCLP(c.total_general)}</span>
        </div>
      </div>
    );
  };

  const Columna = ({ estado }: { estado: string }) => {
    const items = porEstado(estado);
    const sobreEsto = sobre === estado && dragId != null;
    const valido = sobreEsto && (() => {
      const c = cotizaciones.find((x) => x.id === dragId);
      return c ? esDropValido(c.estado, estado) : false;
    })();
    return (
      <div
        onDragOver={(e) => { if (dragId != null) { e.preventDefault(); setSobre(estado); } }}
        onDragLeave={() => setSobre((s) => (s === estado ? null : s))}
        onDrop={() => alSoltar(estado)}
        className={`w-72 shrink-0 bg-slate-100 rounded-md flex flex-col transition-shadow ${sobreEsto ? (valido ? "ring-2 ring-emerald-400 ring-offset-1" : "ring-2 ring-red-300 ring-offset-1") : ""}`}
      >
        <div className="px-3 py-2.5 flex items-center gap-2 border-b border-slate-200">
          <span className={`h-2 w-2 rounded-full ${ACCENT[estado] || "bg-slate-400"}`} />
          <h2 className="text-sm font-semibold text-slate-700">{estado}</h2>
          <span className="ml-auto text-xs font-mono text-slate-400">{items.length}</span>
        </div>
        <div className="p-2 space-y-2 flex-1">
          {items.map((c) => <Card key={c.id} c={c} />)}
        </div>
      </div>
    );
  };

  const modalItems = modal?.items ?? [];
  const subtotal = modalItems.reduce((s, i) => s + i.subtotal, 0);
  const iva = modalItems.reduce((s, i) => s + i.iva_monto, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-slate-400 mt-1.5">{cotizaciones.length} registros</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente o correlativo"
              className="pl-9 w-64"
            />
          </div>
          <Link to="/cotizaciones/nueva">
            <Button><Plus size={16} className="mr-1" /> Nueva cotización</Button>
          </Link>
        </div>
      </div>

      {cotizaciones.length === 0 ? (
        <div className="bg-card p-8 text-center text-slate-400 rounded-md">
          Sin cotizaciones.{" "}
          <Link to="/cotizaciones/nueva" className="text-blue-600 hover:underline">Crear primera cotización</Link>
        </div>
      ) : (
        <>
          <div className="flex gap-4 overflow-x-auto pb-2 items-start">
            {COLUMNAS.map((estado) => <Columna key={estado} estado={estado} />)}
          </div>
          {canceladas.length > 0 && (
            <div className="mt-4 bg-red-50/60 rounded-md">
              <div className="px-3 py-2.5 flex items-center gap-2 border-b border-red-100">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <h2 className="text-sm font-semibold text-slate-700">Canceladas</h2>
                <span className="ml-auto text-xs font-mono text-slate-400">{canceladas.length}</span>
              </div>
              <div className="p-2 flex flex-wrap gap-2">
                {canceladas.map((c) => (
                  <div key={c.id} className="w-72 shrink-0"><Card c={c} /></div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog
        open={modal != null}
        onClose={() => setModal(null)}
        title={modal ? `${modal.correlativo} — ${modal.cliente?.razon_social || "Sin cliente"}` : ""}
      >
        {modal && (
          <div className="space-y-4">
            <div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACCENT_COLOR_BG[modal.estado] || "bg-slate-100"}`}>
                {modal.estado}
              </span>
              {modal.importacion_correlativo && modal.importacion_id != null && (
                <Link
                  to={`/importaciones/${modal.importacion_id}`}
                  className="ml-2 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700 hover:bg-sky-200"
                >
                  <Ship size={12} /> {modal.importacion_correlativo}
                </Link>
              )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2">Producto</th>
                  <th className="py-2 text-right">Cant.</th>
                  <th className="py-2 text-right">Unit.</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {modalItems.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-2">{i.descripcion}</td>
                    <td className="py-2 text-right text-slate-500">{i.cantidad}</td>
                    <td className="py-2 text-right text-slate-500">{formatCLP(i.precio_venta_unitario)}</td>
                    <td className="py-2 text-right font-medium">{formatCLP(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between text-sm">
              <div className="text-slate-500">
                <p>Subtotal: {formatCLP(subtotal)}</p>
                <p>IVA: {formatCLP(iva)}</p>
              </div>
              <p className="text-lg font-bold">{formatCLP(modal.total_general)}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setModal(null)}>Cerrar</Button>
              <Link to={`/cotizaciones/${modal.id}`}>
                <Button>Abrir detalle <ArrowRight size={15} className="ml-1" /></Button>
              </Link>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

const ACCENT_COLOR_BG: Record<string, string> = {
  Creada: "bg-slate-100 text-slate-700",
  Enviada: "bg-blue-100 text-blue-700",
  Cerrada: "bg-green-100 text-green-700",
  "En Produccion": "bg-amber-100 text-amber-700",
  Entregada: "bg-emerald-100 text-emerald-700",
  Cancelada: "bg-red-100 text-red-700",
};
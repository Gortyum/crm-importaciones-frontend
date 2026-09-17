import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { formatCLP } from "@/lib/utils";

interface Cotizacion {
  id: number; correlativo: string; estado: string; fecha: string; total_general: number;
  cliente?: { razon_social: string } | null;
}

/** Orden del flujo: de la etapa inicial a la final. Las canceladas se agrupan aparte, debajo. */
const COLUMNAS = ["Creada", "Enviada", "Cerrada", "En Produccion", "Entregada"];

const ACCENT: Record<string, string> = {
  Creada: "bg-slate-400",
  Enviada: "bg-blue-500",
  Cerrada: "bg-green-500",
  "En Produccion": "bg-amber-500",
  Entregada: "bg-emerald-500",
  Cancelada: "bg-red-500",
};

export default function CotizacionesList() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);

  useEffect(() => { api.cotizaciones.list().then(setCotizaciones); }, []);

  const porEstado = (estado: string) => cotizaciones.filter((c) => c.estado === estado);
  const canceladas = porEstado("Cancelada");

  const Card = ({ c }: { c: Cotizacion }) => (
    <Link
      to={`/cotizaciones/${c.id}`}
      className="block bg-white rounded-md shadow-sm border border-slate-200 p-3 hover:shadow-md hover:border-blue-300 transition-shadow"
    >
      <p className="font-mono text-sm font-medium">{c.correlativo}</p>
      <p className="text-sm text-slate-700 mt-1 line-clamp-1">{c.cliente?.razon_social || "—"}</p>
      <div className="flex items-center justify-between mt-3 text-xs">
        <span className="text-slate-400">{new Date(c.fecha).toLocaleDateString("es-CL")}</span>
        <span className="font-semibold">{formatCLP(c.total_general)}</span>
      </div>
    </Link>
  );

  const Columna = ({ estado }: { estado: string }) => {
    const items = porEstado(estado);
    return (
      <div className="w-72 shrink-0 bg-slate-100 rounded-md flex flex-col">
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-slate-400 mt-1.5">{cotizaciones.length} registros</p>
        </div>
        <Link to="/cotizaciones/nueva">
          <Button><Plus size={16} className="mr-1" /> Nueva cotización</Button>
        </Link>
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
    </div>
  );
}
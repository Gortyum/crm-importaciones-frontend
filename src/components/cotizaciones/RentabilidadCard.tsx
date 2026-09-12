import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { formatCLP } from "@/lib/utils";

interface RentabilidadCardProps {
  costoTotal: number;
  ventaNeta: number;
  utilidad: number;
  margenPct: number;
  markupPct?: number;
}

export function RentabilidadCard({
  costoTotal,
  ventaNeta,
  utilidad,
  margenPct,
  markupPct,
}: RentabilidadCardProps) {
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  // Si no se pasa markup, calcularlo: (utilidad / costo) * 100
  const markupCalculado = markupPct !== undefined ? markupPct : costoTotal > 0 ? (utilidad / costoTotal) * 100 : 0;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
          <TrendingUp size={18} className="text-emerald-600" /> Rentabilidad de la Operación
        </h3>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs">
          Margen {Math.round(margenPct)}%
        </span>
      </div>

      {/* Indicadores principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-white p-3 rounded-lg border border-emerald-100">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Costo Total</p>
          <p className="text-lg font-bold font-mono text-slate-700 mt-0.5">{formatCLP(Math.round(costoTotal))}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-emerald-100">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Venta Neta</p>
          <p className="text-lg font-bold font-mono text-blue-700 mt-0.5">{formatCLP(Math.round(ventaNeta))}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-emerald-100">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Utilidad Estimada</p>
          <p className="text-lg font-bold font-mono text-emerald-700 mt-0.5">{formatCLP(Math.round(utilidad))}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-emerald-100">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Margen Comercial</p>
          <p className="text-lg font-bold font-mono text-emerald-600 mt-0.5">{Math.round(margenPct)}%</p>
        </div>
      </div>

      {/* Detalle avanzado Markup vs Margen */}
      <div className="border-t border-emerald-100 pt-2">
        <button
          type="button"
          onClick={() => setMostrarDetalle(!mostrarDetalle)}
          className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 transition-colors"
        >
          {mostrarDetalle ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {mostrarDetalle ? "Ocultar detalle avanzado" : "Ver detalle avanzado (Markup vs Margen)"}
        </button>

        {mostrarDetalle && (
          <div className="mt-3 bg-white p-3 rounded-lg border border-emerald-100 text-xs space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-500">Margen real (sobre venta):</span>
              <span className="font-mono font-bold text-slate-700">{margenPct.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Markup (sobre costo):</span>
              <span className="font-mono font-semibold text-slate-700">{markupCalculado.toFixed(1)}%</span>
            </div>
            <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-1">
              El margen mide qué porcentaje del precio de venta es ganancia neta. El markup mide cuánto se le recargó al costo base.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

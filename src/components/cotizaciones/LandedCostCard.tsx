import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCLP, formatMoney } from "@/lib/utils";

interface LandedCostCardProps {
  costoTotalClp: number;
  cantidadTotal: number;

  // Para el desglose
  fobUsd: number;
  fleteUsd: number;
  seguroUsd: number;
  arancelUsd: number;
  gastosLocalesClp: number;
  otrosClp: number;
  contingenciaUsd: number;
  tcUsdClp: number;
  extranjeroNoCifUsd: number;
}

export function LandedCostCard({
  costoTotalClp,
  cantidadTotal,
  fobUsd,
  fleteUsd,
  seguroUsd,
  arancelUsd,
  gastosLocalesClp,
  otrosClp,
  contingenciaUsd,
  tcUsdClp,
  extranjeroNoCifUsd,
}: LandedCostCardProps) {
  const [open, setOpen] = useState(false);

  const costoUnitario = cantidadTotal > 0 ? costoTotalClp / cantidadTotal : 0;

  // Convertir USD a CLP para el desglose
  const fobClp = fobUsd * tcUsdClp;
  const fleteClp = fleteUsd * tcUsdClp;
  const seguroClp = seguroUsd * tcUsdClp;
  const arancelClp = arancelUsd * tcUsdClp;
  const contingenciaClp = contingenciaUsd * tcUsdClp;
  const extrasClp = extranjeroNoCifUsd * tcUsdClp;

  const filas = [
    { label: "Mercadería (FOB)", valor: fobClp },
    { label: "Flete internacional", valor: fleteClp },
    { label: "Seguro", valor: seguroClp },
    { label: "Arancel", valor: arancelClp },
    { label: "Gastos en frontera / despacho", valor: extrasClp },
    { label: "Contingencia cambiaria", valor: contingenciaClp },
    { label: "Gastos locales", valor: gastosLocalesClp },
    { label: "Otros", valor: otrosClp },
  ].filter((f) => f.valor > 0);

  return (
    <div className="rounded-xl border-2 border-blue-600 bg-blue-50 overflow-hidden">
      {/* Hero */}
      <div className="px-5 py-5 text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
          📦 Costo puesto en Chile
        </p>
        <p className="text-4xl font-bold text-blue-900 font-mono">
          {formatCLP(Math.round(costoTotalClp))}
        </p>
        {cantidadTotal > 0 && (
          <div className="flex items-center justify-center gap-4 text-sm text-blue-700 pt-1">
            <span>
              <span className="font-semibold">{formatCLP(Math.round(costoUnitario))}</span>
              {" "}por unidad
            </span>
            <span className="text-blue-300">·</span>
            <span>{cantidadTotal} unidades</span>
          </div>
        )}
      </div>

      {/* Desglose accordion */}
      <div className="border-t border-blue-200">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-100/50 transition-colors"
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {open ? "Ocultar desglose" : "Ver desglose"}
        </button>

        {open && (
          <div className="px-5 pb-5 space-y-2 bg-white border-t border-blue-100 text-sm">
            <div className="pt-3 space-y-1.5">
              {filas.map((f) => (
                <div key={f.label} className="flex justify-between">
                  <span className="text-slate-500">{f.label}</span>
                  <span className="font-mono text-slate-700">{formatCLP(Math.round(f.valor))}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                <span className="text-slate-700">Costo total</span>
                <span className="font-mono text-blue-700">{formatCLP(Math.round(costoTotalClp))}</span>
              </div>
              {cantidadTotal > 0 && (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>Cantidad</span>
                    <span className="font-mono">{cantidadTotal} u</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-slate-200 pt-2">
                    <span className="text-slate-700">Costo por unidad</span>
                    <span className="font-mono text-blue-700">{formatCLP(Math.round(costoUnitario))}</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-[11px] text-slate-400 pt-2">
              * Valores calculados como referencia. El backend recalcula al guardar.
              Los costos en USD se convierten usando TC {formatMoney(tcUsdClp, "CLP", 0)}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

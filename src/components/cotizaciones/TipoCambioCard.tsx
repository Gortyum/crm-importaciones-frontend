import { useState } from "react";
import { RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatMoney } from "@/lib/utils";
import type { DivisasResponse } from "@/types/cotizacion.types";

interface TipoCambioCardProps {
  divisas: DivisasResponse | null;
  tcUsdClp: number;
  onTcChange: (value: number) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

export function TipoCambioCard({
  divisas,
  tcUsdClp,
  onTcChange,
  onRefresh,
  refreshing = false,
}: TipoCambioCardProps) {
  const [editando, setEditando] = useState(false);

  const tcObservado = divisas?.monedas.USD ?? tcUsdClp;
  const tcCotizacion = divisas?.tc_cotizacion.USD ?? tcUsdClp;
  const seguridadPct = divisas?.seguridad_pct ?? 2;
  const fechaTc = divisas?.fecha_tc ?? null;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💱</span>
          <h3 className="font-semibold text-slate-700">Tipo de cambio</h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* TC breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Dólar observado</span>
          <span className="font-mono font-medium text-slate-700">
            {formatMoney(tcObservado, "CLP", 0)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">
            Seguridad cambiaria
          </span>
          <span className="font-mono text-slate-500">+{seguridadPct}%</span>
        </div>

        <div className="border-t border-blue-200 pt-2 flex items-center justify-between">
          <span className="font-semibold text-slate-700">Dólar para cotización</span>
          <span className="font-mono font-bold text-blue-700 text-base">
            {formatMoney(tcCotizacion, "CLP", 0)}
          </span>
        </div>
      </div>

      {/* Manual override */}
      {editando ? (
        <div className="flex items-center gap-2 pt-1">
          <Input
            type="number"
            min={1}
            value={tcUsdClp}
            onChange={(e) => onTcChange(Number(e.target.value))}
            className="w-36 text-right font-mono"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onTcChange(tcCotizacion);
              setEditando(false);
            }}
          >
            Restablecer
          </Button>
          <Button type="button" size="sm" onClick={() => setEditando(false)}>
            OK
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
        >
          Editar manualmente
        </button>
      )}

      {/* Info tooltip */}
      <div className="flex items-start gap-1.5 text-xs text-slate-400 bg-white/60 rounded-lg px-3 py-2 border border-blue-100">
        <Info size={12} className="mt-0.5 shrink-0 text-blue-400" />
        <span>
          Se agrega un <strong>{seguridadPct}%</strong> de seguridad para proteger la cotización
          frente a variaciones del dólar.
          {fechaTc && <> TC del <strong>{fechaTc}</strong>.</>}
        </span>
      </div>
    </div>
  );
}

import { CheckCircle2, XCircle } from "lucide-react";

interface MercosurSelectorProps {
  certOrigen: boolean;
  onChange: (value: boolean) => void;
  arancelGeneral: number;
  arancelMercosur: number;
}

export function MercosurSelector({
  certOrigen,
  onChange,
  arancelGeneral,
  arancelMercosur,
}: MercosurSelectorProps) {
  const arancelAplicado = certOrigen ? arancelMercosur : arancelGeneral;

  return (
    <div className="rounded-xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-700 flex items-center gap-2">
        <span className="text-base">📄</span> Certificado de Origen Mercosur
      </h3>

      {/* Toggle */}
      <p className="text-sm text-slate-500">¿El producto cuenta con certificado de origen?</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
            certOrigen
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
          }`}
        >
          <CheckCircle2 size={16} />
          Sí, tiene certificado
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
            !certOrigen
              ? "border-slate-500 bg-slate-50 text-slate-700"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
          }`}
        >
          <XCircle size={16} />
          No tiene certificado
        </button>
      </div>

      {/* Result */}
      <div className={`rounded-lg px-4 py-3 text-sm ${certOrigen ? "bg-emerald-50 border border-emerald-100" : "bg-amber-50 border border-amber-100"}`}>
        {certOrigen ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium text-emerald-700">
              <CheckCircle2 size={14} />
              Beneficio arancelario Mercosur aplicado
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Arancel aplicable</span>
              <span className="font-mono font-bold">{arancelMercosur}%</span>
            </div>
            {arancelMercosur === 0 && (
              <p className="text-[11px] text-emerald-500 mt-1">Arancel 0% por acuerdo Mercosur.</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium text-amber-700">
              <XCircle size={14} />
              Se aplica arancel general
            </div>
            <div className="flex justify-between text-amber-600">
              <span>Arancel aplicable</span>
              <span className="font-mono font-bold">{arancelGeneral}%</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400">
        Las tasas arancelarias son determinadas por la configuración del sistema y aplicadas por el backend al calcular el costo de importación.
      </p>
    </div>
  );
}

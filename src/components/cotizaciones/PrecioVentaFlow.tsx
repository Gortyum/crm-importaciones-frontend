import { ArrowDown } from "lucide-react";
import { formatCLP } from "@/lib/utils";

interface PrecioVentaFlowProps {
  costoUnitario: number;
  margenPct: number;
  descuentoPct: number;
  ivaPct: number;
  precioNeto: number;
  ivaMonto: number;
  precioFinal: number;
}

function FlowStep({
  label,
  value,
  sublabel,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
  accent?: "blue" | "green" | "slate";
}) {
  const colors = {
    blue: "bg-blue-600 text-white border-blue-600",
    green: "bg-emerald-600 text-white border-emerald-600",
    slate: "bg-white text-slate-700 border-slate-200",
  };
  const col = accent ? colors[accent] : colors.slate;

  return (
    <div className={`rounded-xl border-2 px-5 py-4 text-center ${col}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${accent ? "opacity-80" : "text-slate-400"}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold font-mono ${highlight ? "text-3xl" : ""}`}>{value}</p>
      {sublabel && (
        <p className={`text-xs mt-1 ${accent ? "opacity-70" : "text-slate-400"}`}>{sublabel}</p>
      )}
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <ArrowDown size={18} className="text-slate-300" />
      <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
        {label}
      </span>
    </div>
  );
}

export function PrecioVentaFlow({
  costoUnitario,
  margenPct,
  descuentoPct,
  ivaPct,
  precioNeto,
  ivaMonto,
  precioFinal,
}: PrecioVentaFlowProps) {
  return (
    <div className="flex flex-col items-center max-w-xs mx-auto gap-1">
      <FlowStep
        label="Costo unitario"
        value={formatCLP(Math.round(costoUnitario))}
        accent="slate"
      />
      <FlowArrow label={`Margen ${margenPct}%`} />
      <FlowStep
        label="Venta neta"
        value={formatCLP(Math.round(precioNeto))}
        sublabel="Sin IVA"
        accent="blue"
      />
      {descuentoPct > 0 && (
        <>
          <FlowArrow label={`Descuento ${descuentoPct}%`} />
          <FlowStep
            label="Con descuento"
            value={formatCLP(Math.round(precioNeto * (1 - descuentoPct / 100)))}
            accent="slate"
          />
        </>
      )}
      <FlowArrow label={`IVA ${ivaPct}%`} />
      <FlowStep
        label="Precio cliente"
        value={formatCLP(Math.round(precioFinal))}
        sublabel="Con IVA incluido"
        accent="green"
        highlight
      />
    </div>
  );
}

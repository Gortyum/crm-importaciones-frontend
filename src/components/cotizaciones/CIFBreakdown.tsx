import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatMoney } from "@/lib/utils";

interface CIFBreakdownProps {
  fobUsd: number;
  fleteUsd: number;
  seguroUsd: number;
  cifUsd: number;
}

export function CIFBreakdown({ fobUsd, fleteUsd, seguroUsd, cifUsd }: CIFBreakdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🚢</span>
          <span className="font-medium text-slate-700">CIF Total</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono font-semibold text-slate-800">
            {formatMoney(cifUsd, "USD")}
          </span>
          {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {/* Detail accordion */}
      {open && (
        <div className="px-4 py-4 space-y-2 bg-white border-t border-slate-100 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">FOB (mercadería puesta en origen)</span>
            <span className="font-mono text-slate-700">{formatMoney(fobUsd, "USD")}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">+ Flete internacional</span>
            <span className="font-mono text-slate-700">{formatMoney(fleteUsd, "USD")}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">+ Seguro</span>
            <span className="font-mono text-slate-700">{formatMoney(seguroUsd, "USD")}</span>
          </div>

          {/* Divider line */}
          <div className="border-t border-slate-200 pt-2 flex items-center justify-between font-semibold">
            <span className="text-slate-700">= CIF</span>
            <span className="font-mono text-blue-700">{formatMoney(cifUsd, "USD")}</span>
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            CIF = Cost + Insurance + Freight · Valor de la mercadería puesta en aduana chilena.
          </p>
        </div>
      )}
    </div>
  );
}

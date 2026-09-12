import { TipoCambioCard } from "./TipoCambioCard";
import { CIFBreakdown } from "./CIFBreakdown";
import { MercosurSelector } from "./MercosurSelector";
import { CostosImportacionTable } from "./CostosImportacionTable";
import { LandedCostCard } from "./LandedCostCard";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { calcImportacion, COSTOS_POR_TRANSPORTE } from "@/lib/importacion";
import type {
  CostoImportacionForm,
  ItemForm,
  DivisasResponse,
  ConfigGlobal,
} from "@/types/cotizacion.types";

interface Step2ImportacionProps {
  // Tipo de cambio
  divisas: DivisasResponse | null;
  tcUsdClp: number;
  tcBrlUsd: number;
  onTcUsdChange: (v: number) => void;
  onTcBrlChange: (v: number) => void;
  onRefreshDivisas: () => void;
  refreshingDivisas?: boolean;

  // Importación toggle
  incluirImportacion: boolean;
  onToggleImportacion: (v: boolean) => void;

  // Campos de importación
  transporte: string;
  onTransporteChange: (v: string) => void;
  certOrigen: boolean;
  onCertOrigenChange: (v: boolean) => void;
  contingenciaPct: number;
  onContingenciaChange: (v: number) => void;
  costos: CostoImportacionForm[];
  onCostosChange: (c: CostoImportacionForm[]) => void;

  // Items del paso 1 (para calcular preview)
  items: ItemForm[];
  config: ConfigGlobal;

  onBack: () => void;
  onNext: () => void;
}

export function Step2Importacion({
  divisas,
  tcUsdClp,
  tcBrlUsd,
  onTcUsdChange,
  onTcBrlChange,
  onRefreshDivisas,
  refreshingDivisas,
  incluirImportacion,
  onToggleImportacion,
  transporte,
  onTransporteChange,
  certOrigen,
  onCertOrigenChange,
  contingenciaPct,
  onContingenciaChange,
  costos,
  onCostosChange,
  items,
  config,
  onBack,
  onNext,
}: Step2ImportacionProps) {
  // Preview calculado localmente (indicativo, el backend es la fuente de verdad al guardar)
  const preview = incluirImportacion
    ? calcImportacion(
        items.map((it) => ({
          producto_id: it.producto_id,
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precio_unitario_fabrica: it.costo_original,
          divisa: it.divisa_origen,
          margen_pct: it.margen_pct,
        })),
        costos.map((c) => ({
          categoria: c.categoria,
          tipo: c.tipo,
          monto: c.monto,
          divisa: c.divisa,
          proveedor_id: c.proveedor_id,
        })),
        {
          tc_usd_clp: tcUsdClp || 950,
          tc_brl_usd: tcBrlUsd || 0.18,
          contingencia_pct: contingenciaPct,
          cert_origen: certOrigen,
          arancel_general: config.arancel_general,
          arancel_mercosur: config.arancel_mercosur,
          iva_pct: config.iva_chile,
        }
      )
    : null;

  const handleTransporteChange = (t: string) => {
    onTransporteChange(t);
    // Reset costos a los campos predeterminados del nuevo transporte
    const campos = COSTOS_POR_TRANSPORTE[t] || [];
    onCostosChange(
      campos.map((c) => ({
        categoria: c.categoria,
        tipo: c.tipo,
        monto: 0,
        divisa: c.tipo === "flete_local" || c.tipo === "honorarios" ? "CLP" : "USD",
        proveedor_id: null,
      }))
    );
  };

  return (
    <div className="space-y-6">
      {/* ── TIPO DE CAMBIO ── */}
      <TipoCambioCard
        divisas={divisas}
        tcUsdClp={tcUsdClp}
        onTcChange={onTcUsdChange}
        onRefresh={onRefreshDivisas}
        refreshing={refreshingDivisas}
      />

      {/* ── TC BRL→USD (si hay items en BRL) ── */}
      {items.some((it) => it.divisa_origen === "BRL") && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Label>TC BRL → USD</Label>
          <p className="text-xs text-slate-400 mb-2">Cuántos USD vale 1 BRL (ej: 0,18)</p>
          <Input
            type="number"
            min={0}
            step={0.0001}
            value={tcBrlUsd}
            onChange={(e) => onTcBrlChange(Number(e.target.value))}
            className="w-36 font-mono"
          />
        </div>
      )}

      {/* ── TOGGLE IMPORTACIÓN ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={incluirImportacion}
            onChange={(e) => onToggleImportacion(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-blue-600 shrink-0"
          />
          <div>
            <span className="font-semibold text-slate-700 text-sm">
              Calcular costo de importación
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Incluye FOB, flete, seguro, arancel y gastos locales para estimar el costo puesto en Chile.
            </p>
          </div>
        </label>
      </div>

      {/* ── SECCIÓN IMPORTACIÓN ── */}
      {incluirImportacion && (
        <>
          {/* Transporte */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
              <span>🚢</span> Modo de transporte
            </h3>
            <div>
              <Label>Vía de transporte</Label>
              <div className="flex gap-2 mt-1">
                {["Aereo", "Terrestre", "Courier"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTransporteChange(t)}
                    className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                      transporte === t
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {t === "Aereo" ? "✈️ Aéreo" : t === "Terrestre" ? "🚛 Terrestre" : "📦 Courier"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Contingencia cambiaria</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={contingenciaPct}
                  onChange={(e) => onContingenciaChange(Number(e.target.value))}
                  className="w-20 text-center font-mono"
                />
                <span className="text-sm text-slate-500">%</span>
                <span className="text-xs text-slate-400">de margen adicional sobre costos en USD</span>
              </div>
            </div>
          </div>

          {/* CIF Breakdown — solo preview */}
          {preview && (
            <CIFBreakdown
              fobUsd={preview.fob_total_usd}
              fleteUsd={preview.flete_usd}
              seguroUsd={preview.seguro_usd}
              cifUsd={preview.cif_total_usd}
            />
          )}

          {/* Mercosur */}
          <MercosurSelector
            certOrigen={certOrigen}
            onChange={onCertOrigenChange}
            arancelGeneral={config.arancel_general}
            arancelMercosur={config.arancel_mercosur}
          />

          {/* Costos de importación */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <CostosImportacionTable
              transporte={transporte}
              costos={costos}
              onChange={onCostosChange}
            />
          </div>

          {/* Landed Cost Card — solo si hay datos */}
          {preview && preview.costo_almacen_clp > 0 && (
            <LandedCostCard
              costoTotalClp={preview.costo_almacen_clp}
              cantidadTotal={preview.cantidad_total}
              fobUsd={preview.fob_total_usd}
              fleteUsd={preview.flete_usd}
              seguroUsd={preview.seguro_usd}
              arancelUsd={preview.arancel_usd}
              gastosLocalesClp={preview.gastos_locales_clp}
              contingenciaUsd={preview.contingencia_usd}
              tcUsdClp={tcUsdClp}
              extranjeroNoCifUsd={preview.extranjero_no_cif_usd}
            />
          )}
        </>
      )}

      {/* ── NAVEGACIÓN ── */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Volver
        </Button>
        <Button type="button" onClick={onNext}>
          Continuar →
        </Button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { ArrowLeft, ArrowRight, Percent, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { formatCLP, formatMoney } from "@/lib/utils";
import { PrecioVentaFlow } from "./PrecioVentaFlow";
import type { ItemForm, ConfigGlobal } from "@/types/cotizacion.types";
import { calcImportacion } from "@/lib/importacion";

interface Step3PrecioProps {
  items: ItemForm[];
  onItemsChange: (items: ItemForm[]) => void;
  incluirImportacion: boolean;
  transporte: string;
  certOrigen: boolean;
  contingenciaPct: number;
  costos: any[];
  tcUsdClp: number;
  tcBrlUsd: number;
  config: ConfigGlobal;
  onBack: () => void;
  onNext: () => void;
}

export function Step3Precio({
  items,
  onItemsChange,
  incluirImportacion,
  transporte,
  certOrigen,
  contingenciaPct,
  costos,
  tcUsdClp,
  tcBrlUsd,
  config,
  onBack,
  onNext,
}: Step3PrecioProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [margenGlobal, setMargenGlobal] = useState<number | "">("");
  const [descuentoGlobal, setDescuentoGlobal] = useState<number | "">("");

  // Preview de importación si aplica
  const impPreview = incluirImportacion
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
          iva_pct: config.iva_chile || 19,
        }
      )
    : null;

  const updateItem = (idx: number, patch: Partial<ItemForm>) => {
    onItemsChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const aplicarMargenATodos = () => {
    if (typeof margenGlobal === "number") {
      onItemsChange(items.map((it) => ({ ...it, margen_pct: margenGlobal })));
    }
  };

  const aplicarDescuentoATodos = () => {
    if (typeof descuentoGlobal === "number") {
      onItemsChange(items.map((it) => ({ ...it, descuento_pct: descuentoGlobal })));
    }
  };

  // Calcular métricas para el item seleccionado o para cada item
  const itemActual = items[selectedIdx] || items[0];

  // Determinar costo unitario en CLP para el item
  let costoUnitario = 0;
  if (impPreview && impPreview.items[selectedIdx]) {
    costoUnitario = impPreview.items[selectedIdx].costo_unitario_neto_clp;
  } else {
    // Si no es importación, calculamos en base a costo original convertido
    const factor = itemActual.divisa_origen === "USD" ? tcUsdClp : itemActual.divisa_origen === "BRL" ? (tcBrlUsd * tcUsdClp) : 1;
    const costoClp = itemActual.costo_original * factor;
    const flete = itemActual.costo_flete;
    const envio = itemActual.costo_envio;
    const baseTotal = (costoClp + envio) * itemActual.cantidad + flete;
    costoUnitario = itemActual.cantidad > 0 ? baseTotal / itemActual.cantidad : 0;
  }

  // Margen sobre venta: PrecioNeto = Costo / (1 - Margen/100)
  // Con descuento: PrecioNetoConDesc = PrecioNeto * (1 - Desc/100)
  const margen = itemActual.margen_pct;
  const precioNeto = margen < 100 ? costoUnitario / (1 - margen / 100) : 0;
  const precioConDescuento = precioNeto * (1 - (itemActual.descuento_pct || 0) / 100);
  const ivaPct = itemActual.iva_pct || 19;
  const ivaMonto = precioConDescuento * (ivaPct / 100);
  const precioFinal = precioConDescuento + ivaMonto;

  return (
    <div className="space-y-6">
      {/* Selector de item si hay más de 1 */}
      {items.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-semibold text-slate-700">Seleccionar producto para configurar precio:</Label>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Margen %"
                  value={margenGlobal}
                  onChange={(e) => setMargenGlobal(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-24 text-xs h-8"
                />
                <Button type="button" variant="outline" size="sm" onClick={aplicarMargenATodos} className="text-xs h-8">
                  Aplicar a todos
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {items.map((it, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-left shrink-0 transition-colors ${
                  selectedIdx === idx
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {it.imagen_url && (
                    <img src={it.imagen_url} alt="" className="w-5 h-5 object-contain rounded border border-slate-200 shrink-0" />
                  )}
                  <span className="font-semibold truncate max-w-[120px]">{it.descripcion || `Item ${idx + 1}`}</span>
                </div>
                <div className="text-[10px] text-slate-400">Margen: {it.margen_pct}%</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel izquierdo: Controles de Margen y Descuento */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span>📈</span> Configurar Precio de Venta
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Producto: <strong className="text-slate-700">{itemActual.descripcion || "Item"}</strong> ({itemActual.cantidad} unidades)
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="text-sm font-medium text-slate-700">Margen Comercial (% sobre venta)</Label>
                <span className="text-xs font-bold text-blue-600">{itemActual.margen_pct}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="1"
                  value={itemActual.margen_pct}
                  onChange={(e) => updateItem(selectedIdx, { margen_pct: Number(e.target.value) })}
                  className="flex-1 accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={itemActual.margen_pct}
                  onChange={(e) => updateItem(selectedIdx, { margen_pct: Number(e.target.value) })}
                  className="w-20 text-right font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Representa el margen real sobre el precio de venta final neto (no markup sobre costo).
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="text-sm font-medium text-slate-700">Descuento (%)</Label>
                <span className="text-xs font-medium text-slate-500">{itemActual.descuento_pct}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={itemActual.descuento_pct}
                  onChange={(e) => updateItem(selectedIdx, { descuento_pct: Number(e.target.value) })}
                  className="flex-1 accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={itemActual.descuento_pct}
                  onChange={(e) => updateItem(selectedIdx, { descuento_pct: Number(e.target.value) })}
                  className="w-20 text-right font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Costo unitario ({incluirImportacion ? "Puesto en Chile" : "Base"}):</span>
                <span className="font-mono font-medium text-slate-700">{formatCLP(Math.round(costoUnitario))}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Precio neto unitario:</span>
                <span className="font-mono font-medium text-blue-700">{formatCLP(Math.round(precioConDescuento))}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>IVA ({ivaPct}%):</span>
                <span className="font-mono font-medium text-slate-700">{formatCLP(Math.round(ivaMonto))}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-800 pt-2 border-t border-slate-200">
                <span>Precio cliente (con IVA):</span>
                <span className="font-mono text-emerald-700 text-lg">{formatCLP(Math.round(precioFinal))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho: Flujo visual Costo -> Margen -> Venta Neta -> IVA -> Precio Cliente */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col justify-center items-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Estructura de Precio (Unitario)
          </h3>
          <PrecioVentaFlow
            costoUnitario={costoUnitario}
            margenPct={itemActual.margen_pct}
            descuentoPct={itemActual.descuento_pct}
            ivaPct={ivaPct}
            precioNeto={precioNeto}
            ivaMonto={ivaMonto}
            precioFinal={precioFinal}
          />
        </div>
      </div>

      {/* Navegación */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-1" /> Volver a Importación
        </Button>
        <Button type="button" onClick={onNext} size="lg">
          Continuar a Resumen <ArrowRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}

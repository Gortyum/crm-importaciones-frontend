import { ArrowLeft, CheckCircle, FileText, Send, Building, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCLP, formatMoney } from "@/lib/utils";
import { RentabilidadCard } from "./RentabilidadCard";
import type { ItemForm, Cliente, Contacto, Proveedor, ConfigGlobal } from "@/types/cotizacion.types";
import { calcImportacion } from "@/lib/importacion";

interface Step4ResumenProps {
  cliente: Cliente | undefined;
  contacto: Contacto | undefined;
  proveedores: Proveedor[];
  items: ItemForm[];
  notas: string;
  divisaGlobal: string;
  tcUsdClp: number;
  tcBrlUsd: number;
  incluirImportacion: boolean;
  transporte: string;
  certOrigen: boolean;
  contingenciaPct: number;
  costos: any[];
  config: ConfigGlobal;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}

export function Step4Resumen({
  cliente,
  contacto,
  proveedores,
  items,
  notas,
  divisaGlobal,
  tcUsdClp,
  tcBrlUsd,
  incluirImportacion,
  transporte,
  certOrigen,
  contingenciaPct,
  costos,
  config,
  saving,
  onBack,
  onSave,
}: Step4ResumenProps) {
  // Cálculo o preview de importación
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

  // Cálculos totales
  let costoTotal = 0;
  let ventaNetaTotal = 0;
  let ivaTotal = 0;

  const itemsCalculados = items.map((it, idx) => {
    let costoUnitario = 0;
    if (impPreview && impPreview.items[idx]) {
      costoUnitario = impPreview.items[idx].costo_unitario_neto_clp;
    } else {
      const factor = it.divisa_origen === "USD" ? tcUsdClp : it.divisa_origen === "BRL" ? (tcBrlUsd * tcUsdClp) : 1;
      const costoClp = it.costo_original * factor;
      const flete = it.costo_flete;
      const envio = it.costo_envio;
      const baseTotal = (costoClp + envio) * it.cantidad + flete;
      costoUnitario = it.cantidad > 0 ? baseTotal / it.cantidad : 0;
    }

    const margen = it.margen_pct;
    const precioNetoUnit = margen < 100 ? costoUnitario / (1 - margen / 100) : 0;
    const precioNetoConDesc = precioNetoUnit * (1 - (it.descuento_pct || 0) / 100);
    const subtotalNetoItem = precioNetoConDesc * it.cantidad;
    const ivaItem = subtotalNetoItem * ((it.iva_pct || 19) / 100);
    const totalItem = subtotalNetoItem + ivaItem;

    costoTotal += costoUnitario * it.cantidad;
    ventaNetaTotal += subtotalNetoItem;
    ivaTotal += ivaItem;

    return {
      ...it,
      costoUnitario,
      precioNetoUnit: precioNetoConDesc,
      subtotalNetoItem,
      ivaItem,
      totalItem,
    };
  });

  const totalCliente = ventaNetaTotal + ivaTotal;
  const utilidad = ventaNetaTotal - costoTotal;
  const margenReal = ventaNetaTotal > 0 ? (utilidad / ventaNetaTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* ── LAS 4 PREGUNTAS CLAVE ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">¿Cuánto cuesta?</p>
          <p className="text-2xl font-bold text-slate-800 font-mono mt-1">{formatCLP(Math.round(costoTotal))}</p>
          <span className="text-[11px] text-slate-400">Costo total operación</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">¿Cuánto cobro?</p>
          <p className="text-2xl font-bold text-blue-700 font-mono mt-1">{formatCLP(Math.round(ventaNetaTotal))}</p>
          <span className="text-[11px] text-blue-500 font-medium">+ IVA ({formatCLP(Math.round(ivaTotal))})</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">¿Cuánto gano?</p>
          <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">{formatCLP(Math.round(utilidad))}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Utilidad estimada</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">¿Qué margen tengo?</p>
          <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">{Math.round(margenReal)}%</p>
          <span className="text-[11px] text-slate-400">Margen comercial real</span>
        </div>
      </div>

      {/* ── DATOS DEL CLIENTE Y CONFIGURACIÓN ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 md:col-span-2 space-y-2">
          <h3 className="font-semibold text-sm uppercase text-slate-500 flex items-center gap-1.5">
            <Building size={14} /> Cliente Receptor
          </h3>
          <div className="pt-1">
            <p className="font-bold text-slate-800 text-base">{cliente?.razon_social || "Cliente no especificado"}</p>
            <p className="text-sm text-slate-500">RUT: {cliente?.rut} · {cliente?.direccion}</p>
            {contacto && (
              <p className="text-xs text-slate-400 mt-1">
                Atención: <strong className="text-slate-600">{contacto.nombre}</strong> ({contacto.cargo}) · {contacto.email}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
          <h3 className="font-semibold text-sm uppercase text-slate-500 flex items-center gap-1.5">
            <ShieldCheck size={14} /> Parámetros
          </h3>
          <div className="text-xs space-y-1.5 text-slate-600 pt-1">
            <div className="flex justify-between">
              <span>Tipo de cambio:</span>
              <span className="font-mono font-medium">{formatMoney(tcUsdClp, "CLP", 0)} / USD</span>
            </div>
            <div className="flex justify-between">
              <span>Importación:</span>
              <span className="font-medium text-blue-600">{incluirImportacion ? `Sí (${transporte})` : "No"}</span>
            </div>
            {incluirImportacion && (
              <div className="flex justify-between">
                <span>Certificado Mercosur:</span>
                <span className="font-medium">{certOrigen ? "Sí (0% arancel)" : "No"}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DETALLE DE PRODUCTOS ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-800 text-sm">Detalle de Productos Cotizados</h3>
          <span className="text-xs text-slate-400">{items.length} producto(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4 text-center">Cant.</th>
                <th className="py-3 px-4 text-right">Precio Proveedor</th>
                <th className="py-3 px-4 text-right">Costo Unit. (CLP)</th>
                <th className="py-3 px-4 text-right">Margen</th>
                <th className="py-3 px-4 text-right">P. Venta Neto</th>
                <th className="py-3 px-4 text-right">Total c/IVA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsCalculados.map((it, idx) => {
                const prov = proveedores.find((p) => p.id === it.proveedor_id);
                return (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {it.imagen_url && (
                          <img
                            src={it.imagen_url}
                            alt=""
                            className="w-9 h-9 object-contain rounded border border-slate-200 shrink-0 bg-white"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{it.descripcion || "Item"}</p>
                          <p className="text-[10px] text-slate-400">{it.tipo_personalizacion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {prov?.razon_social || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{it.cantidad}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatMoney(it.costo_original, it.divisa_origen)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCLP(Math.round(it.costoUnitario))}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-blue-600">
                      {it.margen_pct}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                      {formatCLP(Math.round(it.precioNetoUnit))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCLP(Math.round(it.totalItem))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CARD DE RENTABILIDAD COMERCIAL ── */}
      <RentabilidadCard
        costoTotal={costoTotal}
        ventaNeta={ventaNetaTotal}
        utilidad={utilidad}
        margenPct={margenReal}
      />

      {/* ── TOTALES Y NOTAS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {notas ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <h4 className="text-xs font-semibold uppercase text-slate-400">Notas / Observaciones</h4>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{notas}</p>
          </div>
        ) : <div />}

        <div className="bg-white rounded-xl border-2 border-blue-600 p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resumen Financiero</h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Neto:</span>
              <span className="font-mono font-semibold">{formatCLP(Math.round(ventaNetaTotal))}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA (19%):</span>
              <span className="font-mono font-semibold">{formatCLP(Math.round(ivaTotal))}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <span className="text-base font-bold text-slate-900">TOTAL CLIENTE:</span>
              <span className="text-2xl font-bold font-mono text-blue-700">{formatCLP(Math.round(totalCliente))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACCIONES ── */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-1" /> Volver a Precio
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={saving}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
        >
          {saving ? (
            "Guardando cotización..."
          ) : (
            <>
              <CheckCircle size={18} className="mr-2" /> Guardar cotización
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ChevronRight,
  ShoppingCart,
  Ship,
  Link2,
  Building,
  TrendingUp,
  FileCheck,
  AlertCircle,
  Package,
} from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { formatCLP, formatMoney } from "@/lib/utils";
import { generarPDF } from "@/lib/pdf-generator";
import { generarOC_PDF } from "@/lib/oc-pdf-generator";
import { ESTADOS_COLORES, TRANSICIONES } from "@/types/cotizacion.types";

export default function DetalleCotizacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cot, setCot] = useState<any>(null);
  const [imp, setImp] = useState<any>(null);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creandoOCId, setCreandoOCId] = useState<number | null>(null);

  const load = async () => {
    try {
      const [cotData, provs] = await Promise.all([
        api.cotizaciones.get(Number(id)),
        api.proveedores.list(),
      ]);
      setCot(cotData);
      setProveedores(provs);
      if (cotData.importacion_id) {
        try {
          const impData = await api.importaciones.get(cotData.importacion_id);
          setImp(impData);
        } catch {
          setImp(null);
        }
      } else {
        setImp(null);
      }
    } catch {
      navigate("/cotizaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const cambiarEstado = async (estado: string) => {
    if (!confirm(`¿Cambiar estado de la cotización a "${estado}"?`)) return;
    await api.cotizaciones.changeEstado(cot.id, estado);
    load();
  };

  const handlePDF = async () => {
    if (!cot) return;
    const data = await api.cotizaciones.pdfData(cot.id);
    generarPDF(data);
  };

  const handleCrearOC = async (proveedorId: number) => {
    setCreandoOCId(proveedorId);
    try {
      const oc = await api.ordenesCompra.create({
        cotizacion_id: cot.id,
        proveedor_id: proveedorId,
        notas: `Generada desde ${cot.correlativo}`,
      });
      const pdfData = await api.ordenesCompra.pdfData(oc.id);
      generarOC_PDF(pdfData);
      navigate(`/ordenes-compra/${oc.id}`);
    } catch (e: any) {
      alert(e.message || "Error al crear la orden de compra");
    } finally {
      setCreandoOCId(null);
    }
  };

  if (loading || !cot) {
    return <div className="p-8 text-center text-slate-400">Cargando cotización...</div>;
  }

  const transiciones = TRANSICIONES[cot.estado] || [];
  const esAceptada = ["Cerrada", "En Produccion", "Entregada"].includes(cot.estado);

  // Cálculos financieros globales
  const subtotalNetoVenta = cot.items?.reduce((s: number, i: any) => s + (i.subtotal || 0), 0) || 0;
  const ivaVenta = cot.items?.reduce((s: number, i: any) => s + (i.iva_monto || 0), 0) || 0;
  const totalClienteVenta = cot.total_general || subtotalNetoVenta + ivaVenta;

  // Si hay importación vinculada, obtenemos el costo total de importación
  const costoTotalEstimado = imp?.resultado?.costo_almacen_clp
    ? imp.resultado.costo_almacen_clp
    : (cot.items || []).reduce((acc: number, it: any) => {
        const factor = it.divisa_origen === "CLP" ? 1 : (it.tipo_cambio || 1);
        return acc + (it.costo_original * factor + (it.costo_envio || 0)) * it.cantidad + (it.costo_flete || 0);
      }, 0);

  const utilidadEstimada = subtotalNetoVenta - costoTotalEstimado;
  const margenEstimadoPct = subtotalNetoVenta > 0 ? (utilidadEstimada / subtotalNetoVenta) * 100 : 0;

  // Proveedores agrupados para órdenes de compra
  const proveedoresConItems = (() => {
    const map = new Map<number, any[]>();
    for (const item of cot.items || []) {
      if (!item.proveedor_id) continue;
      if (!map.has(item.proveedor_id)) map.set(item.proveedor_id, []);
      map.get(item.proveedor_id)!.push(item);
    }
    return Array.from(map.entries()).map(([provId, items]) => {
      const prov = proveedores.find((p: any) => p.id === provId);
      const divisaProv = items[0]?.divisa_origen || "USD";
      const totalOriginal = items.reduce((acc: number, it: any) => acc + it.costo_original * it.cantidad, 0);
      return {
        provId,
        provNombre: prov?.razon_social || `Proveedor #${provId}`,
        divisaProv,
        totalOriginal,
        items,
      };
    });
  })();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── HEADER SUPERIOR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/cotizaciones")}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-mono text-slate-800">{cot.correlativo}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ESTADOS_COLORES[cot.estado] || "bg-slate-100"}`}>
                {cot.estado}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Fecha de emisión: {new Date(cot.fecha).toLocaleDateString("es-CL")}
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePDF}>
            <Download size={14} className="mr-1.5" /> PDF Cotización
          </Button>

          {!cot.importacion_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!confirm("¿Crear una importación de costeo para esta cotización?")) return;
                try {
                  const imp = await api.cotizaciones.crearImportacion(cot.id);
                  navigate(`/importaciones/${imp.id}`);
                } catch (e: any) {
                  alert(e.message);
                }
              }}
            >
              <Ship size={14} className="mr-1.5 text-blue-600" /> Crear Importación
            </Button>
          )}

          {transiciones.map((estadoSig) => (
            <Button
              key={estadoSig}
              size="sm"
              variant={estadoSig === "Cancelada" ? "destructive" : "default"}
              onClick={() => cambiarEstado(estadoSig)}
            >
              {estadoSig} <ChevronRight size={14} className="ml-1" />
            </Button>
          ))}
        </div>
      </div>

      {/* ── REGLA DE ORO: 4 INDICADORES COMERCIALES ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">¿Cuánto cuesta?</p>
          <p className="text-2xl font-bold text-slate-800 font-mono mt-1">
            {formatCLP(Math.round(costoTotalEstimado))}
          </p>
          <span className="text-[10px] text-slate-400">
            {imp ? "Costo puesto en Chile" : "Costo estimado"}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">¿Cuánto cobro?</p>
          <p className="text-2xl font-bold text-blue-700 font-mono mt-1">
            {formatCLP(Math.round(subtotalNetoVenta))}
          </p>
          <span className="text-[10px] text-blue-600 font-medium">
            + IVA ({formatCLP(Math.round(ivaVenta))})
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">¿Cuánto gano?</p>
          <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">
            {formatCLP(Math.round(utilidadEstimada))}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Utilidad estimada</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">¿Qué margen tengo?</p>
          <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            {Math.round(margenEstimadoPct)}%
          </p>
          <span className="text-[10px] text-slate-400">Margen comercial real</span>
        </div>
      </div>

      {/* ── ACCIÓN DESTACADA: CREAR ORDEN DE COMPRA (SI ESTÁ ACEPTADA/CERRADA) ── */}
      {esAceptada && proveedoresConItems.length > 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck size={20} className="text-emerald-700" />
              <div>
                <h3 className="font-bold text-emerald-900 text-sm">Cotización Aceptada</h3>
                <p className="text-xs text-emerald-700">
                  Puedes generar la Orden de Compra conservando la moneda original de cada proveedor.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {proveedoresConItems.map(({ provId, provNombre, divisaProv, totalOriginal, items }) => (
              <div
                key={provId}
                className="bg-white rounded-lg border border-emerald-200 p-3.5 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{provNombre}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {items.length} item(s) · Subtotal:{" "}
                    <strong className="text-slate-700 font-mono">
                      {formatMoney(totalOriginal, divisaProv)}
                    </strong>
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleCrearOC(provId)}
                  disabled={creandoOCId === provId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0"
                >
                  <ShoppingCart size={13} className="mr-1" />
                  {creandoOCId === provId ? "Generando..." : "Crear OC"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── IMPORTACIÓN DE COSTEO ASOCIADA ── */}
      {imp && (() => {
        const r = imp.resultado || {};
        return (
          <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ship size={18} className="text-blue-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Importación de Costeo Vinculada</h3>
              </div>
              <Link
                to={`/importaciones/${imp.id}`}
                className="font-mono text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                {imp.correlativo} →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-slate-400">Estado Importación</p>
                <p className="font-semibold text-slate-700 mt-0.5">{imp.estado}</p>
              </div>
              <div>
                <p className="text-slate-400">Vía de Transporte</p>
                <p className="font-semibold text-slate-700 mt-0.5">{imp.transporte}</p>
              </div>
              <div>
                <p className="text-slate-400">Mercosur / Arancel</p>
                <p className="font-semibold text-slate-700 mt-0.5">
                  {imp.cert_origen ? "Certificado (0%)" : "General (6%)"}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Tipo de Cambio</p>
                <p className="font-semibold font-mono text-slate-700 mt-0.5">
                  {formatMoney(imp.tc_usd_clp, "CLP", 0)} / USD
                </p>
              </div>
            </div>

            {/* CIF y Landed Cost de la importación */}
            <div className="bg-blue-50/50 rounded-lg p-3.5 border border-blue-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500">FOB Total:</span>
                <p className="font-mono font-bold text-slate-800 text-sm">{formatMoney(r.fob_total_usd || 0, "USD")}</p>
              </div>
              <div>
                <span className="text-slate-500">Flete + Seguro:</span>
                <p className="font-mono font-bold text-slate-800 text-sm">
                  {formatMoney((r.flete_usd || 0) + (r.seguro_usd || 0), "USD")}
                </p>
              </div>
              <div>
                <span className="text-slate-500">CIF Total:</span>
                <p className="font-mono font-bold text-slate-800 text-sm">{formatMoney(r.cif_total_usd || 0, "USD")}</p>
              </div>
              <div>
                <span className="text-slate-500">Landed Cost (Chile):</span>
                <p className="font-mono font-bold text-blue-700 text-sm">
                  {formatCLP(Math.round(r.costo_almacen_clp || 0))}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── CLIENTE Y PARÁMETROS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 md:col-span-2 space-y-2">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Building size={14} /> Datos del Cliente
          </h3>
          <p className="text-base font-bold text-slate-800">{cot.cliente?.razon_social || `Cliente #${cot.cliente_id}`}</p>
          <p className="text-xs text-slate-500">RUT: {cot.cliente?.rut || "—"} · Dirección: {cot.cliente?.direccion || "—"}</p>
          {cot.contacto && (
            <p className="text-xs text-slate-400 mt-1">
              Contacto: <strong className="text-slate-700">{cot.contacto.nombre}</strong> ({cot.contacto.email})
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 text-xs">
          <h3 className="font-semibold uppercase tracking-wider text-slate-400">Condiciones Comerciales</h3>
          <div className="space-y-1 text-slate-600 pt-1">
            <div className="flex justify-between">
              <span>Moneda base:</span>
              <span className="font-semibold text-slate-700">{cot.divisa_original}</span>
            </div>
            <div className="flex justify-between">
              <span>Tipo de cambio:</span>
              <span className="font-mono font-semibold text-slate-700">{cot.tipo_cambio}</span>
            </div>
            <div className="flex justify-between">
              <span>Estado:</span>
              <span className="font-semibold text-blue-600">{cot.estado}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABLA DE PRODUCTOS ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Package size={16} /> Productos de la Cotización
          </h3>
          <span className="text-xs text-slate-400">{cot.items?.length || 0} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4 text-center">Cant.</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4 text-right">Precio Fábrica</th>
                <th className="py-3 px-4 text-right">Personalización</th>
                <th className="py-3 px-4 text-right">P. Venta Neto</th>
                <th className="py-3 px-4 text-right">Total c/IVA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cot.items?.map((item: any) => {
                const prov = proveedores.find((p: any) => p.id === item.proveedor_id);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {item.imagen_url && (
                          <img
                            src={item.imagen_url}
                            alt=""
                            className="w-10 h-10 object-contain rounded border border-slate-200 shrink-0 bg-white"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{item.descripcion}</p>
                          <span className="text-[10px] text-slate-400">Margen: {item.margen_pct}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">{item.cantidad}</td>
                    <td className="py-3 px-4 text-slate-600">{prov?.razon_social || "—"}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {formatMoney(item.costo_original, item.divisa_origen)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px]">
                        {item.tipo_personalizacion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                      {formatCLP(item.precio_venta_unitario)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCLP(item.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TOTALES FINALES ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        {cot.notas ? (
          <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-md w-full text-xs">
            <p className="font-semibold uppercase tracking-wider text-slate-400 mb-1">Notas / Observaciones</p>
            <p className="text-slate-600 whitespace-pre-wrap">{cot.notas}</p>
          </div>
        ) : <div />}

        <div className="bg-white rounded-xl border-2 border-blue-600 p-5 space-y-2 min-w-[280px] w-full sm:w-auto ml-auto">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal Neto:</span>
            <span className="font-mono font-semibold">{formatCLP(Math.round(subtotalNetoVenta))}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>IVA (19%):</span>
            <span className="font-mono font-semibold">{formatCLP(Math.round(ivaVenta))}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">TOTAL CLIENTE:</span>
            <span className="text-xl font-bold font-mono text-blue-700">
              {formatCLP(Math.round(totalClienteVenta))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

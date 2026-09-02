import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Truck, ShieldCheck, Calculator, RefreshCw } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { formatMoney, divisaNombre } from "@/lib/utils";
import { COSTOS_POR_TRANSPORTE, DIVISAS, calcImportacion, toUSD as toUSDVal, type CostoForm, type ItemImportacion } from "@/lib/importacion";

interface Proveedor { id: number; razon_social: string; categoria_id: number | null; }
interface Categoria { id: number; nombre: string; }

const MAX_ITEMS_PREVIEW = 3;

function defaultCostos(transporte: string): CostoForm[] {
  return COSTOS_POR_TRANSPORTE[transporte].map((c) => ({ categoria: c.categoria, tipo: c.tipo, monto: 0, divisa: c.tipo === "flete_local" || c.tipo === "honorarios" ? "CLP" : "USD", proveedor_id: null }));
}

const emptyItem: ItemImportacion = { producto_id: null, descripcion: "", cantidad: 1, precio_unitario_fabrica: 0, divisa: "USD", margen_pct: 35 };

export default function NuevaImportacion() {
  const navigate = useNavigate();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [transporte, setTransporte] = useState("Aereo");
  const [certOrigen, setCertOrigen] = useState(true);
  const [tcUsdClp, setTcUsdClp] = useState(920);
  const [tcBrlUsd, setTcBrlUsd] = useState(0.18);
  const [contPct, setContPct] = useState(2);
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState<ItemImportacion[]>([{ ...emptyItem }]);
  const [costos, setCostos] = useState<CostoForm[]>(() => defaultCostos("Aereo"));
  const [config, setConfig] = useState({ iva_chile: 19, arancel_general: 6, arancel_mercosur: 0 });
  const [rolProv, setRolProv] = useState<Record<number, number | null>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.proveedores.list(), api.proveedorCategorias.list(), api.config.get(), api.divisas.cambio()])
      .then(([provs, cats, cfg, div]) => {
        setProveedores(provs);
        setCategorias(cats);
        setConfig(cfg);
        if (div.monedas.USD) setTcUsdClp(div.monedas.USD);
        if (div.monedas.USD && div.monedas.BRL) setTcBrlUsd(Math.round((div.monedas.BRL / div.monedas.USD) * 10000) / 10000);
      });
  }, []);

  const cargarDivisas = async () => {
    try {
      const div = await api.divisas.cambio();
      setTcUsdClp(div.monedas.USD || 0);
      if (div.monedas.USD && div.monedas.BRL) setTcBrlUsd(Math.round((div.monedas.BRL / div.monedas.USD) * 10000) / 10000);
    } catch { /* mantiene los valores actuales */ }
  };

  const changeTransporte = (t: string) => {
    setTransporte(t);
    setCostos((prev) => {
      return COSTOS_POR_TRANSPORTE[t].map((c) => {
        const existente = prev.find((p) => p.categoria === c.categoria);
        return existente ? { ...existente } : { categoria: c.categoria, tipo: c.tipo, monto: 0, divisa: c.tipo === "flete_local" || c.tipo === "honorarios" ? "CLP" : "USD", proveedor_id: null };
      });
    });
  };

  const updateItem = (idx: number, patch: Partial<ItemImportacion>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateCosto = (idx: number, patch: Partial<CostoForm>) => {
    setCostos((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const preview = calcImportacion(items, costos, {
    tc_usd_clp: tcUsdClp || 0,
    tc_brl_usd: tcBrlUsd || 0,
    contingencia_pct: contPct || 0,
    cert_origen: certOrigen,
    arancel_general: config.arancel_general,
    arancel_mercosur: config.arancel_mercosur,
    iva_pct: config.iva_chile,
  });

  const save = async () => {
    setError("");
    if (items.length === 0 || items.some((i) => !i.descripcion || i.cantidad <= 0)) {
      setError("Agrega al menos un item con descripción y cantidad");
      return;
    }
    setSaving(true);
    try {
      const proveedoresImport = categorias
        .filter((c) => rolProv[c.id])
        .map((c) => ({ proveedor_id: rolProv[c.id]!, categoria_id: c.id }));
      const imp = await api.importaciones.create({
        transporte,
        cert_origen: certOrigen,
        tc_usd_clp: tcUsdClp || 0,
        tc_brl_usd: tcBrlUsd || 0,
        contingencia_pct: contPct || 0,
        notas,
        items,
        costos: costos.map((c) => ({ ...c, proveedor_id: c.proveedor_id ?? null })),
        proveedores: proveedoresImport,
      });
      navigate(`/importaciones/${imp.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/importaciones")}><ArrowLeft size={16} /></Button>
          <div>
            <h1 className="text-2xl font-bold">Nueva Importación</h1>
            <p className="text-slate-500 text-sm mt-1">Costeo multimoneda Brasil → Chile</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar importación"}</Button>
      </div>

      <div className="bg-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Transporte</Label>
            <Select value={transporte} onChange={(e) => changeTransporte(e.target.value)}>
              {["Courier", "Aereo", "Terrestre"].map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <Label>Contingencia cambiaria (%)</Label>
            <Input type="number" step="0.1" value={contPct} onChange={(e) => setContPct(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Tipos de cambio</h3>
            <Button variant="ghost" size="sm" onClick={cargarDivisas}>
              <RefreshCw size={13} className="mr-1" /> Actualizar
            </Button>
          </div>
          <p className="text-xs text-slate-500 mb-3">Los montos en USD y BRL se convierten a CLP con estos tipos al calcular el costo de almacén.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>1 USD</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">=</span>
                <Input type="number" step="0.01" value={tcUsdClp} onChange={(e) => setTcUsdClp(parseFloat(e.target.value) || 0)} className="pl-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">CLP</span>
              </div>
            </div>
            <div>
              <Label>1 BRL</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">=</span>
                <Input type="number" step="0.0001" value={tcBrlUsd} onChange={(e) => setTcBrlUsd(parseFloat(e.target.value) || 0)} className="pl-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">USD</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap text-xs text-slate-500">
            <span className="px-2 py-1 bg-slate-100 rounded">TC USD→CLP: 1 USD = {formatMoney(tcUsdClp || 0, "CLP")}</span>
            <span className="px-2 py-1 bg-slate-100 rounded">TC BRL→USD: 1 BRL = {formatMoney(tcBrlUsd || 0, "USD")} = {formatMoney((tcBrlUsd || 0) * (tcUsdClp || 0), "CLP")}</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setCertOrigen(!certOrigen)}
            className={`flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-colors ${certOrigen ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}
          >
            <ShieldCheck size={18} className={certOrigen ? "text-green-600" : "text-red-500"} />
            <div className="flex-1">
              <p className="font-medium text-sm">Certificado de Origen Mercosur (ACE 35)</p>
              <p className="text-xs text-slate-500">Arancel {certOrigen ? "0%" : `${config.arancel_general}%`}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-bold ${certOrigen ? "bg-green-600 text-white" : "bg-red-500 text-white"}`}>
              {certOrigen ? "SÍ" : "NO"}
            </span>
          </button>
        </div>
      </div>

      {categorias.length > 0 && (
        <div className="bg-card p-5">
          <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3"><Truck size={14} className="inline mr-1" /> Proveedores de la importación</h2>
          <div className="grid grid-cols-2 gap-4">
            {categorias.map((cat) => (
              <div key={cat.id}>
                <Label>{cat.nombre}</Label>
                <Select value={rolProv[cat.id] ?? ""} onChange={(e) => setRolProv({ ...rolProv, [cat.id]: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">— Seleccionar proveedor —</option>
                  {proveedores.map((p) => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
                </Select>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">Las categorías se administran desde la página de Proveedores.</p>
        </div>
      )}

      <div className="bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm uppercase text-slate-500">Items de mercancía</h2>
          <Button variant="outline" size="sm" onClick={addItem}><Plus size={14} className="mr-1" /> Agregar item</Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="pb-2">Descripción</th>
              <th className="pb-2 w-20 text-center">Cantidad</th>
              <th className="pb-2 w-40">Precio unit. fábrica</th>
              <th className="pb-2 w-32">Moneda</th>
              <th className="pb-2 w-28">Margen %</th>
              <th className="pb-2 w-14"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 pr-2">
                  <Input value={item.descripcion} onChange={(e) => updateItem(idx, { descripcion: e.target.value })} placeholder="Descripción / producto" />
                </td>
                <td className="py-2 text-center"><Input type="number" min={1} value={item.cantidad} onChange={(e) => updateItem(idx, { cantidad: parseInt(e.target.value) || 1 })} /></td>
                <td className="py-2">
                  <div className="relative">
                    <Input type="number" step="0.01" value={item.precio_unitario_fabrica} onChange={(e) => updateItem(idx, { precio_unitario_fabrica: parseFloat(e.target.value) || 0 })} className="pr-12" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">{item.divisa}</span>
                  </div>
                </td>
                <td className="py-2">
                  <div>
                    <Select value={item.divisa} onChange={(e) => updateItem(idx, { divisa: e.target.value })}>
                      {DIVISAS.map((d) => <option key={d} value={d}>{d} — {divisaNombre(d)}</option>)}
                    </Select>
                    {item.precio_unitario_fabrica > 0 && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        = {formatMoney(toUSDVal(item.precio_unitario_fabrica, item.divisa, tcUsdClp, tcBrlUsd), "USD")}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-2"><Input type="number" step="0.5" value={item.margen_pct} onChange={(e) => updateItem(idx, { margen_pct: parseFloat(e.target.value) || 0 })} /></td>
                <td className="py-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={items.length === 1}><Trash2 size={14} className="text-red-500" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-card p-5">
        <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3">Costos de importación — {transporte}</h2>
        <div className="space-y-3">
          {costos.map((c, idx) => (
            <div key={c.categoria} className="grid grid-cols-[1fr_180px_130px_28px] gap-3 items-center">
              <div>
                <p className="text-sm font-medium">{COSTOS_POR_TRANSPORTE[transporte].find((x) => x.categoria === c.categoria)?.etiqueta || c.categoria}</p>
                <Select value={c.proveedor_id ?? ""} onChange={(e) => updateCosto(idx, { proveedor_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">Sin proveedor</option>
                  {proveedores.map((p) => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
                </Select>
              </div>
              <div className="relative">
                <Input type="number" step="0.01" value={c.monto} onChange={(e) => updateCosto(idx, { monto: parseFloat(e.target.value) || 0 })} className="pr-12" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">{c.divisa}</span>
              </div>
              <div>
                <Select value={c.divisa} onChange={(e) => updateCosto(idx, { divisa: e.target.value })}>
                  {DIVISAS.map((d) => <option key={d} value={d}>{d} — {divisaNombre(d)}</option>)}
                </Select>
                {c.monto > 0 && c.divisa !== "CLP" && (
                  <p className="text-[11px] text-slate-500 mt-1">{formatMoney(toUSDVal(c.monto, c.divisa, tcUsdClp, tcBrlUsd), "USD")}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => { updateCosto(idx, { monto: 0 }); }} title="Limpiar">
                <Trash2 size={14} className="text-slate-400" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator size={16} className="text-blue-600" />
          <h2 className="font-semibold text-sm uppercase text-slate-500">Costeo en vivo</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">FOB Total</p>
            <p className="font-medium font-mono">{formatMoney(preview.fob_total_usd, "USD")}</p>
            <p className="text-sm text-slate-500 mt-2">Flete int.</p>
            <p className="font-medium font-mono">{formatMoney(preview.flete_usd, "USD")}</p>
            <p className="text-sm text-slate-500 mt-2">Seguro int.</p>
            <p className="font-medium font-mono">{formatMoney(preview.seguro_usd, "USD")}</p>
            <p className="text-sm text-slate-500 mt-2">CIF</p>
            <p className="font-semibold font-mono text-blue-700">{formatMoney(preview.cif_total_usd, "USD")}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Contingencia ({contPct}%)</p>
            <p className="font-medium font-mono">{formatMoney(preview.contingencia_usd, "USD")}</p>
            <p className="text-sm text-slate-500 mt-2">Arancel ({preview.config.arancel_pct}%)</p>
            <p className="font-medium font-mono">{formatMoney(preview.arancel_usd, "USD")}</p>
            <p className="text-sm text-slate-500 mt-2">Gastos locales (directo en CLP)</p>
            <p className="font-medium font-mono">{formatMoney(preview.gastos_locales_clp, "CLP")}</p>
            <p className="text-sm text-slate-500 mt-2">IVA importación (informativo)</p>
            <p className="font-medium font-mono text-amber-600">{formatMoney(preview.iva_importacion_clp, "CLP")}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Costo total almacén</p>
            <p className="text-2xl font-bold text-blue-700 font-mono">{formatMoney(preview.costo_almacen_clp, "CLP")}</p>
            <p className="text-sm text-slate-500 mt-2">Costo unitario promedio</p>
            <p className="font-semibold font-mono">{formatMoney(preview.costo_unitario_promedio_clp, "CLP")} <span className="text-xs text-slate-400">×{preview.cantidad_total}</span></p>
            <p className="text-xs text-slate-400 mt-2">A convertir a CLP: {formatMoney(preview.sub_total_extranjero_usd, "USD")}</p>
          </div>
        </div>

        {preview.items.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="pb-2">Item</th>
                  <th className="pb-2 text-center">Cant.</th>
                  <th className="pb-2 text-right">Costo unit. (CLP)</th>
                  <th className="pb-2 text-right">P. venta neto (CLP)</th>
                  <th className="pb-2 text-right">P. público (CLP)</th>
                </tr>
              </thead>
              <tbody>
                {preview.items.slice(0, MAX_ITEMS_PREVIEW).map((i, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2">{i.descripcion || `Item ${idx + 1}`}<span className="text-xs text-slate-400"> ({formatMoney(i.precio_unitario_fabrica, i.divisa)})</span></td>
                    <td className="py-2 text-center">{i.cantidad}</td>
                    <td className="py-2 text-right">{formatMoney(i.costo_unitario_neto_clp, "CLP")}</td>
                    <td className="py-2 text-right">{formatMoney(i.precio_venta_neto_clp, "CLP")}</td>
                    <td className="py-2 text-right font-medium">{formatMoney(i.precio_venta_total_clp, "CLP")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="pt-2">Totales venta</td>
                  <td></td>
                  <td></td>
                  <td className="pt-2 text-right">{formatMoney(preview.totales_venta.neto, "CLP")}</td>
                  <td className="pt-2 text-right text-blue-700">{formatMoney(preview.totales_venta.total, "CLP")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card p-5">
        <Label>Notas</Label>
        <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones de la importación" />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}
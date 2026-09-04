import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, FileText, Upload, X } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { formatCLP } from "@/lib/utils";

interface Cliente { id: number; razon_social: string; rut: string; direccion: string; giro: string; }
interface Contacto { id: number; nombre: string; cargo: string; email: string; telefono: string; es_principal: boolean; }
interface Producto { id: number; nombre: string; descripcion: string; }
interface Proveedor { id: number; razon_social: string; tax_id: string; pais_origen: string; }
interface Divisas { USD: number; BRL: number; }

interface ItemForm {
  producto_id: number | null;
  proveedor_id: number | null;
  descripcion: string;
  cantidad: number;
  costo_original: number;
  divisa_origen: string;
  peso_kg: number;
  volumen_m3: number;
  tipo_flete: string;
  costo_flete: number;
  costo_envio: number;
  imagen_url: string;
  margen_pct: number;
  descuento_pct: number;
  tipo_personalizacion: string;
  iva_pct: number;
}

const emptyItem: ItemForm = {
  producto_id: null, proveedor_id: null, descripcion: "", cantidad: 1, costo_original: 0,
  divisa_origen: "CLP", peso_kg: 0, volumen_m3: 0, tipo_flete: "Terrestre",
  costo_flete: 0, costo_envio: 0, imagen_url: "", margen_pct: 30, descuento_pct: 0, tipo_personalizacion: "Serigrafia", iva_pct: 19,
};

const TARIFAS_KG: Record<string, number> = { Aereo: 4500, Terrestre: 1800, Maritimo: 900 };
const TARIFAS_M3: Record<string, number> = { Aereo: 35000, Terrestre: 12000, Maritimo: 5000 };

// Factor que convierte el costo del item a CLP segun su divisa_origen.
// - CLP: sin conversion (1)
// - Misma divisa que la cotizacion: usa el tipo de cambio ajustado por el usuario
// - USD/BRL: usa la tasa de la API de divisas
function factorCambio(item: ItemForm, divisaGlobal: string, tipoCambioGlobal: number, divisas: Divisas): number {
  if (item.divisa_origen === "CLP") return 1;
  if (item.divisa_origen === divisaGlobal) return tipoCambioGlobal > 0 ? tipoCambioGlobal : 1;
  if (item.divisa_origen === "USD") return divisas.USD > 0 ? divisas.USD : 1;
  if (item.divisa_origen === "BRL") return divisas.BRL > 0 ? divisas.BRL : 1;
  return tipoCambioGlobal > 0 ? tipoCambioGlobal : 1;
}

function calcFleteLocal(item: ItemForm): number {
  if (item.costo_flete > 0) return item.costo_flete;
  const porPeso = item.peso_kg * (TARIFAS_KG[item.tipo_flete] || 1800);
  const porVol = item.volumen_m3 * (TARIFAS_M3[item.tipo_flete] || 12000);
  return Math.max(porPeso, porVol);
}

function calcItemLocal(item: ItemForm, factor: number) {
  const costoClp = item.costo_original * factor;
  const flete = calcFleteLocal(item);
  const envio = item.costo_envio;
  const sub = (costoClp + envio) * item.cantidad + flete;
  const conMargen = sub * (1 + item.margen_pct / 100);
  const conDesc = conMargen * (1 - item.descuento_pct / 100);
  const precioUnit = item.cantidad > 0 ? conDesc / item.cantidad : 0;
  const iva = conDesc * (item.iva_pct / 100);
  return { precioUnit: Math.round(precioUnit), subtotal: Math.round(conDesc), iva: Math.round(iva), total: Math.round(conDesc + iva) };
}

export default function NuevaCotizacion() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [divisas, setDivisas] = useState<Divisas>({ USD: 950, BRL: 1107 });

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [contactoId, setContactoId] = useState<number | null>(null);
  const [divisa, setDivisa] = useState("CLP");
  const [tipoCambio, setTipoCambio] = useState(1);
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState<ItemForm[]>([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([api.clientes.list(), api.productos.list(), api.proveedores.list(), api.divisas.cambio()])
      .then(([cls, prods, provs, div]) => {
        setClientes(cls);
        setProductos(prods);
        setProveedores(provs);
        setDivisas({ USD: div.monedas.USD || 950, BRL: div.monedas.BRL || 1107 });
      });
  }, []);

  const selectCliente = async (id: number) => {
    setClienteId(id);
    const conts = await api.clientes.contactos(id);
    setContactos(conts);
    if (conts.length === 1) setContactoId(conts[0].id);
    else setContactoId(null);
  };

  const selectDivisa = (d: string) => {
    setDivisa(d);
    if (d === "CLP") setTipoCambio(1);
    else if (d === "USD") setTipoCambio(divisas.USD);
    else if (d === "BRL") setTipoCambio(divisas.BRL);
  };

  const updateItem = (idx: number, patch: Partial<ItemForm>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const selectProducto = (idx: number, prodId: number) => {
    const prod = productos.find((p) => p.id === prodId);
    updateItem(idx, { producto_id: prodId, descripcion: prod?.nombre || "" });
  };

  const handleImageUpload = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const { url } = await api.upload.image(file);
      updateItem(idx, { imagen_url: url });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploadingIdx(null);
    }
  };

  const resumen = items.reduce(
    (acc, it) => {
      const factor = factorCambio(it, divisa, tipoCambio, divisas);
      const calc = calcItemLocal(it, factor);
      acc.subtotal += calc.subtotal;
      acc.iva += calc.iva;
      acc.total += calc.total;
      return acc;
    },
    { subtotal: 0, iva: 0, total: 0 }
  );

  const guardar = async () => {
    if (!clienteId) return alert("Selecciona un cliente");
    setSaving(true);
    try {
      const data = {
        cliente_id: clienteId,
        contacto_id: contactoId,
        divisa_original: divisa,
        tipo_cambio: tipoCambio,
        notas,
        items: items.map((it) => ({
          ...it,
          producto_id: it.producto_id,
          tipo_cambio: factorCambio(it, divisa, tipoCambio, divisas),
        })),
      };
      const cot = await api.cotizaciones.create(data);
      navigate(`/cotizaciones/${cot.id}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/cotizaciones")}><ArrowLeft size={16} /></Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva cotización</h1>
          <p className="text-slate-500 text-sm mt-1">Completa los datos para generar la cotización</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-card p-5 space-y-4 col-span-2">
          <h2 className="font-semibold text-sm uppercase text-slate-500">Datos del cliente</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cliente</Label>
              <Select value={clienteId ?? ""} onChange={(e) => selectCliente(Number(e.target.value))}>
                <option value="">Seleccionar cliente...</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.razon_social} — {c.rut}</option>)}
              </Select>
            </div>
            <div>
              <Label>Contacto</Label>
              <Select value={contactoId ?? ""} onChange={(e) => setContactoId(Number(e.target.value))} disabled={!clienteId}>
                <option value="">Seleccionar contacto...</option>
                {contactos.map((c) => <option key={c.id} value={c.id}>{c.nombre} — {c.cargo}</option>)}
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase text-slate-500">Divisa y cambio</h2>
          <div>
            <Label>Divisa origen</Label>
            <Select value={divisa} onChange={(e) => selectDivisa(e.target.value)}>
              <option value="CLP">CLP — Peso Chileno</option>
              <option value="USD">USD — Dólar</option>
              <option value="BRL">BRL — Real</option>
            </Select>
          </div>
          <div>
            <Label>Tipo de cambio (→ CLP)</Label>
            <Input type="number" value={tipoCambio} onChange={(e) => setTipoCambio(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm uppercase text-slate-500">Items de la cotización</h2>
          <Button variant="outline" size="sm" onClick={addItem}><Plus size={14} className="mr-1" /> Agregar item</Button>
        </div>

        {items.map((item, idx) => {
          const calc = calcItemLocal(item, factorCambio(item, divisa, tipoCambio, divisas));
          return (
            <div key={idx} className="border rounded-lg p-4 space-y-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Item {idx + 1}</span>
                {items.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeItem(idx)}><Trash2 size={14} className="text-red-500" /></Button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <Label>Producto</Label>
                  <Select value={item.producto_id ?? ""} onChange={(e) => selectProducto(idx, Number(e.target.value))}>
                    <option value="">Seleccionar...</option>
                    {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Proveedor</Label>
                  <Select value={item.proveedor_id ?? ""} onChange={(e) => updateItem(idx, { proveedor_id: Number(e.target.value) || null })}>
                    <option value="">Sin proveedor</option>
                    {proveedores.map((p) => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Cantidad</Label>
                  <Input type="number" min={1} value={item.cantidad} onChange={(e) => updateItem(idx, { cantidad: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Personalización</Label>
                  <Select value={item.tipo_personalizacion} onChange={(e) => updateItem(idx, { tipo_personalizacion: e.target.value })}>
                    <option>Bordado</option><option>Serigrafia</option><option>Full Print</option><option>Dtf</option><option>Sublimacion</option>
                  </Select>
                </div>
                <div>
                  <Label>Costo ({item.divisa_origen})</Label>
                  <Input type="number" min={0} value={item.costo_original} onChange={(e) => updateItem(idx, { costo_original: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Divisa</Label>
                  <Select value={item.divisa_origen} onChange={(e) => updateItem(idx, { divisa_origen: e.target.value })}>
                    <option value="CLP">CLP</option><option value="USD">USD</option><option value="BRL">BRL</option>
                  </Select>
                </div>
                <div>
                  <Label>Envío (CLP/u)</Label>
                  <Input type="number" min={0} value={item.costo_envio} onChange={(e) => updateItem(idx, { costo_envio: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Peso (kg)</Label>
                  <Input type="number" min={0} step={0.1} value={item.peso_kg} onChange={(e) => updateItem(idx, { peso_kg: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Volumen (m³)</Label>
                  <Input type="number" min={0} step={0.001} value={item.volumen_m3} onChange={(e) => updateItem(idx, { volumen_m3: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Vía de flete</Label>
                  <Select value={item.tipo_flete} onChange={(e) => updateItem(idx, { tipo_flete: e.target.value })}>
                    <option>Terrestre</option><option>Aereo</option><option>Maritimo</option>
                  </Select>
                </div>
                <div>
                  <Label>Flete (CLP, total)</Label>
                  <Input type="number" min={0} value={item.costo_flete} onChange={(e) => updateItem(idx, { costo_flete: Number(e.target.value) })} placeholder="0 = auto" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Margen %</Label>
                  <Input type="number" min={0} max={500} value={item.margen_pct} onChange={(e) => updateItem(idx, { margen_pct: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Descuento %</Label>
                  <Input type="number" min={0} max={100} value={item.descuento_pct} onChange={(e) => updateItem(idx, { descuento_pct: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>IVA %</Label>
                  <Input type="number" min={0} value={item.iva_pct} onChange={(e) => updateItem(idx, { iva_pct: Number(e.target.value) })} />
                </div>
                <div className="flex items-end">
                  <div className="text-right w-full">
                    <p className="text-xs text-slate-400">Precio venta unit.</p>
                    <p className="text-lg font-bold text-blue-600">{formatCLP(calc.precioUnit)}</p>
                  </div>
                </div>
              </div>

              <div className="text-right text-sm space-x-4">
                <span className="text-slate-500">Subtotal: <strong>{formatCLP(calc.subtotal)}</strong></span>
                <span className="text-slate-500">IVA: <strong>{formatCLP(calc.iva)}</strong></span>
                <span className="text-blue-700">Total: <strong>{formatCLP(calc.total)}</strong></span>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                {item.imagen_url ? (
                  <div className="relative">
                    <img src={item.imagen_url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                    <button
                      onClick={() => updateItem(idx, { imagen_url: "" })}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 hover:text-blue-600 border border-dashed border-slate-300 rounded-lg px-3 py-2 hover:border-blue-400 transition-colors">
                    <Upload size={14} />
                    {uploadingIdx === idx ? "Subiendo..." : "Subir imagen"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(idx, file);
                        e.target.value = "";
                      }}
                      disabled={uploadingIdx === idx}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card p-5 space-y-4">
        <Label>Notas / Observaciones</Label>
        <textarea
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm min-h-[80px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Notas para el cliente (aparecerán en el PDF)..."
        />
      </div>

      <div className="bg-card p-5 flex items-center justify-between">
        <div className="text-right space-y-1">
          <p className="text-sm text-slate-500">Subtotal: <strong>{formatCLP(resumen.subtotal)}</strong></p>
          <p className="text-sm text-slate-500">IVA (19%): <strong>{formatCLP(resumen.iva)}</strong></p>
          <p className="text-xl font-bold text-blue-700">Total: {formatCLP(resumen.total)}</p>
        </div>
        <Button onClick={guardar} disabled={saving} size="lg">
          <FileText size={16} className="mr-2" /> {saving ? "Guardando..." : "Crear cotización"}
        </Button>
      </div>
    </div>
  );
}

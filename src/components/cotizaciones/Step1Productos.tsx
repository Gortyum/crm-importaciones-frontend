import { useState } from "react";
import { Plus, Trash2, Upload, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { formatMoney, formatCLP } from "@/lib/utils";
import { api } from "@/services/api";
import type { ItemForm, Cliente, Contacto, Producto, Proveedor } from "@/types/cotizacion.types";
import { EMPTY_ITEM } from "@/types/cotizacion.types";

interface Step1ProductosProps {
  clientes: Cliente[];
  contactos: Contacto[];
  productos: Producto[];
  proveedores: Proveedor[];

  clienteId: number | null;
  contactoId: number | null;
  notas: string;
  items: ItemForm[];

  onClienteChange: (id: number) => void;
  onContactoChange: (id: number | null) => void;
  onNotasChange: (v: string) => void;
  onItemsChange: (items: ItemForm[]) => void;

  onNext: () => void;
}

// Calcula el subtotal de un item en su moneda original (solo para display orientativo)
function subtotalOriginal(item: ItemForm): string {
  const sub = item.costo_original * item.cantidad;
  if (sub === 0) return `0 ${item.divisa_origen}`;
  return formatMoney(sub, item.divisa_origen);
}

const PERSONALIZACIONES = ["Serigrafia", "Bordado", "Full Print", "Dtf", "Sublimacion", "Sin personalización"];

export function Step1Productos({
  clientes,
  contactos,
  productos,
  proveedores,
  clienteId,
  contactoId,
  notas,
  items,
  onClienteChange,
  onContactoChange,
  onNotasChange,
  onItemsChange,
  onNext,
}: Step1ProductosProps) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<Set<number>>(new Set([0]));

  const updateItem = (idx: number, patch: Partial<ItemForm>) => {
    onItemsChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => {
    onItemsChange([...items, { ...EMPTY_ITEM }]);
    setExpandedIdx((prev) => new Set([...prev, items.length]));
  };

  const removeItem = (idx: number) => {
    onItemsChange(items.filter((_, i) => i !== idx));
    setExpandedIdx((prev) => {
      const next = new Set<number>();
      prev.forEach((v) => { if (v < idx) next.add(v); else if (v > idx) next.add(v - 1); });
      return next;
    });
  };

  const toggleExpanded = (idx: number) => {
    setExpandedIdx((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const selectProducto = async (idx: number, prodId: number) => {
    const prod = productos.find((p) => p.id === prodId);
    let imagen = "";
    if (prod && !items[idx]?.imagen_url) {
      try {
        const fotos = await api.archivos.list("producto", prodId);
        imagen = fotos.find((f) => f.url)?.url || "";
      } catch {
        /* sin foto adjunta del producto */
      }
    }
    updateItem(idx, { producto_id: prodId, descripcion: prod?.nombre || "", imagen_url: imagen || items[idx]?.imagen_url || "" });
  };

  const handleImageUpload = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const res = await api.archivos.upload(file, "producto", null, true);
      updateItem(idx, { imagen_url: res.url || "" });
    } catch (e: any) {
      try {
        const { url } = await api.upload.image(file);
        updateItem(idx, { imagen_url: url });
      } catch (fallbackErr: any) {
        alert(fallbackErr.message || e.message);
      }
    } finally {
      setUploadingIdx(null);
    }
  };

  const canContinue = clienteId !== null && items.some((it) => it.descripcion.trim() !== "");

  return (
    <div className="space-y-6">
      {/* ── CLIENTE ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <span className="text-base">👤</span> Cliente
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Cliente *</Label>
            <Select
              value={clienteId ?? ""}
              onChange={(e) => onClienteChange(Number(e.target.value))}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razon_social} — {c.rut}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Contacto</Label>
            <Select
              value={contactoId ?? ""}
              onChange={(e) => onContactoChange(Number(e.target.value) || null)}
              disabled={!clienteId}
            >
              <option value="">Sin contacto específico</option>
              {contactos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — {c.cargo}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* ── PRODUCTOS ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="text-base">📦</span> Productos
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus size={14} className="mr-1" /> Agregar producto
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => {
            const expanded = expandedIdx.has(idx);
            return (
              <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                {/* Row header — siempre visible */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleExpanded(idx)}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {item.descripcion || "Producto sin nombre"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.cantidad} u · {subtotalOriginal(item)}
                      {item.proveedor_id && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">
                          {proveedores.find((p) => p.id === item.proveedor_id)?.razon_social}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeItem(idx); }}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded form */}
                {expanded && (
                  <div className="p-4 space-y-4 border-t border-slate-100">
                    {/* Row 1: Producto + Proveedor + Cantidad */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <Label>Producto del catálogo</Label>
                        <Select
                          value={item.producto_id ?? ""}
                          onChange={(e) => selectProducto(idx, Number(e.target.value))}
                        >
                          <option value="">Seleccionar o escribir abajo...</option>
                          {productos.map((p) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label>Descripción *</Label>
                        <Input
                          value={item.descripcion}
                          onChange={(e) => updateItem(idx, { descripcion: e.target.value })}
                          placeholder="Nombre del producto"
                        />
                      </div>
                      <div>
                        <Label>Proveedor / Fabricante</Label>
                        <Select
                          value={item.proveedor_id ?? ""}
                          onChange={(e) => updateItem(idx, { proveedor_id: Number(e.target.value) || null })}
                        >
                          <option value="">Sin proveedor</option>
                          {proveedores.map((p) => (
                            <option key={p.id} value={p.id}>{p.razon_social}</option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    {/* Row 2: Precio + Divisa + Cantidad */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <Label>Precio proveedor</Label>
                        <Input
                          type="number"
                          min={0}
                          value={item.costo_original}
                          onChange={(e) => updateItem(idx, { costo_original: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Moneda</Label>
                        <Select
                          value={item.divisa_origen}
                          onChange={(e) => updateItem(idx, { divisa_origen: e.target.value })}
                        >
                          <option value="USD">USD — Dólar</option>
                          <option value="BRL">BRL — Real</option>
                          <option value="CLP">CLP — Peso</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.cantidad}
                          onChange={(e) => updateItem(idx, { cantidad: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Personalización</Label>
                        <Select
                          value={item.tipo_personalizacion}
                          onChange={(e) => updateItem(idx, { tipo_personalizacion: e.target.value })}
                        >
                          {PERSONALIZACIONES.map((p) => <option key={p}>{p}</option>)}
                        </Select>
                      </div>
                    </div>

                    {/* Subtotal badge */}
                    {item.costo_original > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Subtotal en moneda original:</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-mono font-medium text-slate-700">
                          {subtotalOriginal(item)}
                        </span>
                      </div>
                    )}

                    {/* Imagen */}
                    <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                      <span className="text-xs text-slate-400">Imagen del producto:</span>
                      {item.imagen_url ? (
                        <div className="relative inline-flex">
                          <img src={item.imagen_url} alt="" className="w-14 h-14 object-contain rounded-lg border border-slate-200" />
                          <button
                            type="button"
                            onClick={() => updateItem(idx, { imagen_url: "" })}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500 hover:text-blue-600 border border-dashed border-slate-300 rounded-lg px-3 py-2 hover:border-blue-400 transition-colors">
                          <Upload size={12} />
                          {uploadingIdx === idx ? "Subiendo..." : "Subir imagen"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingIdx === idx}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(idx, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── NOTAS ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <Label>Notas / Observaciones</Label>
        <textarea
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[80px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          value={notas}
          onChange={(e) => onNotasChange(e.target.value)}
          placeholder="Notas para el cliente (aparecerán en el PDF)..."
        />
      </div>

      {/* ── NEXT ── */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          size="lg"
        >
          Continuar →
        </Button>
      </div>
    </div>
  );
}

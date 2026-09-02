import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Tag } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";

interface Proveedor {
  id: number; razon_social: string; tax_id: string; pais_origen: string; etiquetas_productos: string[]; categoria_id: number | null; categoria?: { id: number; nombre: string } | null;
}
interface Categoria { id: number; nombre: string; }

const empty = { razon_social: "", tax_id: "", pais_origen: "", etiquetas_productos: [] as string[], categoria_id: null as number | null };

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [etiquetasStr, setEtiquetasStr] = useState("");
  const [error, setError] = useState("");
  const [nuevaCat, setNuevaCat] = useState("");

  const load = () => Promise.all([api.proveedores.list(), api.proveedorCategorias.list()]).then(([p, c]) => { setProveedores(p); setCategorias(c); });
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditId(null); setEtiquetasStr(""); setDialogOpen(true); setError(""); };
  const openEdit = (p: Proveedor) => { setForm({ razon_social: p.razon_social, tax_id: p.tax_id, pais_origen: p.pais_origen, etiquetas_productos: p.etiquetas_productos || [], categoria_id: p.categoria_id }); setEditId(p.id); setEtiquetasStr((p.etiquetas_productos || []).join(", ")); setDialogOpen(true); };

  const save = async () => {
    try {
      const data = { ...form, etiquetas_productos: etiquetasStr.split(",").map((s) => s.trim()).filter(Boolean) };
      if (editId) await api.proveedores.update(editId, data);
      else await api.proveedores.create(data);
      setDialogOpen(false);
      load();
    } catch (e: any) { setError(e.message); }
  };

  const del = async (id: number) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    await api.proveedores.delete(id);
    load();
  };

  const addCategoria = async () => {
    const nombre = nuevaCat.trim();
    if (!nombre) return;
    await api.proveedorCategorias.create({ nombre });
    setNuevaCat("");
    load();
  };

  const delCategoria = async (id: number) => {
    if (!confirm("¿Eliminar esta categoría? Los proveedores quedarán sin categoría.")) return;
    await api.proveedorCategorias.delete(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="text-slate-500 text-sm mt-1">{proveedores.length} registros</p>
        </div>
        <Button onClick={openNew}><Plus size={16} className="mr-1" /> Nuevo proveedor</Button>
      </div>

      <div className="bg-card p-5">
        <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3"><Tag size={14} className="inline mr-1" /> Categorías de proveedor</h2>
        <div className="flex gap-2 flex-wrap items-center">
          {categorias.map((c) => (
            <span key={c.id} className="px-3 py-1 bg-slate-100 rounded-lg text-sm flex items-center gap-2">
              {c.nombre}
              <button onClick={() => delCategoria(c.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
            </span>
          ))}
          <div className="flex gap-1">
            <Input value={nuevaCat} onChange={(e) => setNuevaCat(e.target.value)} placeholder="Nueva categoría" className="w-44" />
            <Button size="sm" variant="outline" onClick={addCategoria}><Plus size={14} /></Button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">Estas categorías se usan como roles (Mercancía, Logística, Aduana, Flete Local) en las importaciones.</p>
      </div>

      <div className="bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b bg-slate-50">
              <th className="p-3">Razón Social</th>
              <th className="p-3">Tax ID</th>
              <th className="p-3">País</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Etiquetas</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3 font-medium">{p.razon_social}</td>
                <td className="p-3">{p.tax_id}</td>
                <td className="p-3 text-slate-500">{p.pais_origen}</td>
                <td className="p-3">
                  {p.categoria ? (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{p.categoria.nombre}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-1 flex-wrap">
                    {(p.etiquetas_productos || []).map((e, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-xs">{e}</span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-right space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => del(p.id)}><Trash2 size={14} className="text-red-500" /></Button>
                </td>
              </tr>
            ))}
            {proveedores.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Sin proveedores registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Editar proveedor" : "Nuevo proveedor"}>
        <div className="space-y-4">
          <div><Label>Razón Social</Label><Input value={form.razon_social} onChange={(e) => setForm({ ...form, razon_social: e.target.value })} /></div>
          <div><Label>Tax ID (RUT/CNPJ)</Label><Input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} /></div>
          <div><Label>País de origen</Label><Input value={form.pais_origen} onChange={(e) => setForm({ ...form, pais_origen: e.target.value })} /></div>
          <div>
            <Label>Categoría</Label>
            <Select value={form.categoria_id ?? ""} onChange={(e) => setForm({ ...form, categoria_id: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </div>
          <div><Label>Etiquetas de productos</Label><Input value={etiquetasStr} onChange={(e) => setEtiquetasStr(e.target.value)} placeholder="Separadas por coma" /></div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
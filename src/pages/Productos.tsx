import { useEffect, useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";

interface Producto {
  id: number; nombre: string; descripcion: string; unidad: string;
}

const empty = { nombre: "", descripcion: "", unidad: "Unidad" };

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () => api.productos.list().then(setProductos);
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditId(null); setDialogOpen(true); setError(""); };
  const openEdit = (p: Producto) => { setForm({ nombre: p.nombre, descripcion: p.descripcion, unidad: p.unidad }); setEditId(p.id); setDialogOpen(true); };

  const save = async () => {
    try {
      if (editId) await api.productos.update(editId, form);
      else await api.productos.create(form);
      setDialogOpen(false);
      load();
    } catch (e: any) { setError(e.message); }
  };

  const del = async (id: number) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await api.productos.delete(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-slate-500 text-sm mt-1">{productos.length} registros</p>
        </div>
        <Button onClick={openNew}><Plus size={16} className="mr-1" /> Nuevo producto</Button>
      </div>

      <div className="bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b bg-slate-50">
              <th className="p-3">Nombre</th>
              <th className="p-3">Descripción</th>
              <th className="p-3">Unidad</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3 font-medium">{p.nombre}</td>
                <td className="p-3 text-slate-500">{p.descripcion}</td>
                <td className="p-3 text-slate-500">{p.unidad}</td>
                <td className="p-3 text-right space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => del(p.id)}><Trash2 size={14} className="text-red-500" /></Button>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">Sin productos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Editar producto" : "Nuevo producto"}>
        <div className="space-y-4">
          <div><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
          <div><Label>Descripción</Label><Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
          <div>
            <Label>Unidad</Label>
            <Select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })}>
              <option value="Unidad">Unidad</option>
              <option value="Par">Par</option>
              <option value="Docena">Docena</option>
              <option value="Kg">Kg</option>
              <option value="Metro">Metro</option>
            </Select>
          </div>
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

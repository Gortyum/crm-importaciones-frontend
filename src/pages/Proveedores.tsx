import { useEffect, useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Dialog } from "@/components/ui/Dialog";

interface Proveedor {
  id: number; razon_social: string; tax_id: string; pais_origen: string; etiquetas_productos: string[];
}

const empty = { razon_social: "", tax_id: "", pais_origen: "", etiquetas_productos: [] as string[] };

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [etiquetasStr, setEtiquetasStr] = useState("");
  const [error, setError] = useState("");

  const load = () => api.proveedores.list().then(setProveedores);
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditId(null); setEtiquetasStr(""); setDialogOpen(true); setError(""); };
  const openEdit = (p: Proveedor) => { setForm({ razon_social: p.razon_social, tax_id: p.tax_id, pais_origen: p.pais_origen, etiquetas_productos: p.etiquetas_productos || [] }); setEditId(p.id); setEtiquetasStr((p.etiquetas_productos || []).join(", ")); setDialogOpen(true); };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="text-slate-500 text-sm mt-1">{proveedores.length} registros</p>
        </div>
        <Button onClick={openNew}><Plus size={16} className="mr-1" /> Nuevo proveedor</Button>
      </div>

      <div className="bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b bg-slate-50">
              <th className="p-3">Razón Social</th>
              <th className="p-3">Tax ID</th>
              <th className="p-3">País</th>
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
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Sin proveedores registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Editar proveedor" : "Nuevo proveedor"}>
        <div className="space-y-4">
          <div><Label>Razón Social</Label><Input value={form.razon_social} onChange={(e) => setForm({ ...form, razon_social: e.target.value })} /></div>
          <div><Label>Tax ID (RUT/CNPJ)</Label><Input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} /></div>
          <div><Label>País de origen</Label><Input value={form.pais_origen} onChange={(e) => setForm({ ...form, pais_origen: e.target.value })} /></div>
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

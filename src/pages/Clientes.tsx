import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Phone, Mail } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Dialog } from "@/components/ui/Dialog";

interface Cliente {
  id: number; razon_social: string; rut: string; direccion: string; giro: string; created_at: string;
}

interface Contacto {
  id: number; nombre: string; cargo: string; email: string; telefono: string; es_principal: boolean;
}

const emptyCliente = { razon_social: "", rut: "", direccion: "", giro: "" };
const emptyContacto = { nombre: "", cargo: "", email: "", telefono: "", es_principal: false };

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contactoDialog, setContactoDialog] = useState<number | null>(null);
  const [form, setForm] = useState(emptyCliente);
  const [contactoForm, setContactoForm] = useState(emptyContacto);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () => api.clientes.list().then(setClientes);

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(emptyCliente); setEditId(null); setDialogOpen(true); setError(""); };
  const openEdit = (c: Cliente) => { setForm({ razon_social: c.razon_social, rut: c.rut, direccion: c.direccion, giro: c.giro }); setEditId(c.id); setDialogOpen(true); setError(""); };

  const save = async () => {
    try {
      if (editId) await api.clientes.update(editId, form);
      else await api.clientes.create(form);
      setDialogOpen(false);
      load();
    } catch (e: any) { setError(e.message); }
  };

  const del = async (id: number) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    await api.clientes.delete(id);
    load();
  };

  const openContactos = async (clienteId: number) => {
    setContactoDialog(clienteId);
    const conts = await api.clientes.contactos(clienteId);
    setContactos(conts);
    setContactoForm(emptyContacto);
  };

  const addContacto = async () => {
    if (!contactoDialog) return;
    await api.clientes.addContacto(contactoDialog, contactoForm);
    const conts = await api.clientes.contactos(contactoDialog);
    setContactos(conts);
    setContactoForm(emptyContacto);
  };

  const delContacto = async (cliId: number, contId: number) => {
    await api.clientes.deleteContacto(cliId, contId);
    const conts = await api.clientes.contactos(cliId);
    setContactos(conts);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">{clientes.length} registros</p>
        </div>
        <Button onClick={openNew}><Plus size={16} className="mr-1" /> Nuevo cliente</Button>
      </div>

      <div className="bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b bg-slate-50">
              <th className="p-3">Razón Social</th>
              <th className="p-3">RUT</th>
              <th className="p-3">Dirección</th>
              <th className="p-3">Giro</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3 font-medium">{c.razon_social}</td>
                <td className="p-3">{c.rut}</td>
                <td className="p-3 text-slate-500">{c.direccion}</td>
                <td className="p-3 text-slate-500">{c.giro}</td>
                <td className="p-3 text-right space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => openContactos(c.id)} title="Contactos"><Phone size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => del(c.id)}><Trash2 size={14} className="text-red-500" /></Button>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Sin clientes registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Editar cliente" : "Nuevo cliente"}>
        <div className="space-y-4">
          <div><Label>Razón Social</Label><Input value={form.razon_social} onChange={(e) => setForm({ ...form, razon_social: e.target.value })} /></div>
          <div><Label>RUT</Label><Input value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} /></div>
          <div><Label>Dirección</Label><Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></div>
          <div><Label>Giro</Label><Input value={form.giro} onChange={(e) => setForm({ ...form, giro: e.target.value })} /></div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={contactoDialog !== null} onClose={() => setContactoDialog(null)} title="Contactos">
        <div className="space-y-4">
          <div className="space-y-2">
            {contactos.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <div>
                  <p className="font-medium text-sm">{c.nombre} {c.es_principal && <span className="text-xs text-blue-600">(Principal)</span>}</p>
                  <p className="text-xs text-slate-500">{c.cargo} {c.email && `· ${c.email}`} {c.telefono && `· ${c.telefono}`}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => delContacto(contactoDialog!, c.id)}><Trash2 size={12} className="text-red-500" /></Button>
              </div>
            ))}
            {contactos.length === 0 && <p className="text-sm text-slate-400">Sin contactos</p>}
          </div>
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Agregar contacto</p>
            <Input placeholder="Nombre" value={contactoForm.nombre} onChange={(e) => setContactoForm({ ...contactoForm, nombre: e.target.value })} />
            <Input placeholder="Cargo" value={contactoForm.cargo} onChange={(e) => setContactoForm({ ...contactoForm, cargo: e.target.value })} />
            <Input placeholder="Email" value={contactoForm.email} onChange={(e) => setContactoForm({ ...contactoForm, email: e.target.value })} />
            <Input placeholder="Teléfono" value={contactoForm.telefono} onChange={(e) => setContactoForm({ ...contactoForm, telefono: e.target.value })} />
            <Button onClick={addContacto} size="sm">Agregar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

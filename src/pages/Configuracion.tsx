import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function Configuracion() {
  const [form, setForm] = useState({ iva_chile: 19, arancel_general: 6, arancel_mercosur: 0 });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.config.get().then((cfg) => setForm(cfg));
  }, []);

  const save = async () => {
    setError("");
    try {
      await api.config.update(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">Parámetros globales usados por el módulo de importaciones</p>
      </div>

      <div className="bg-card p-5 space-y-4">
        <div>
          <Label>IVA Chile (%)</Label>
          <Input type="number" step="0.1" value={form.iva_chile} onChange={(e) => setForm({ ...form, iva_chile: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <Label>Arancel general (%)</Label>
          <Input type="number" step="0.1" value={form.arancel_general} onChange={(e) => setForm({ ...form, arancel_general: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <Label>Arancel Mercosur / ACE 35 (%)</Label>
          <Input type="number" step="0.1" value={form.arancel_mercosur} onChange={(e) => setForm({ ...form, arancel_mercosur: parseFloat(e.target.value) || 0 })} />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={save}><Save size={14} className="mr-1" /> Guardar</Button>
          {saved && <span className="text-green-600 text-sm font-medium">Guardado ✓</span>}
        </div>
      </div>
    </div>
  );
}
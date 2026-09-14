import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { CotizacionOut, DocumentoEspecificaciones } from "@/types/cotizacion.types";

const VACIAS: DocumentoEspecificaciones = {
  material: "",
  personalizacion: "",
  color: "",
  medida_logo: "",
};

export default function NuevoDocumento() {
  const navigate = useNavigate();
  const [cotizaciones, setCotizaciones] = useState<CotizacionOut[]>([]);
  const [cotizacionId, setCotizacionId] = useState<string>("");
  const [especificaciones, setEspecificaciones] = useState<DocumentoEspecificaciones>(VACIAS);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.cotizaciones.list().then(setCotizaciones);
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nuevos = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (nuevos.length === 0) return;
    setArchivos((prev) => [...prev, ...nuevos]);
    setPreviews((prev) => [...prev, ...nuevos.map((f) => URL.createObjectURL(f))]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const quitarFoto = (idx: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const setCampo = (key: keyof DocumentoEspecificaciones, value: string) =>
    setEspecificaciones((prev) => ({ ...prev, [key]: value }));

  const crear = async () => {
    setError("");
    if (!cotizacionId) {
      setError("Selecciona la cotización asociada.");
      return;
    }
    setGuardando(true);
    try {
      const doc = await api.documentos.create({
        cotizacion_id: Number(cotizacionId),
        especificaciones,
      });
      for (const file of archivos) {
        await api.archivos.upload(file, "documento", doc.id, false);
      }
      navigate(`/documentos/${doc.id}`, { state: { generado: true } });
    } catch (e: any) {
      setError(e.message || "Error al crear el documento");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/documentos")}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo documento</h1>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-slate-400 mt-1.5">
            Se genera automáticamente con la estructura [PDF N]
          </p>
        </div>
      </div>

      <div className="bg-card p-6 space-y-6">
        <div>
          <Label>Cotización asociada</Label>
          <select
            value={cotizacionId}
            onChange={(e) => setCotizacionId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">Selecciona una cotización…</option>
            {cotizaciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.correlativo} — {c.cliente?.razon_social || "Sin cliente"} ({c.items.length} ítems)
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="block mb-2">Fotografías (bloque visual del catálogo)</Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={guardando}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="flex flex-wrap gap-3">
            {previews.map((p, i) => (
              <div key={i} className="relative">
                <img src={p} alt="" className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-white" />
                <button
                  type="button"
                  onClick={() => quitarFoto(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-500 hover:text-blue-600 flex flex-col items-center justify-center gap-1"
            >
              <ImagePlus size={18} />
              <span className="text-[10px]">Agregar</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="material">Material</Label>
            <Input id="material" value={especificaciones.material} onChange={(e) => setCampo("material", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="personalizacion">Personalización</Label>
            <Input id="personalizacion" value={especificaciones.personalizacion} onChange={(e) => setCampo("personalizacion", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Input id="color" value={especificaciones.color} onChange={(e) => setCampo("color", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="medidaLogo">Medida logo</Label>
            <Input id="medidaLogo" value={especificaciones.medida_logo} onChange={(e) => setCampo("medida_logo", e.target.value)} className="mt-1" />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/documentos")}>
            Cancelar
          </Button>
          <Button onClick={crear} disabled={guardando}>
            {guardando ? "Creando…" : "Crear documento"}
          </Button>
        </div>
      </div>
    </div>
  );
}
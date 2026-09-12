import { useEffect, useRef, useState } from "react";
import { Paperclip, Upload, Download, Trash2, FileText } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import type { ArchivoOut, EntidadArchivo } from "@/types/cotizacion.types";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  entidadTipo: EntidadArchivo;
  entidadId: number;
}

export function ArchivosAdjuntos({ entidadTipo, entidadId }: Props) {
  const [archivos, setArchivos] = useState<ArchivoOut[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [nota, setNota] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!entidadId) return;
    try {
      const data = await api.archivos.list(entidadTipo, entidadId);
      setArchivos(data);
    } catch {
      setArchivos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setCargando(true);
    load();
  }, [entidadTipo, entidadId]);

  const handleUpload = async (file: File | null | undefined) => {
    if (!file) return;
    setSubiendo(true);
    setNota("");
    try {
      const res = await api.archivos.upload(file, entidadTipo, entidadId, false);
      setNota(res.duplicado ? "El archivo ya estaba subido: se reutilizó la copia existente." : "Archivo subido correctamente.");
      await load();
    } catch (e: any) {
      setNota(e.message);
    } finally {
      setSubiendo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      await api.archivos.delete(id);
      setNota("Documento eliminado.");
      await load();
    } catch (e: any) {
      setNota(e.message);
    }
  };

  return (
    <div className="bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm uppercase text-slate-500 flex items-center gap-2">
          <Paperclip size={14} /> Documentos adjuntos
        </h2>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          disabled={subiendo}
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={subiendo}>
          <Upload size={14} className="mr-1" /> {subiendo ? "Subiendo..." : "Subir documento"}
        </Button>
      </div>

      {nota && <p className="text-xs text-slate-500 mb-3">{nota}</p>}

      <div className="divide-y divide-slate-100">
        {cargando ? (
          <p className="text-sm text-slate-400 py-3">Cargando documentos...</p>
        ) : archivos.length === 0 ? (
          <p className="text-sm text-slate-400 py-3">Sin documentos. Sube facturas, guías, fotos, etc.</p>
        ) : (
          archivos.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5">
              <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{a.nombre_original}</p>
                <p className="text-xs text-slate-400">
                  {formatSize(a.tamano)} · {a.created_by || "—"} ·{" "}
                  {new Date(a.created_at).toLocaleDateString("es-CL")}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(api.archivos.descargar(a.id), "_blank")}
                >
                  <Download size={14} />
                </Button>
                <Button size="sm" variant="ghost" className="hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(a.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
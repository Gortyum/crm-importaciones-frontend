import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileDown, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { ArchivosAdjuntos } from "@/components/ArchivosAdjuntos";
import { generarPDFCatalogo } from "@/lib/pdf-catalogo-generator";
import type { ArchivoOut, DocumentoEspecificaciones, DocumentoOut, DocumentoPDFData } from "@/types/cotizacion.types";

export default function DetalleDocumento() {
  const { id } = useParams<{ id: string }>();
  const documentoId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const [doc, setDoc] = useState<DocumentoOut | null>(null);
  const [data, setData] = useState<DocumentoPDFData | null>(null);
  const [fotos, setFotos] = useState<{ id: number; nombre: string; url: string }[]>([]);
  const [generando, setGenerando] = useState(false);
  const [nota, setNota] = useState("");
  const autoGenerado = useRef(false);

  const cargarFotos = useCallback(async () => {
    if (!documentoId) return;
    try {
      const archivos = await api.archivos.list("documento", documentoId);
      const conUrl = await Promise.all(
        archivos.filter((a) => a.mime_type.startsWith("image/")).map(async (a: ArchivoOut) => {
          const detalle = await api.archivos.get(a.id);
          return { id: a.id, nombre: a.nombre_original, url: detalle.url || a.url || "" };
        })
      );
      setFotos(conUrl.filter((f) => f.url));
    } catch {
      setFotos([]);
    }
  }, [documentoId]);

  useEffect(() => {
    if (!documentoId) return;
    api.documentos.get(documentoId).then(setDoc);
    api.documentos.pdfData(documentoId).then(setData);
    cargarFotos();
  }, [documentoId, cargarFotos]);

  const generar = useCallback(async () => {
    if (!data || !doc) return;
    setGenerando(true);
    setNota("");
    try {
      await cargarFotos();
      const archivos = await api.archivos.list("documento", documentoId);
      const urls = await Promise.all(
        archivos
          .filter((a) => a.mime_type.startsWith("image/"))
          .map(async (a: ArchivoOut) => {
            const detalle = await api.archivos.get(a.id);
            return detalle.url || a.url || "";
          })
      );
      await generarPDFCatalogo({
        correlativo: doc.correlativo,
        fecha: data.fecha,
        cliente_razon_social: data.cliente_razon_social,
        cotizacion_correlativo: data.cotizacion_correlativo,
        productos: data.productos,
        cantidad_total: data.cantidad_total,
        especificaciones: data.especificaciones,
        fotos: urls.filter(Boolean),
      });
      setNota("PDF generado y descargado.");
    } catch (e: any) {
      setNota(e.message || "No se pudo generar el PDF");
    } finally {
      setGenerando(false);
    }
  }, [data, doc, documentoId, cargarFotos]);

  useEffect(() => {
    const estado = location.state as { download?: boolean; generado?: boolean } | null;
    if (estado?.download && data && !autoGenerado.current) {
      autoGenerado.current = true;
      generar();
    }
    if (estado?.generado && data && !autoGenerado.current) {
      autoGenerado.current = true;
      generar();
    }
  }, [location.state, data, generar]);

  const eliminar = async () => {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      await api.documentos.delete(documentoId);
      navigate("/documentos");
    } catch (e: any) {
      setNota(e.message || "No se pudo eliminar");
    }
  };

  if (!doc || !data) {
    return <p className="text-slate-400">Cargando documento…</p>;
  }

  const spec: DocumentoEspecificaciones = data.especificaciones || { material: "", personalizacion: "", color: "", medida_logo: "" };
  const filasSpec = [
    ["Material", spec.material],
    ["Personalización", spec.personalizacion],
    ["Color", spec.color],
    ["Medida logo", spec.medida_logo],
  ].filter(([, v]) => v && v.trim());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/documentos")}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">{`[${doc.correlativo}]`}</h1>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-slate-400 mt-1.5">
              Documento A4 · Catálogo
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={generar} disabled={generando}>
            <FileDown size={14} className="mr-1" /> {generando ? "Generando…" : "Generar PDF"}
          </Button>
          <Button variant="outline" className="hover:bg-red-50 hover:text-red-600" onClick={eliminar}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {nota && <p className="text-sm text-slate-500">{nota}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ["Fecha", data.fecha ? new Date(data.fecha).toLocaleDateString("es-CL") : "—"],
          ["Cliente", data.cliente_razon_social || "—"],
          [
            "Cotización",
            data.cotizacion_correlativo ? (
              <Link key="c" to={`/cotizaciones/${doc.cotizacion_id}`} className="font-mono text-blue-700 underline">
                {data.cotizacion_correlativo}
              </Link>
            ) : (
              "—"
            ),
          ],
        ].map(([label, valor]) => (
          <div key={label as string} className="bg-card p-4">
            <p className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-400 font-semibold mb-1">{label}</p>
            <div className="font-semibold">{valor}</div>
          </div>
        ))}
      </div>

      <div className="bg-card p-5">
        <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3">Vistas del producto</h2>
        {fotos.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {fotos.map((f, i) => (
              <div key={f.id} className="flex flex-col items-center gap-1">
                <div className="w-full aspect-square rounded-lg border border-slate-200 bg-white flex items-center justify-center overflow-hidden">
                  <img src={f.url} alt={f.nombre} className="max-h-full object-contain" />
                </div>
                <p className="text-[10px] font-mono text-slate-400">Vista {i + 1}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Sin fotografías. Sube imágenes abajo y genera el PDF.</p>
        )}
      </div>

      <div className="bg-card p-5">
        <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3">Especificaciones</h2>
        {filasSpec.length > 0 ? (
          <dl className="divide-y divide-slate-100">
            {filasSpec.map(([k, v]) => (
              <div key={k} className="flex py-2.5">
                <dt className="w-48 text-sm text-slate-500 uppercase text-xs font-semibold pt-0.5">{k}</dt>
                <dd className="text-sm font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-slate-400">Sin especificaciones.</p>
        )}
      </div>

      <ArchivosAdjuntos entidadTipo="documento" entidadId={documentoId} />

      <div className="bg-card p-5">
        <h2 className="font-semibold text-sm uppercase text-slate-500 mb-3">Productos de la cotización</h2>
        <ul className="space-y-2">
          {data.productos.length === 0 && <li className="text-sm text-slate-400">Sin productos.</li>}
          {data.productos.map((p, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="text-slate-300 font-mono">{i + 1}.</span>
              <span className="font-medium text-slate-800">{p.descripcion}</span>
              <span className="text-slate-400">× {p.cantidad}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
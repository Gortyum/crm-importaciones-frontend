import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, FileDown } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import type { DocumentoOut } from "@/types/cotizacion.types";

export default function DocumentosList() {
  const [documentos, setDocumentos] = useState<DocumentoOut[]>([]);

  useEffect(() => {
    api.documentos.list().then(setDocumentos);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-slate-400 mt-1.5">
            {documentos.length} registros
          </p>
        </div>
        <Link to="/documentos/nuevo">
          <Button>
            <Plus size={14} className="mr-1" /> Nuevo documento
          </Button>
        </Link>
      </div>

      <div className="bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b bg-slate-50">
              <th className="p-3">Correlativo</th>
              <th className="p-3">Cotización</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Fecha</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((doc) => (
              <tr key={doc.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3 font-mono font-semibold text-blue-700">{`[${doc.correlativo}]`}</td>
                <td className="p-3 font-mono">{doc.cotizacion_correlativo || "—"}</td>
                <td className="p-3">{doc.cliente_razon_social || "—"}</td>
                <td className="p-3 text-slate-500">
                  {doc.fecha ? new Date(doc.fecha).toLocaleDateString("es-CL") : "—"}
                </td>
                <td className="p-3 text-right">
                  <Link to={`/documentos/${doc.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye size={14} />
                    </Button>
                  </Link>
                  <Link to={`/documentos/${doc.id}`} state={{ download: true }}>
                    <Button variant="ghost" size="sm">
                      <FileDown size={14} />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {documentos.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Sin documentos aún. Crea un nuevo documento PDF desde una cotización.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
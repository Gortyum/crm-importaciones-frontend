import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { CostoImportacionForm } from "@/types/cotizacion.types";
import { COSTOS_POR_TRANSPORTE } from "@/lib/importacion";

interface CostosImportacionTableProps {
  transporte: string;
  costos: CostoImportacionForm[];
  onChange: (costos: CostoImportacionForm[]) => void;
}

const CATEGORIAS_ETIQUETAS: Record<string, string> = {
  Flete_Courier: "Flete Courier",
  Gastos_Despacho_Courier: "Gastos Despacho Courier",
  Flete_Aereo_Int: "Flete Aéreo Internacional",
  Seguro_Internacional: "Seguro Internacional",
  Gastos_Terminal_Aereo: "Gastos Terminal Aérea",
  Honorarios_Agente_Aduana: "Honorarios Agente de Aduana",
  Flete_Terrestre_Local: "Flete Terrestre Local (Chile)",
  Flete_Terrestre_Int: "Flete Terrestre Internacional",
  Seguro_Transito_Terr: "Seguro Tránsito Terrestre",
  Gastos_Frontera_PuertoSeco: "Gastos Frontera / Puerto Seco",
  Otros: "Otros gastos",
};

export function CostosImportacionTable({
  transporte,
  costos,
  onChange,
}: CostosImportacionTableProps) {
  const camposTransporte = COSTOS_POR_TRANSPORTE[transporte] || [];

  const updateCosto = (idx: number, patch: Partial<CostoImportacionForm>) => {
    onChange(costos.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const agregarCosto = () => {
    const primer = camposTransporte[0];
    onChange([
      ...costos,
      {
        categoria: primer?.categoria ?? "Flete_Aereo_Int",
        tipo: primer?.tipo ?? "flete",
        monto: 0,
        divisa: "USD",
        proveedor_id: null,
      },
    ]);
  };

  const removerCosto = (idx: number) => {
    onChange(costos.filter((_, i) => i !== idx));
  };

  const etiqueta = (cat: string) => CATEGORIAS_ETIQUETAS[cat] ?? cat.replace(/_/g, " ");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
          <span>🚚</span> Costos de importación
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={agregarCosto}>
          <Plus size={13} className="mr-1" /> Agregar costo
        </Button>
      </div>

      {costos.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-lg">
          Sin costos adicionales. Haz clic en "Agregar costo" para incluirlos.
        </p>
      ) : (
        <div className="space-y-2">
          {costos.map((c, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center p-3 rounded-lg bg-slate-50 border border-slate-100"
            >
              {/* Descripción / Categoría */}
              <div className="min-w-0">
                <Select
                  value={c.categoria}
                  onChange={(e) => {
                    const campo = camposTransporte.find((f) => f.categoria === e.target.value);
                    updateCosto(idx, {
                      categoria: e.target.value,
                      tipo: campo?.tipo ?? c.tipo,
                    });
                  }}
                  className="text-sm"
                >
                  {camposTransporte.map((f) => (
                    <option key={f.categoria} value={f.categoria}>
                      {f.etiqueta}
                    </option>
                  ))}
                  {/* Permitir categorías manuales que no están en el transporte actual */}
                  {!camposTransporte.find((f) => f.categoria === c.categoria) && (
                    <option value={c.categoria}>{etiqueta(c.categoria)}</option>
                  )}
                </Select>
              </div>

              {/* Monto */}
              <Input
                type="number"
                min={0}
                value={c.monto}
                placeholder="0"
                onChange={(e) => updateCosto(idx, { monto: Number(e.target.value) })}
                className="w-28 text-right font-mono"
              />

              {/* Divisa */}
              <Select
                value={c.divisa}
                onChange={(e) => updateCosto(idx, { divisa: e.target.value })}
                className="w-20"
              >
                <option value="USD">USD</option>
                <option value="BRL">BRL</option>
                <option value="CLP">CLP</option>
              </Select>

              {/* Eliminar */}
              <button
                type="button"
                onClick={() => removerCosto(idx)}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

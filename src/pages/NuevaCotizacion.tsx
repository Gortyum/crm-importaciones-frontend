import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/AuthContext";
import { Button } from "@/components/ui/Button";
import { CotizacionStepper, type StepId } from "@/components/cotizaciones/CotizacionStepper";
import { Step1Productos } from "@/components/cotizaciones/Step1Productos";
import { Step2Importacion } from "@/components/cotizaciones/Step2Importacion";
import { Step3Precio } from "@/components/cotizaciones/Step3Precio";
import { Step4Resumen } from "@/components/cotizaciones/Step4Resumen";
import {
  EMPTY_FORM,
  type CotizacionFormData,
  type CostoImportacionForm,
  type Cliente,
  type Contacto,
  type Producto,
  type Proveedor,
  type DivisasResponse,
  type ConfigGlobal,
  type ItemForm,
} from "@/types/cotizacion.types";

export default function NuevaCotizacion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingId = id ? Number(id) : null;
  const { referencias } = useAuth();

  // Catálogos
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [divisas, setDivisas] = useState<DivisasResponse | null>(null);
  const [config, setConfig] = useState<ConfigGlobal>({
    iva_chile: 19,
    arancel_general: 6,
    arancel_mercosur: 0,
  });

  // Estado del Stepper
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());

  // Estado del formulario
  const [form, setForm] = useState<CotizacionFormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshingDivisas, setRefreshingDivisas] = useState(false);
  const [cargandoEdicion, setCargandoEdicion] = useState(!!editingId);
  const [bloqueada, setBloqueada] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    Promise.all([
      api.clientes.list(),
      api.productos.list(),
      api.proveedores.list(),
      api.divisas.cambio(),
      api.config.get(),
    ])
      .then(([cls, prods, provs, div, cfg]) => {
        setClientes(cls);
        setProductos(prods);
        setProveedores(provs);
        setDivisas(div);
        if (cfg) setConfig(cfg);

        // Pre-cargar tipos de cambio desde backend
        if (!referencias && !editingId) {
          const usdRate = div.tc_cotizacion?.USD ?? div.monedas?.USD ?? 950;
          const brlRate = div.monedas?.BRL && div.monedas?.USD
            ? Math.round((div.monedas.BRL / div.monedas.USD) * 10000) / 10000
            : 0.18;

          setForm((prev) => ({
            ...prev,
            tc_usd_clp: usdRate,
            tc_brl_usd: brlRate,
            contingencia_pct: div.seguridad_pct ?? 2,
          }));
        }
      })
      .catch((err) => {
        console.error("Error cargando catálogos:", err);
      });
  }, []);

  // Sembrar el formulario con las referencias cacheadas en el login
  // (monedas, TC, config) antes de que resuelvan las llamadas a la API.
  useEffect(() => {
    if (editingId) return;
    if (!referencias) return;
    setConfig(referencias.config);
    const usdRate = referencias.tc_cotizacion?.USD ?? referencias.monedas?.USD ?? 950;
    const brlRate = referencias.monedas?.BRL && referencias.monedas?.USD
      ? Math.round((referencias.monedas.BRL / referencias.monedas.USD) * 10000) / 10000
      : 0.18;
    setForm((prev) => ({
      ...prev,
      tc_usd_clp: usdRate,
      tc_brl_usd: brlRate,
      contingencia_pct: referencias.seguridad_pct ?? 2,
    }));
  }, [referencias]);

  // Modo edición: hidratar el formulario con la cotización existente
  useEffect(() => {
    if (!editingId) return;
    (async () => {
      try {
        const cot = await api.cotizaciones.get(editingId);
        if (cot.pdf_emitido) {
          setBloqueada(true);
          return;
        }
        let costoImportacion: CostoImportacionForm[] = [];
        let tcBrl = 0.18;
        let contPct = 2;
        let cert = true;
        let impData: any = null;
        if (cot.importacion_id) {
          try {
            impData = await api.importaciones.get(cot.importacion_id);
            costoImportacion = (impData.costos || []).map((c: any) => ({
              categoria: c.categoria,
              tipo: c.tipo_costo || c.tipo,
              monto: c.monto,
              divisa: c.divisa,
              proveedor_id: null,
            }));
            tcBrl = impData.tc_brl_usd || 0.18;
            contPct = impData.contingencia_pct ?? 2;
            cert = impData.cert_origen;
          } catch {
            /* sin importación asociada editable */
          }
        }
        const items: ItemForm[] = (cot.items || []).map((it: any) => ({
          producto_id: it.producto_id ?? null,
          proveedor_id: it.proveedor_id ?? null,
          descripcion: it.descripcion || "",
          cantidad: it.cantidad || 1,
          costo_original: it.costo_original || 0,
          divisa_origen: it.divisa_origen || "USD",
          peso_kg: it.peso_kg || 0,
          volumen_m3: it.volumen_m3 || 0,
          tipo_flete: it.tipo_flete || "Terrestre",
          costo_flete: it.costo_flete || 0,
          costo_envio: it.costo_envio || 0,
          imagen_url: it.imagen_url || "",
          margen_pct: it.margen_pct ?? 30,
          descuento_pct: it.descuento_pct || 0,
          tipo_personalizacion: it.tipo_personalizacion || "Serigrafia",
          iva_pct: it.iva_pct ?? 19,
        }));
        setForm({
          cliente_id: cot.cliente_id,
          contacto_id: cot.contacto_id ?? null,
          notas: cot.notas || "",
          items,
          divisa_global: cot.divisa_original || "USD",
          tc_usd_clp: cot.tipo_cambio || 950,
          tc_brl_usd: tcBrl,
          incluir_importacion: !!cot.importacion_id,
          transporte: impData?.transporte || "Aereo",
          cert_origen: cot.importacion_id ? cert : true,
          contingencia_pct: contPct,
          costos_importacion: costoImportacion,
        });
        if (cot.cliente_id) {
          try {
            const conts = await api.clientes.contactos(cot.cliente_id);
            setContactos(conts);
          } catch {
            setContactos([]);
          }
        }
      } catch (e: any) {
        setError(e.message || "No se pudo cargar la cotización");
      } finally {
        setCargandoEdicion(false);
      }
    })();
  }, [editingId]);

  const handleClienteChange = async (clienteId: number) => {
    setForm((prev) => ({ ...prev, cliente_id: clienteId, contacto_id: null }));
    try {
      const conts = await api.clientes.contactos(clienteId);
      setContactos(conts);
      if (conts.length === 1) {
        setForm((prev) => ({ ...prev, contacto_id: conts[0].id }));
      }
    } catch {
      setContactos([]);
    }
  };

  const handleRefreshDivisas = async () => {
    setRefreshingDivisas(true);
    try {
      const div = await api.divisas.cambio();
      setDivisas(div);
      const usdRate = div.tc_cotizacion?.USD ?? div.monedas?.USD ?? 950;
      setForm((prev) => ({ ...prev, tc_usd_clp: usdRate }));
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingDivisas(false);
    }
  };

  // Navegación del stepper
  const goToStep = (step: StepId) => {
    setCurrentStep(step);
  };

  const completeStepAndGo = (current: StepId, next: StepId) => {
    setCompletedSteps((prev) => new Set([...prev, current]));
    setCurrentStep(next);
  };

  // Guardar cotización en backend
  const handleSave = async () => {
    if (!form.cliente_id) return alert("Selecciona un cliente");
    if (!form.items.length || !form.items[0].descripcion) return alert("Agrega al menos un producto válido");

    setSaving(true);
    try {
      // Calcular factor de cambio para cada item
      const itemsPayload = form.items.map((it) => {
        let factorItem = 1;
        if (it.divisa_origen === "USD") {
          factorItem = form.tc_usd_clp;
        } else if (it.divisa_origen === "BRL") {
          factorItem = (form.tc_brl_usd || 0.18) * form.tc_usd_clp;
        }

        return {
          ...it,
          producto_id: it.producto_id,
          proveedor_id: it.proveedor_id,
          tipo_cambio: factorItem,
        };
      });

      const basePayload = {
        cliente_id: form.cliente_id,
        contacto_id: form.contacto_id,
        divisa_original: form.divisa_global || "USD",
        tipo_cambio: form.tc_usd_clp,
        notas: form.notas,
        items: itemsPayload,
      };

      if (editingId) {
        const cot = await api.cotizaciones.update(editingId, basePayload);
        navigate(`/cotizaciones/${cot.id}`);
        return;
      }

      const payload = {
        ...basePayload,
        importacion: form.incluir_importacion
          ? {
              transporte: form.transporte,
              cert_origen: form.cert_origen,
              tc_usd_clp: form.tc_usd_clp || null,
              tc_brl_usd: form.tc_brl_usd || 0.18,
              contingencia_pct: form.contingencia_pct,
              costos: form.costos_importacion
                .filter((c) => c.monto > 0)
                .map((c) => ({
                  proveedor_id: c.proveedor_id,
                  categoria: c.categoria,
                  tipo_costo: c.tipo,
                  monto: c.monto,
                  divisa: c.divisa,
                  notas: "",
                })),
            }
          : null,
      };

      const cot = await api.cotizaciones.create(payload);
      navigate(`/cotizaciones/${cot.id}`);
    } catch (e: any) {
      alert(e.message || "Error al crear la cotización");
    } finally {
      setSaving(false);
    }
  };

  const clienteSeleccionado = clientes.find((c) => c.id === form.cliente_id);
  const contactoSeleccionado = contactos.find((c) => c.id === form.contacto_id);

  if (cargandoEdicion) {
    return <div className="p-8 text-center text-slate-400">Cargando cotización...</div>;
  }

  if (bloqueada) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
          <Lock size={24} className="text-slate-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Cotización ya emitida</h1>
        <p className="text-sm text-slate-500">
          Esta cotización ya generó su PDF y no puede editarse. Si necesitas cambios, crea una nueva cotización.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/cotizaciones/${editingId}`)}>
            Ver cotización
          </Button>
          <Button onClick={() => navigate("/cotizaciones/nueva")}>Nueva cotización</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(editingId ? `/cotizaciones/${editingId}` : "/cotizaciones")}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{editingId ? "Editar Cotización" : "Nueva Cotización"}</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {editingId
              ? "Modifica la cotización. Los cambios quedan bloqueados una vez generado el PDF."
              : "Proceso guiado: Productos → Importación → Precio → Resumen"}
          </p>
        </div>
      </div>

      {/* Stepper visual */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <CotizacionStepper
          currentStep={currentStep}
          onStepClick={goToStep}
          completedSteps={completedSteps}
        />

        {/* Pasos */}
        {currentStep === 1 && (
          <Step1Productos
            clientes={clientes}
            contactos={contactos}
            productos={productos}
            proveedores={proveedores}
            clienteId={form.cliente_id}
            contactoId={form.contacto_id}
            notas={form.notas}
            items={form.items}
            onClienteChange={handleClienteChange}
            onContactoChange={(id) => setForm((p) => ({ ...p, contacto_id: id }))}
            onNotasChange={(notas) => setForm((p) => ({ ...p, notas }))}
            onItemsChange={(items) => setForm((p) => ({ ...p, items }))}
            onNext={() => completeStepAndGo(1, 2)}
          />
        )}

        {currentStep === 2 && (
          <Step2Importacion
            divisas={divisas}
            tcUsdClp={form.tc_usd_clp}
            tcBrlUsd={form.tc_brl_usd}
            onTcUsdChange={(v) => setForm((p) => ({ ...p, tc_usd_clp: v }))}
            onTcBrlChange={(v) => setForm((p) => ({ ...p, tc_brl_usd: v }))}
            onRefreshDivisas={handleRefreshDivisas}
            refreshingDivisas={refreshingDivisas}
            incluirImportacion={form.incluir_importacion}
            onToggleImportacion={(v) => setForm((p) => ({ ...p, incluir_importacion: v }))}
            transporte={form.transporte}
            onTransporteChange={(v) => setForm((p) => ({ ...p, transporte: v }))}
            certOrigen={form.cert_origen}
            onCertOrigenChange={(v) => setForm((p) => ({ ...p, cert_origen: v }))}
            contingenciaPct={form.contingencia_pct}
            onContingenciaChange={(v) => setForm((p) => ({ ...p, contingencia_pct: v }))}
            costos={form.costos_importacion}
            onCostosChange={(costos) => setForm((p) => ({ ...p, costos_importacion: costos }))}
            items={form.items}
            config={config}
            onBack={() => goToStep(1)}
            onNext={() => completeStepAndGo(2, 3)}
          />
        )}

        {currentStep === 3 && (
          <Step3Precio
            items={form.items}
            onItemsChange={(items) => setForm((p) => ({ ...p, items }))}
            incluirImportacion={form.incluir_importacion}
            transporte={form.transporte}
            certOrigen={form.cert_origen}
            contingenciaPct={form.contingencia_pct}
            costos={form.costos_importacion}
            tcUsdClp={form.tc_usd_clp}
            tcBrlUsd={form.tc_brl_usd}
            config={config}
            onBack={() => goToStep(2)}
            onNext={() => completeStepAndGo(3, 4)}
          />
        )}

        {currentStep === 4 && (
          <Step4Resumen
            cliente={clienteSeleccionado}
            contacto={contactoSeleccionado}
            proveedores={proveedores}
            items={form.items}
            notas={form.notas}
            divisaGlobal={form.divisa_global}
            tcUsdClp={form.tc_usd_clp}
            tcBrlUsd={form.tc_brl_usd}
            incluirImportacion={form.incluir_importacion}
            transporte={form.transporte}
            certOrigen={form.cert_origen}
            contingenciaPct={form.contingencia_pct}
            costos={form.costos_importacion}
            config={config}
            saving={saving}
            onBack={() => goToStep(3)}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}

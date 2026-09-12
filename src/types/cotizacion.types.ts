// ─────────────────────────────────────────────
// Tipos del formulario (estado interno del stepper)
// ─────────────────────────────────────────────

export interface ItemForm {
  producto_id: number | null;
  proveedor_id: number | null;
  descripcion: string;
  cantidad: number;
  costo_original: number;
  divisa_origen: string;
  peso_kg: number;
  volumen_m3: number;
  tipo_flete: string;
  costo_flete: number;
  costo_envio: number;
  imagen_url: string;
  margen_pct: number;
  descuento_pct: number;
  tipo_personalizacion: string;
  iva_pct: number;
}

export interface CostoImportacionForm {
  categoria: string;
  tipo: string;
  monto: number;
  divisa: string;
  proveedor_id: number | null;
}

export interface CotizacionFormData {
  // Paso 1 — Productos
  cliente_id: number | null;
  contacto_id: number | null;
  notas: string;
  items: ItemForm[];

  // Paso 2 — Tipo de cambio e importación
  divisa_global: string;
  tc_usd_clp: number;         // TC confirmado por el usuario (puede ser el observado o el ajustado)
  tc_brl_usd: number;

  // Importación (opcional)
  incluir_importacion: boolean;
  transporte: string;
  cert_origen: boolean;
  contingencia_pct: number;
  costos_importacion: CostoImportacionForm[];

  // Paso 3 — Precio
  // (margen y descuento ya están por item en ItemForm)
}

// ─────────────────────────────────────────────
// Datos de API — Divisas
// ─────────────────────────────────────────────

export interface DivisasResponse {
  monedas: Record<string, number>;
  seguridad_pct: number;
  tc_cotizacion: Record<string, number>;
  fecha_tc: string;
}

// ─────────────────────────────────────────────
// Datos de API — Cotización (respuesta backend)
// ─────────────────────────────────────────────

export interface ItemCotizacionOut {
  id: number;
  cotizacion_id: number;
  producto_id: number | null;
  proveedor_id: number | null;
  descripcion: string;
  cantidad: number;
  costo_original: number;
  divisa_origen: string;
  tipo_cambio: number;
  margen_pct: number;
  descuento_pct: number;
  iva_pct: number;
  precio_venta_unitario: number;
  subtotal: number;
  iva_monto: number;
  total: number;
  tipo_personalizacion: string;
  imagen_url: string;
}

export interface CotizacionOut {
  id: number;
  correlativo: string;
  estado: string;
  fecha: string;
  created_at: string;
  cliente_id: number;
  contacto_id: number | null;
  divisa_original: string;
  tipo_cambio: number;
  notas: string;
  importacion_id: number | null;
  importacion_correlativo: string;
  items: ItemCotizacionOut[];
  total_general: number;
}

// ─────────────────────────────────────────────
// Datos de API — Importación (respuesta backend)
// ─────────────────────────────────────────────

export interface ImportacionItemOut {
  id: number;
  descripcion: string;
  cantidad: number;
  precio_unitario_fabrica: number;
  divisa: string;
  margen_pct: number;
  costo_fob_usd: number;
  costo_cif_usd: number;
  costo_unitario_neto_clp: number;
  precio_venta_neto_clp: number;
  iva_venta_clp: number;
  precio_venta_total_clp: number;
}

export interface ImportacionCostoOut {
  id: number;
  categoria: string;
  tipo_costo: string;
  monto: number;
  divisa: string;
  notas: string;
  proveedor: string;
}

export interface ImportacionResultado {
  config: {
    tc_usd_clp: number;
    tc_brl_usd: number;
    contingencia_pct: number;
    cert_origen: boolean;
    arancel_pct: number;
    iva_pct: number;
  };
  fob_total_usd: number;
  flete_usd: number;
  seguro_usd: number;
  cif_total_usd: number;
  arancel_usd: number;
  extranjero_no_cif_usd: number;
  contingencia_usd: number;
  sub_total_extranjero_usd: number;
  gastos_locales_clp: number;
  costo_almacen_clp: number;
  iva_importacion_clp: number;
  costo_unitario_promedio_clp: number;
  cantidad_total: number;
  items: Array<{
    descripcion: string;
    cantidad: number;
    fob_usd: number;
    cif_usd: number;
    costo_unitario_neto_clp: number;
    precio_venta_neto_clp: number;
    iva_venta_clp: number;
    precio_venta_total_clp: number;
  }>;
  totales_venta: {
    neto: number;
    iva: number;
    total: number;
  };
}

export interface ImportacionOut {
  id: number;
  correlativo: string;
  estado: string;
  transporte: string;
  cert_origen: boolean;
  tc_usd_clp: number;
  tc_brl_usd: number;
  contingencia_pct: number;
  notas: string;
  cotizacion_id: number | null;
  cotizacion_correlativo: string;
  fecha: string;
  historial_estados: Array<{ estado: string; fecha: string }> | null;
  items: ImportacionItemOut[];
  costos: ImportacionCostoOut[];
  resultado: ImportacionResultado | null;
}

// ─────────────────────────────────────────────
// Datos de API — Archivos (Cloudflare R2)
// ─────────────────────────────────────────────

export type EntidadArchivo = "producto" | "cotizacion" | "orden_compra" | "proveedor" | "documento";

export interface ArchivoOut {
  id: number;
  nombre_original: string;
  object_key: string;
  carpeta: string;
  entidad_tipo: EntidadArchivo;
  entidad_id: number | null;
  mime_type: string;
  tamano: number;
  es_publico: boolean;
  created_by: string | null;
  created_at: string;
  url: string | null;
}

export interface ArchivoUploadResult {
  id: number;
  nombre_original: string;
  object_key: string;
  carpeta: string;
  entidad_tipo: EntidadArchivo;
  entidad_id: number | null;
  mime_type: string;
  tamano: number;
  es_publico: boolean;
  url: string | null;
  duplicado?: boolean;
}

// ─────────────────────────────────────────────
// Catálogos (listas de referencia)
// ─────────────────────────────────────────────

export interface Cliente {
  id: number;
  razon_social: string;
  rut: string;
  direccion: string;
  giro: string;
}

export interface Contacto {
  id: number;
  nombre: string;
  cargo: string;
  email: string;
  telefono: string;
  es_principal: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface Proveedor {
  id: number;
  razon_social: string;
  tax_id: string;
  pais_origen: string;
}

export interface ConfigGlobal {
  iva_chile: number;
  arancel_general: number;
  arancel_mercosur: number;
}

// ─────────────────────────────────────────────
// Caché de referencias (cargado al iniciar sesión)
// ─────────────────────────────────────────────

export interface ReferenciasData {
  usuario: { id: number; username: string; rol: string };
  permisos: string[];
  monedas: Record<string, number>;
  tc_cotizacion: Record<string, number>;
  seguridad_pct: number;
  config: ConfigGlobal;
  estados: {
    cotizacion: { estados: string[]; transiciones: Record<string, string[]> };
    importacion: { estados: string[]; transiciones: Record<string, string[]> };
    orden_compra: { estados: string[] };
  };
  categorias_productos: Array<{ id: number; nombre: string }>;
  fecha_tc: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  username: string;
  referencias: ReferenciasData | null;
}

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

export const EMPTY_ITEM: ItemForm = {
  producto_id: null,
  proveedor_id: null,
  descripcion: "",
  cantidad: 1,
  costo_original: 0,
  divisa_origen: "USD",
  peso_kg: 0,
  volumen_m3: 0,
  tipo_flete: "Aereo",
  costo_flete: 0,
  costo_envio: 0,
  imagen_url: "",
  margen_pct: 30,
  descuento_pct: 0,
  tipo_personalizacion: "Serigrafia",
  iva_pct: 19,
};

export const EMPTY_FORM: CotizacionFormData = {
  cliente_id: null,
  contacto_id: null,
  notas: "",
  items: [{ ...EMPTY_ITEM }],
  divisa_global: "USD",
  tc_usd_clp: 950,
  tc_brl_usd: 0.18,
  incluir_importacion: false,
  transporte: "Aereo",
  cert_origen: true,
  contingencia_pct: 2,
  costos_importacion: [],
};

export const ESTADOS_COLORES: Record<string, string> = {
  Creada: "bg-slate-100 text-slate-700",
  Enviada: "bg-blue-100 text-blue-700",
  Cerrada: "bg-green-100 text-green-700",
  "En Produccion": "bg-amber-100 text-amber-700",
  Entregada: "bg-emerald-100 text-emerald-700",
  Cancelada: "bg-red-100 text-red-700",
};

export const TRANSICIONES: Record<string, string[]> = {
  Creada: ["Enviada", "Cancelada"],
  Enviada: ["Cerrada", "Cancelada"],
  Cerrada: ["En Produccion", "Cancelada"],
  "En Produccion": ["Entregada", "Cancelada"],
  Entregada: [],
  Cancelada: [],
};

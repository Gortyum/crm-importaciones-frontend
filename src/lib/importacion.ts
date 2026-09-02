export const TRANSPORTES = ["Courier", "Aereo", "Terrestre"] as const;
export const DIVISAS = ["USD", "BRL", "CLP"] as const;

export interface CampoCosto {
  categoria: string;
  etiqueta: string;
  tipo: "flete" | "seguro" | "despacho" | "honorarios" | "flete_local";
}

export const COSTOS_POR_TRANSPORTE: Record<string, CampoCosto[]> = {
  Courier: [
    { categoria: "Flete_Courier", etiqueta: "Flete Courier (Brasil → Chile)", tipo: "flete" },
    { categoria: "Gastos_Despacho_Courier", etiqueta: "Gastos Despacho Courier", tipo: "despacho" },
    { categoria: "Flete_Terrestre_Local", etiqueta: "Flete Terrestre Local (Chile)", tipo: "flete_local" },
  ],
  Aereo: [
    { categoria: "Flete_Aereo_Int", etiqueta: "Flete Aéreo Internacional", tipo: "flete" },
    { categoria: "Seguro_Internacional", etiqueta: "Seguro Internacional", tipo: "seguro" },
    { categoria: "Gastos_Terminal_Aereo", etiqueta: "Gastos Terminal Aérea", tipo: "despacho" },
    { categoria: "Honorarios_Agente_Aduana", etiqueta: "Honorarios Agente de Aduana", tipo: "honorarios" },
    { categoria: "Flete_Terrestre_Local", etiqueta: "Flete Terrestre Local (Chile)", tipo: "flete_local" },
  ],
  Terrestre: [
    { categoria: "Flete_Terrestre_Int", etiqueta: "Flete Terrestre Internacional", tipo: "flete" },
    { categoria: "Seguro_Transito_Terr", etiqueta: "Seguro de Tránsito Terrestre", tipo: "seguro" },
    { categoria: "Gastos_Frontera_PuertoSeco", etiqueta: "Gastos Frontera / Puerto Seco", tipo: "despacho" },
    { categoria: "Honorarios_Agente_Aduana", etiqueta: "Honorarios Agente de Aduana", tipo: "honorarios" },
    { categoria: "Flete_Terrestre_Local", etiqueta: "Flete Terrestre Local (Chile)", tipo: "flete_local" },
  ],
};

export interface CostoForm {
  categoria: string;
  tipo: string;
  monto: number;
  divisa: string;
  proveedor_id: number | null;
}

export interface ItemImportacion {
  producto_id: number | null;
  descripcion: string;
  cantidad: number;
  precio_unitario_fabrica: number;
  divisa: string;
  margen_pct: number;
}

export function toUSD(monto: number, divisa: string, tcUsdClp: number, tcBrlUsd: number): number {
  const d = (divisa || "USD").toUpperCase();
  if (d === "CLP") return tcUsdClp ? monto / tcUsdClp : 0;
  if (d === "BRL") return monto * tcBrlUsd;
  return monto;
}

export function calcImportacion(
  items: ItemImportacion[],
  costos: CostoForm[],
  params: {
    tc_usd_clp: number;
    tc_brl_usd: number;
    contingencia_pct: number;
    cert_origen: boolean;
    arancel_general: number;
    arancel_mercosur: number;
    iva_pct: number;
  }
) {
  const { tc_usd_clp, tc_brl_usd, contingencia_pct, cert_origen, arancel_general, arancel_mercosur, iva_pct } = params;
  const arancel_pct = cert_origen ? arancel_mercosur : arancel_general;

  let fob_total = 0;
  const itemsInfo = items.map((it) => {
    const precio_usd = toUSD(it.precio_unitario_fabrica, it.divisa, tc_usd_clp, tc_brl_usd);
    const fob_item = precio_usd * it.cantidad;
    fob_total += fob_item;
    return { ...it, precio_usd, fob_usd: fob_item };
  });

  let flete_usd = 0;
  let seguro_usd = 0;
  let extranjero_no_cif_usd = 0;
  let gastos_locales_clp = 0;
  for (const c of costos) {
    const monto_usd = toUSD(c.monto, c.divisa, tc_usd_clp, tc_brl_usd);
    if (c.divisa && c.divisa.toUpperCase() === "CLP") gastos_locales_clp += c.monto;
    else if (c.tipo === "flete") flete_usd += monto_usd;
    else if (c.tipo === "seguro") seguro_usd += monto_usd;
    else extranjero_no_cif_usd += monto_usd;
  }

  const cif_total_usd = fob_total + flete_usd + seguro_usd;
  const arancel_usd = cif_total_usd * (arancel_pct / 100);
  const base_contingencia_usd = cif_total_usd + extranjero_no_cif_usd;
  const contingencia_usd = base_contingencia_usd * (contingencia_pct / 100);
  const sub_ext_seguro_usd = base_contingencia_usd + contingencia_usd;

  const costo_almacen_clp = sub_ext_seguro_usd * tc_usd_clp + arancel_usd * tc_usd_clp + gastos_locales_clp;
  const iva_importacion_clp = (cif_total_usd + arancel_usd) * (iva_pct / 100) * tc_usd_clp;

  const cantidad_total = items.reduce((s, i) => s + i.cantidad, 0);
  const unitario_promedio = cantidad_total ? costo_almacen_clp / cantidad_total : 0;

  const itemsOut = itemsInfo.map((it) => {
    const cantidad = it.cantidad || 0;
    const share = fob_total ? it.fob_usd / fob_total : cantidad_total ? cantidad / cantidad_total : 0;
    const cif_item = it.fob_usd + (flete_usd + seguro_usd) * share;
    const landed = costo_almacen_clp * share;
    const unitario = cantidad ? landed / cantidad : 0;
    const margen = it.margen_pct;
    const neto = margen < 100 ? unitario / (1 - margen / 100) : 0;
    const iva = neto * (iva_pct / 100);
    return {
      producto_id: it.producto_id,
      descripcion: it.descripcion,
      cantidad,
      precio_unitario_fabrica: it.precio_unitario_fabrica,
      divisa: it.divisa,
      margen_pct: margen,
      fob_usd: Math.round(it.fob_usd * 100) / 100,
      cif_usd: Math.round(cif_item * 100) / 100,
      costo_unitario_neto_clp: Math.round(unitario * 100) / 100,
      precio_venta_neto_clp: Math.round(neto),
      iva_venta_clp: Math.round(iva),
      precio_venta_total_clp: Math.round(neto + iva),
    };
  });

  return {
    config: { tc_usd_clp, tc_brl_usd, contingencia_pct, cert_origen, arancel_pct, iva_pct },
    fob_total_usd: Math.round(fob_total * 100) / 100,
    flete_usd: Math.round(flete_usd * 100) / 100,
    seguro_usd: Math.round(seguro_usd * 100) / 100,
    cif_total_usd: Math.round(cif_total_usd * 100) / 100,
    arancel_usd: Math.round(arancel_usd * 100) / 100,
    extranjero_no_cif_usd: Math.round(extranjero_no_cif_usd * 100) / 100,
    contingencia_usd: Math.round(contingencia_usd * 100) / 100,
    sub_total_extranjero_usd: Math.round(sub_ext_seguro_usd * 100) / 100,
    gastos_locales_clp: Math.round(gastos_locales_clp * 100) / 100,
    costo_almacen_clp: Math.round(costo_almacen_clp),
    iva_importacion_clp: Math.round(iva_importacion_clp),
    costo_unitario_promedio_clp: Math.round(unitario_promedio),
    cantidad_total,
    items: itemsOut,
    totales_venta: {
      neto: Math.round(itemsOut.reduce((s, i) => s + i.precio_venta_neto_clp, 0)),
      iva: Math.round(itemsOut.reduce((s, i) => s + i.iva_venta_clp, 0)),
      total: Math.round(itemsOut.reduce((s, i) => s + i.precio_venta_total_clp, 0)),
    },
  };
}
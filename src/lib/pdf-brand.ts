// Identidad de marca aplicada a los PDFs generados (cotización y orden de compra).
// El logo es el mismo LeafMark de la app, la paleta es pino/crema y la tipografía
// Manrope + IBM Plex Mono (cargadas desde Google Fonts en index.html).

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none"><rect width="40" height="40" rx="3" fill="#3d6a4c"/><path d="M20 30.5C10.5 27.5 7.5 20 11.5 11.5C19.5 12 24.5 14.5 26.5 19.5C27.5 21.5 27.9 24 26.8 26.8C24.5 29.8 22.5 31.2 20 30.5Z" fill="#faf8f1"/><path d="M12 13C17.5 10 25 11 29 17.5C23 15.5 16 15.5 12 13Z" fill="#5d8a69"/></svg>`;

export const LOGO_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}`;

export const BRAND = {
  pine: "#3d6a4c",
  pineHi: "#5d8a69",
  pineInk: "#2c4f39",
  carbon: "#151710",
  carbon2: "#1c1e16",
  mist: "#7f8277",
  mist2: "#a8ab9f",
  paper: "#f0ede2",
  paper2: "#e6e2d3",
  bone: "#faf8f1",
  line: "#e2decc",
};

export const FONT_SANS = "Manrope, 'Segoe UI', system-ui, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', ui-monospace, 'Cascadia Mono', monospace";

interface BrandHeader {
  titulo: string;
  correlativo: string;
  fecha: string;
  fechaEtiqueta?: string;
}

export function pdfBrandHeader({
  titulo,
  correlativo,
  fecha,
  fechaEtiqueta = "Fecha de emisión",
}: BrandHeader): string {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;border-bottom:3px solid ${BRAND.pine};padding-bottom:18px">
      <div style="display:flex;align-items:center;gap:14px">
        <img src="${LOGO_DATA_URI}" style="width:46px;height:46px;flex-shrink:0;border-radius:2px" alt="" crossorigin="anonymous" />
        <div>
          <p style="margin:0;font-size:15px;font-weight:800;color:${BRAND.carbon};letter-spacing:0.14em;text-transform:uppercase">Eleni Sourcing</p>
          <p style="margin:2px 0 0;font-family:${FONT_MONO};font-size:10px;letter-spacing:0.34em;text-transform:uppercase;color:${BRAND.mist}">Importaciones</p>
        </div>
      </div>
      <div style="text-align:right">
        <h1 style="margin:0;font-size:26px;color:${BRAND.pineInk};font-weight:800;letter-spacing:0.02em">${titulo}</h1>
        <p style="margin:3px 0 0;font-size:13px;color:${BRAND.mist};font-family:${FONT_MONO}">${correlativo}</p>
        <p style="margin:2px 0 0;font-size:11px;color:${BRAND.mist2}">${fechaEtiqueta} · <strong style="color:${BRAND.carbon2}">${fecha}</strong></p>
      </div>
    </div>`;
}
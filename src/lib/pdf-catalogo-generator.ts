import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { LOGO_DATA_URI } from "./pdf-brand";
import type { DocumentoEspecificaciones, DocumentoPDFData } from "@/types/cotizacion.types";

const BEIGE = "#f5f2ea";
const BAND = "#10170d";
const GRAY = "#8b8b82";
const INK = "#10170d";
const MUTED = "#8b8b82";
const GREEN = "#668b69";
const FONT_SANS = "Poppins, Manrope, 'Helvetica Neue', Arial, sans-serif";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

export interface CatalogoPDFInput extends DocumentoPDFData {
  fotos: string[];
}

const SPEC_VACIAS: DocumentoEspecificaciones = {
  material: "",
  personalizacion: "",
  color: "",
  medida_logo: "",
};

function formatFecha(fecha: string | null): string {
  if (!fecha) return "";
  const d = new Date(fecha);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function labelCelda(texto: string, chico = false): string {
  return `<td style="background:${GRAY};color:${BEIGE};font-size:${chico ? 10.5 : 13}px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;padding:13px 16px;white-space:nowrap">
    ${texto}
  </td>`;
}

function valorCelda(texto: string): string {
  return `<td style="padding:13px 16px;font-size:13.5px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;line-height:1.25;color:${INK};text-align:left">
    ${texto}
  </td>`;
}

function tablaDatos(rows: Array<[string, string, boolean?]>, chico: boolean): string {
  return `<table style="width:100%;border-collapse:collapse;margin:0">
    ${rows
      .map(
        ([label, value, isChico = false]) => `<tr>${labelCelda(label, chico || isChico)}${valorCelda(value)}</tr>`
      )
      .join("")}
  </table>`;
}

function asegurarPoppins(): Promise<void> {
  return new Promise((resolve) => {
    let link = document.head.querySelector<HTMLLinkElement>("link[data-poppins]");
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.dataset.poppins = "1";
      link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
    const cargado = () => {
      if (document.fonts && "load" in document.fonts) {
        Promise.all([300, 400, 500, 600, 700].map((w) => document.fonts.load(`${w} 13px Poppins`)))
          .then(() => resolve())
          .catch(() => resolve());
      } else {
        resolve();
      }
    };
    if (link.sheet) {
      cargado();
    } else {
      link.addEventListener("load", cargado, { once: true });
      link.addEventListener("error", () => resolve(), { once: true });
    }
  });
}

function renderHTML(data: CatalogoPDFInput): string {
  const fechaFmt = formatFecha(data.fecha);
  const producto = data.productos[0]?.descripcion || "—";
  const cantidad = data.cantidad_total || data.productos[0]?.cantidad || 0;
  const espec: DocumentoEspecificaciones = data.especificaciones || SPEC_VACIAS;

  const fotos = data.fotos;
  const fotoHTML =
    fotos.length > 0
      ? fotos
          .map(
            (url) => `
      <img src="${url}"
           style="max-height:${fotos.length === 1 ? 520 : 300}px;max-width:calc(100% - 12px);object-fit:contain;border-radius:2px;margin:6px"
           crossorigin="anonymous" />`
          )
          .join("")
      : `<p style="color:${MUTED};font-size:12px">Sin fotografías adjuntadas.</p>`;

  return `
<div style="width:794px;height:1123px;background:${BEIGE};overflow:hidden;font-family:${FONT_SANS};color:${INK};display:flex;flex-direction:column;position:relative">

  <header style="height:115px;background:${BAND};display:flex;align-items:center;justify-content:space-between;padding:0 72px;flex-shrink:0">
    <div style="display:flex;align-items:center;gap:18px">
      <div style="width:19px;height:19px;background:${BEIGE};border-radius:3px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <img src="${LOGO_DATA_URI}" style="width:14px;height:14px;border-radius:1px" crossorigin="anonymous" />
      </div>
      <div style="text-align:left">
        <div style="color:${BEIGE};font-size:13px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;white-space:nowrap">ELENI SOURCING</div>
        <div style="color:${MUTED};font-size:6.7px;font-weight:500;letter-spacing:.3em;text-transform:uppercase;margin-top:4px;white-space:nowrap">Promocionales · Importación</div>
      </div>
    </div>
    <div style="font-family:${FONT_SERIF};font-style:italic;font-weight:500;font-size:42px;color:${GREEN};letter-spacing:.01em">MockUp</div>
  </header>

  <div style="text-align:right;font-size:10.7px;font-weight:500;letter-spacing:.08em;color:${MUTED};padding:14px 72px 0;flex-shrink:0">${fechaFmt}</div>

  <section style="display:flex;gap:2px;padding:22px 79px 0;flex-shrink:0">
    <div style="flex:1;display:flex;flex-direction:column;border-collapse:separate">
      ${tablaDatos([
        ["Cliente", data.cliente_razon_social || "—"],
        ["N° Cotización", data.cotizacion_correlativo || "—"],
      ], false)}
    </div>
    <div style="flex:1;display:flex;flex-direction:column">
      ${tablaDatos([
        ["Producto", producto],
        ["Cantidad", String(cantidad)],
      ], false)}
    </div>
  </section>

  <section style="flex:1;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px;padding:18px 79px;min-height:0">
    ${fotoHTML}
  </section>

  <section style="display:flex;gap:2px;padding:0 79px;flex-shrink:0">
    <div style="flex:1;display:flex;flex-direction:column">
      ${tablaDatos([
        ["Material", espec.material || "—"],
        ["Color", espec.color || "—"],
      ], false)}
    </div>
    <div style="flex:1;display:flex;flex-direction:column">
      ${tablaDatos([
        ["Personalización", espec.personalizacion || "—"],
        ["Medida logo", espec.medida_logo || "—"],
      ], true)}
    </div>
  </section>

  <footer style="display:flex;justify-content:space-between;align-items:center;padding:16px 72px 22px;flex-shrink:0">
    <span style="font-size:10.7px;font-weight:500;letter-spacing:.08em;color:${MUTED}">ELENI SOURCING · PROMOCIONALES · IMPORTACIÓN · CHILE</span>
    <span style="font-size:10.7px;font-weight:500;letter-spacing:.08em;color:${MUTED}">1/1</span>
  </footer>
</div>`;
}

export async function generarPDFCatalogo(data: CatalogoPDFInput) {
  await asegurarPoppins();

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = renderHTML(data);
  document.body.appendChild(container);

  await new Promise<void>((resolve) => setTimeout(resolve, 60));

  const canvas = await html2canvas(container, { scale: 2, logging: false });
  document.body.removeChild(container);

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`[${data.correlativo}].pdf`);
}
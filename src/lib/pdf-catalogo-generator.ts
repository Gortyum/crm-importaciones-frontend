import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { DocumentoEspecificaciones, DocumentoPDFData } from "@/types/cotizacion.types";

const BEIGE = "#F1EBE2";
const INK = "#1A1A1A";
const MUTED = "#8C837A";
const PINK = "#FF2D95";
const HAIRLINE = "rgba(26,26,26,.12)";
const FONT_STACK = "Poppins, Manrope, 'Helvetica Neue', Arial, sans-serif";
const MM = 2.83465;

interface PaletaGorra {
  main: string;
  shade: string;
  line: string;
  trim: string;
}

const NEGRA: PaletaGorra = { main: "#1F1F1F", shade: "#101010", line: "#3A3A3A", trim: PINK };
const GRIS: PaletaGorra = { main: "#707070", shade: "#5A5A5A", line: "#8C8C8C", trim: PINK };

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

function caps(view: "front" | "side" | "back", c: PaletaGorra): string {
  const defs: Record<string, string> = {
    front: `
      <path fill="${c.main}" d="M40 92 C40 30 160 30 160 92 Z"/>
      <path stroke="${c.line}" stroke-width="1.1" fill="none" d="M100 33 V92"/>
      <path stroke="${c.line}" stroke-width="1.1" fill="none" d="M71 40 C67 58 66 76 67 92"/>
      <path stroke="${c.line}" stroke-width="1.1" fill="none" d="M129 40 C133 58 134 76 133 92"/>
      <circle fill="${c.main}" stroke="${c.line}" stroke-width="1" cx="100" cy="31" r="4.5"/>
      <path fill="${c.shade}" d="M26 88 Q100 130 174 88 Q100 96 26 88 Z"/>
      <path stroke="${c.trim}" stroke-width="3.6" fill="none" stroke-linecap="round" d="M28 88 Q100 129 172 88"/>`,
    side: `
      <path fill="${c.main}" d="M46 92 C46 36 140 36 140 92 Z"/>
      <path stroke="${c.line}" stroke-width="1.1" fill="none" d="M93 38 V92"/>
      <path stroke="${c.line}" stroke-width="1.1" fill="none" d="M65 48 C61 62 60 78 61 92"/>
      <circle fill="${c.main}" stroke="${c.line}" stroke-width="1" cx="93" cy="37" r="4.5"/>
      <path fill="${c.shade}" d="M116 79 Q170 68 194 88 Q158 102 114 95 Z"/>
      <path stroke="${c.trim}" stroke-width="3.2" fill="none" stroke-linecap="round" d="M117 79 Q170 69 193 88"/>`,
    back: `
      <path fill="${c.main}" d="M42 92 C42 32 158 32 158 92 Z"/>
      <path stroke="${c.line}" stroke-width="1.1" fill="none" d="M100 34 V92"/>
      <path stroke="${c.line}" stroke-width="1.1" fill="none" d="M70 42 C66 60 65 76 66 92"/>
      <path stroke="${c.line}" stroke-width="1.1" fill="none" d="M130 42 C134 60 135 76 134 92"/>
      <circle fill="${c.main}" stroke="${c.line}" stroke-width="1" cx="100" cy="33" r="4.5"/>
      <path fill="${c.shade}" d="M30 92 Q60 102 100 102 Q140 102 170 92 Q140 97 100 97 Q60 97 30 92 Z"/>
      <path stroke="${c.trim}" stroke-width="2.8" fill="none" stroke-linecap="round" d="M32 92 Q60 101 100 101 Q140 101 168 92"/>
      <path fill="${BEIGE}" d="M64 74 h72 a9 9 0 0 1 0 18 h-72 a9 9 0 0 1 0 -18 z"/>`,
  };
  return defs[view];
}

function capSVG(view: "front" | "side" | "back", c: PaletaGorra, flip = false): string {
  const transform = flip ? "transform:scaleX(-1);" : "";
  return `<svg viewBox="0 0 200 150" style="display:block;width:100%;height:auto;${transform}">${caps(view, c)}</svg>`;
}

function capLogo(): string {
  return `
    <div style="position:absolute;left:50%;top:43%;transform:translate(-50%,-50%);text-align:center;white-space:nowrap;color:#FFFFFF;pointer-events:none;font-size:${(5.6 * MM).toFixed(1)}px">
      <div style="display:flex;align-items:stretch;gap:0.10em;justify-content:center">
        <span style="font-size:1em;font-weight:300;letter-spacing:-0.01em;line-height:1">La<b style="font-weight:700">mopa</b></span>
        <span style="width:.17em;background:${PINK};border-radius:.02em"></span>
      </div>
      <div style="height:.085em;background:${PINK};margin-top:.085em"></div>
      <div style="margin-top:.55em;font-size:.27em;font-weight:500;letter-spacing:.2em;color:${PINK}">FACILITY SOLUTIONS</div>
    </div>`;
}

function capHero(c: PaletaGorra): string {
  return `<div style="position:relative">
    ${capSVG("front", c)}
    ${capLogo()}
  </div>`;
}

function miniCol(c: PaletaGorra): string {
  return `<div style="display:flex;flex-direction:column;gap:${(4 * MM).toFixed(1)}px">
    ${capSVG("back", c)}
    ${capSVG("side", c)}
    ${capSVG("side", c, true)}
  </div>`;
}

function field(label: string, value: string): string {
  return `<div style="min-width:0">
    <span style="display:block;font-size:8.5px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:${MUTED};margin-bottom:5px">${label}</span>
    <span style="display:block;font-size:13.5px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;line-height:1.25">${value}</span>
  </div>`;
}

function spec(label: string, value: string): string {
  return `<div style="min-width:0">
    <span style="display:block;font-size:8.5px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:${MUTED};margin-bottom:5px">${label}</span>
    <span style="display:block;font-size:12.5px;font-weight:600;text-transform:uppercase;letter-spacing:.02em;line-height:1.3">${value || "—"}</span>
  </div>`;
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

  const gapGrid = (5 * MM).toFixed(1);
  const padBottom = (6 * MM).toFixed(1);
  const gapShow = (7 * MM).toFixed(1);
  const gapMini = (4 * MM).toFixed(1);
  const gapHero = (6 * MM).toFixed(1);
  const padTopSpec = (6 * MM).toFixed(1);

  return `
<div style="width:794px;min-height:1123px;background:${BEIGE};padding:${(15 * MM).toFixed(1)}px ${(14 * MM).toFixed(1)}px ${(13 * MM).toFixed(1)}px;display:flex;flex-direction:column;gap:${(9 * MM).toFixed(1)}px;overflow:hidden;font-family:${FONT_STACK};color:${INK};position:relative">
  <div style="text-align:right;font-size:10.5px;font-weight:500;letter-spacing:.1em;color:${MUTED}">${fechaFmt}</div>

  <section style="display:grid;grid-template-columns:1fr 1.25fr 1.35fr .7fr;gap:${gapGrid}px;padding-bottom:${padBottom}px;border-bottom:1px solid ${HAIRLINE}">
    ${field("Cliente", data.cliente_razon_social || "—")}
    ${field("Producto", producto)}
    ${field("N° Cotización", data.cotizacion_correlativo || "—")}
    ${field("Cantidad", String(cantidad))}
  </section>

  <section style="flex:1;display:grid;grid-template-columns:1.4fr 1fr;gap:${gapShow}px;align-items:center">
    <div style="display:flex;flex-direction:column;gap:${gapHero}px">${capHero(NEGRA)}${capHero(GRIS)}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:${gapMini}px;align-content:center">${miniCol(NEGRA)}${miniCol(GRIS)}</div>
  </section>

  <section style="display:grid;grid-template-columns:1fr 1.1fr 1.5fr 1fr;gap:${gapGrid}px;padding-top:${padTopSpec}px;border-top:1px solid ${HAIRLINE}">
    ${spec("Material", espec.material)}
    ${spec("Personalización", espec.personalizacion)}
    ${spec("Color", espec.color)}
    ${spec("Medida logo", espec.medida_logo)}
  </section>
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
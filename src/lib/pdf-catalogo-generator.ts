import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { BRAND, FONT_SANS, FONT_MONO, pdfBrandHeader } from "./pdf-brand";
import type { DocumentoEspecificaciones, DocumentoPDFData } from "@/types/cotizacion.types";

const BEIGE = "#f3ecdd";

const SPEC_VACIAS: DocumentoEspecificaciones = {
  material: "",
  personalizacion: "",
  color: "",
  medida_logo: "",
};

export interface CatalogoPDFInput extends DocumentoPDFData {
  fotos: string[];
}

function formatFecha(fecha: string | null): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CL", { year: "numeric", month: "short", day: "numeric" });
}

function boxTitulo(label: string): string {
  return `<p style="margin:0 0 5px;font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:${BRAND.mist};font-weight:800">${label}</p>`;
}

function renderHTML(data: CatalogoPDFInput): string {
  const fechaFmt = formatFecha(data.fecha);
  const producto = data.productos[0]?.descripcion || "—";
  const cantidad = data.cantidad_total || data.productos[0]?.cantidad || 0;

  const imagenes =
    data.fotos.length > 0 ? data.fotos : data.productos.map((p) => p.imagen_url).filter(Boolean);

  const bloqueVisual =
    imagenes.length > 0
      ? imagenes
          .map(
            (img, i) => `
            <div style="flex:0 0 150px;background:#fff;border:1px solid ${BRAND.line};border-radius:3px;padding:8px">
              <img src="${img}" style="width:132px;height:132px;object-fit:contain;display:block" crossorigin="anonymous" />
              <p style="margin:8px 0 0;font-size:10px;text-align:center;color:${BRAND.mist};font-family:${FONT_MONO}">Vista ${i + 1}</p>
            </div>`
          )
          .join("")
      : `<p style="padding:24px;font-size:12px;color:${BRAND.mist};text-align:center;border:1px dashed ${BRAND.paper2};border-radius:3px">Sin fotos adjuntadas. Sube fotografías para el bloque visual.</p>`;

  const spec: DocumentoEspecificaciones = data.especificaciones || SPEC_VACIAS;
  const specFilas = [
    ["Material", spec.material],
    ["Personalización", spec.personalizacion],
    ["Color", spec.color],
    ["Medida logo", spec.medida_logo],
  ].filter(([, v]) => v && v.trim());

  const especificaciones =
    specFilas.length > 0
      ? `<table style="width:100%;border-collapse:collapse">${specFilas
          .map(
            ([k, v]) => `
        <tr>
          <td style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:${BRAND.mist};font-weight:800;background:${BRAND.paper};border:1px solid ${BRAND.line};width:220px">${k}</td>
          <td style="padding:10px 14px;font-size:14px;color:${BRAND.carbon2};border:1px solid ${BRAND.line}">${v}</td>
        </tr>`
          )
          .join("")}</table>`
      : `<p style="padding:14px;font-size:12px;color:${BRAND.mist};background:${BRAND.paper};border:1px solid ${BRAND.line}">Sin especificaciones.</p>`;

  return `
    <div style="font-family:${FONT_SANS};width:794px;padding:36px;background:${BEIGE};color:${BRAND.carbon}">
      ${pdfBrandHeader({ titulo: `[${data.correlativo}]`, correlativo: "CATÁLOGO · DOCUMENTO A4", fecha: fechaFmt, fechaEtiqueta: "Fecha" })}

      <div style="display:flex;gap:10px;margin-bottom:26px">
        <div style="flex:1;background:#fff;border:1px solid ${BRAND.line};padding:12px;border-radius:3px">
          ${boxTitulo("Fecha")}
          <p style="margin:0;font-size:13px;font-weight:700;color:${BRAND.carbon}">${fechaFmt}</p>
        </div>
        <div style="flex:1.6;background:#fff;border:1px solid ${BRAND.line};padding:12px;border-radius:3px">
          ${boxTitulo("Cliente")}
          <p style="margin:0;font-size:13px;font-weight:700;color:${BRAND.carbon}">${data.cliente_razon_social || "—"}</p>
        </div>
        <div style="flex:1.6;background:#fff;border:1px solid ${BRAND.line};padding:12px;border-radius:3px">
          ${boxTitulo("Producto")}
          <p style="margin:0;font-size:13px;font-weight:700;color:${BRAND.carbon}">${producto}</p>
        </div>
        <div style="flex:1;background:#fff;border:1px solid ${BRAND.line};padding:12px;border-radius:3px">
          ${boxTitulo("N° Cotización")}
          <p style="margin:0;font-size:13px;font-weight:700;color:${BRAND.pineInk};font-family:${FONT_MONO}">${data.cotizacion_correlativo || "—"}</p>
        </div>
        <div style="flex:0.6;background:#fff;border:1px solid ${BRAND.line};padding:12px;border-radius:3px">
          ${boxTitulo("Cantidad")}
          <p style="margin:0;font-size:15px;font-weight:800;color:${BRAND.carbon}">${cantidad}</p>
        </div>
      </div>

      <div style="margin-bottom:26px">
        <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;color:${BRAND.pineInk};font-weight:800;letter-spacing:.5px">Vistas del producto</p>
        <div style="display:flex;flex-wrap:wrap;gap:10px">${bloqueVisual}</div>
      </div>

      <div>
        <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;color:${BRAND.pineInk};font-weight:800;letter-spacing:.5px">Especificaciones</p>
        ${especificaciones}
      </div>
    </div>
  `;
}

export async function generarPDFCatalogo(data: CatalogoPDFInput) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = renderHTML(data);
  document.body.appendChild(container);

  const images = container.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    )
  );

  const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
  document.body.removeChild(container);

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`[${data.correlativo}].pdf`);
}
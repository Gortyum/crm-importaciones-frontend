import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { BRAND, FONT_SANS, FONT_MONO, pdfBrandHeader } from "./pdf-brand";

interface ItemPDF {
  descripcion: string;
  cantidad: number;
  costo_unitario: number;
  divisa: string;
  tipo_personalizacion: string;
  subtotal: number;
}

interface OCData {
  correlativo: string;
  fecha: string;
  proveedor_nombre: string;
  proveedor_tax_id: string;
  proveedor_pais: string;
  cotizacion_correlativo: string;
  items: ItemPDF[];
  total_general: number;
  notas: string;
}

function formatCLP(v: number): string {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v);
}

function renderHTML(data: OCData): string {
  const fechaFmt = new Date(data.fecha).toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" });
  const rows = data.items.map((it, i) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};font-size:13px">${i + 1}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};font-size:13px">${it.descripcion}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};text-align:center;font-size:13px">${it.cantidad}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};font-size:12px;color:${BRAND.mist}">${it.tipo_personalizacion}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};text-align:right;font-size:13px">${formatCLP(it.costo_unitario)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};text-align:right;font-size:13px;font-weight:600">${formatCLP(it.subtotal)}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family:${FONT_SANS};width:794px;padding:40px;color:${BRAND.carbon}">
      ${pdfBrandHeader({ titulo: "ORDEN DE COMPRA", correlativo: data.correlativo, fecha: fechaFmt })}

      <div style="display:flex;gap:30px;margin-bottom:30px">
        <div style="flex:1;background:${BRAND.bone};padding:16px;border-radius:2px;border:1px solid ${BRAND.pineHi}">
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:${BRAND.pineInk};font-weight:700;letter-spacing:0.5px">Proveedor</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:${BRAND.carbon}">${data.proveedor_nombre}</p>
          <p style="margin:4px 0 0;font-size:12px;color:${BRAND.pineInk}">Tax ID: ${data.proveedor_tax_id}</p>
          ${data.proveedor_pais ? `<p style="margin:2px 0 0;font-size:12px;color:${BRAND.pineInk}">País: ${data.proveedor_pais}</p>` : ""}
        </div>
        <div style="flex:1;background:${BRAND.bone};padding:16px;border-radius:2px;border:1px solid ${BRAND.line}">
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:${BRAND.mist};font-weight:700;letter-spacing:0.5px">Referencia</p>
          <p style="margin:0;font-size:13px;color:${BRAND.mist}">Cotización: <strong style="color:${BRAND.carbon}">${data.cotizacion_correlativo}</strong></p>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="background:${BRAND.paper}">
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:${BRAND.pineInk};font-weight:700">#</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:${BRAND.pineInk};font-weight:700">Producto</th>
            <th style="padding:10px 8px;text-align:center;font-size:11px;text-transform:uppercase;color:${BRAND.pineInk};font-weight:700">Cant.</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:${BRAND.pineInk};font-weight:700">Tipo</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;color:${BRAND.pineInk};font-weight:700">Costo Unit.</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;color:${BRAND.pineInk};font-weight:700">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end">
        <div style="width:280px">
          <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:18px;font-weight:800;color:${BRAND.pineInk};border-top:2px solid ${BRAND.pine};margin-top:4px">
            <span>TOTAL</span><span>${formatCLP(data.total_general)}</span>
          </div>
        </div>
      </div>

      ${data.notas ? `
      <div style="margin-top:30px;padding:16px;background:${BRAND.paper};border:1px solid ${BRAND.paper2};border-radius:2px">
        <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;color:${BRAND.pineInk};font-weight:700">Notas</p>
        <p style="margin:0;font-size:13px;color:${BRAND.carbon2}">${data.notas}</p>
      </div>` : ""}

      <div style="margin-top:40px;padding-top:16px;border-top:1px solid ${BRAND.line};text-align:center">
        <p style="margin:0;font-size:11px;color:${BRAND.mist2}">Orden de compra generada desde Eleni Sourcing · Importaciones</p>
      </div>
    </div>
  `;
}

export async function generarOC_PDF(data: OCData) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = renderHTML(data);
  document.body.appendChild(container);

  const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
  document.body.removeChild(container);

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${data.correlativo}.pdf`);
}

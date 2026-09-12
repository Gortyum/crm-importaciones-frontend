import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { BRAND, FONT_SANS, FONT_MONO, pdfBrandHeader } from "./pdf-brand";

interface ItemPDF {
  descripcion: string;
  cantidad: number;
  divisa_origen: string;
  imagen_url: string;
  precio_venta_unitario: number;
  tipo_personalizacion: string;
  subtotal: number;
  iva_monto: number;
  total: number;
}

interface PDFData {
  correlativo: string;
  fecha: string;
  cliente_razon_social: string;
  cliente_rut: string;
  cliente_direccion: string;
  contacto_nombre: string;
  contacto_email: string;
  items: ItemPDF[];
  subtotal_general: number;
  iva_general: number;
  total_general: number;
  notas: string;
}

function formatCLP(v: number): string {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v);
}

function renderHTML(data: PDFData): string {
  const fechaFmt = new Date(data.fecha).toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" });
  const rows = data.items.map((it, i) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};font-size:13px">${i + 1}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};font-size:13px">
        <div style="display:flex;align-items:center;gap:8px">
          ${it.imagen_url ? `<img src="${it.imagen_url}" style="max-width:60px;max-height:60px;object-fit:contain;border-radius:2px;border:1px solid ${BRAND.line};flex-shrink:0" crossorigin="anonymous" />` : ""}
          <span>${it.descripcion}</span>
        </div>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};text-align:center;font-size:13px">${it.cantidad}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};text-align:center;font-size:11px;color:${BRAND.pine};font-weight:600">${it.divisa_origen}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};font-size:12px;color:${BRAND.mist}">${it.tipo_personalizacion}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};text-align:right;font-size:13px">${formatCLP(it.precio_venta_unitario)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};text-align:right;font-size:13px;font-weight:600">${formatCLP(it.total)}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family:${FONT_SANS};width:794px;padding:40px;color:${BRAND.carbon}">
      ${pdfBrandHeader({ titulo: "COTIZACIÓN", correlativo: data.correlativo, fecha: fechaFmt })}

      <div style="display:flex;gap:30px;margin-bottom:30px">
        <div style="flex:1;background:${BRAND.bone};padding:16px;border-radius:2px;border:1px solid ${BRAND.line}">
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:${BRAND.mist};font-weight:700;letter-spacing:0.5px">Cliente</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:${BRAND.carbon}">${data.cliente_razon_social}</p>
          <p style="margin:4px 0 0;font-size:12px;color:${BRAND.mist}">RUT: ${data.cliente_rut}</p>
          ${data.cliente_direccion ? `<p style="margin:2px 0 0;font-size:12px;color:${BRAND.mist}">${data.cliente_direccion}</p>` : ""}
        </div>
        ${data.contacto_nombre ? `
        <div style="flex:1;background:${BRAND.bone};padding:16px;border-radius:2px;border:1px solid ${BRAND.line}">
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:${BRAND.mist};font-weight:700;letter-spacing:0.5px">Contacto</p>
          <p style="margin:0;font-size:14px;font-weight:600;color:${BRAND.carbon}">${data.contacto_nombre}</p>
          ${data.contacto_email ? `<p style="margin:2px 0 0;font-size:12px;color:${BRAND.mist}">${data.contacto_email}</p>` : ""}
        </div>` : ""}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="background:${BRAND.paper}">
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:${BRAND.mist};font-weight:700">#</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:${BRAND.mist};font-weight:700">Producto</th>
            <th style="padding:10px 8px;text-align:center;font-size:11px;text-transform:uppercase;color:${BRAND.mist};font-weight:700">Cant.</th>
            <th style="padding:10px 8px;text-align:center;font-size:11px;text-transform:uppercase;color:${BRAND.mist};font-weight:700">Divisa</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:${BRAND.mist};font-weight:700">Tipo</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;color:${BRAND.mist};font-weight:700">P. Unitario</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;color:${BRAND.mist};font-weight:700">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end">
        <div style="width:280px">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:${BRAND.mist}">
            <span>Subtotal</span><span>${formatCLP(data.subtotal_general)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:${BRAND.mist}">
            <span>IVA (19%)</span><span>${formatCLP(data.iva_general)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:18px;font-weight:800;color:${BRAND.pineInk};border-top:2px solid ${BRAND.pine};margin-top:4px">
            <span>TOTAL</span><span>${formatCLP(data.total_general)}</span>
          </div>
        </div>
      </div>

      ${data.notas ? `
      <div style="margin-top:30px;padding:16px;background:${BRAND.paper};border:1px solid ${BRAND.paper2};border-radius:2px">
        <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;color:${BRAND.pineInk};font-weight:700">Observaciones</p>
        <p style="margin:0;font-size:13px;color:${BRAND.carbon2}">${data.notas}</p>
      </div>` : ""}

      <div style="margin-top:40px;padding-top:16px;border-top:1px solid ${BRAND.line};text-align:center">
        <p style="margin:0;font-size:11px;color:${BRAND.mist2}">Esta cotización tiene una vigencia de 30 días desde la fecha de emisión.</p>
      </div>
    </div>
  `;
}

export async function generarPDF(data: PDFData) {
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
  pdf.save(`${data.correlativo}.pdf`);
}

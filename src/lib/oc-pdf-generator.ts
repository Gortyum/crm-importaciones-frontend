import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px">${i + 1}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px">${it.descripcion}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px">${it.cantidad}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280">${it.tipo_personalizacion}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px">${formatCLP(it.costo_unitario)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px;font-weight:600">${formatCLP(it.subtotal)}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family:Arial,sans-serif;width:794px;padding:40px;color:#1e293b">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;border-bottom:3px solid #059669;padding-bottom:20px">
        <div>
          <h1 style="margin:0;font-size:28px;color:#1e293b;font-weight:800">ORDEN DE COMPRA</h1>
          <p style="margin:4px 0 0;font-size:14px;color:#64748b;font-family:monospace">${data.correlativo}</p>
        </div>
        <div style="text-align:right">
          <p style="margin:0;font-size:12px;color:#64748b">Fecha de emisión</p>
          <p style="margin:2px 0 0;font-size:14px;font-weight:600">${fechaFmt}</p>
        </div>
      </div>

      <div style="display:flex;gap:30px;margin-bottom:30px">
        <div style="flex:1;background:#f0fdf4;padding:16px;border-radius:8px;border:1px solid #bbf7d0">
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:#166534;font-weight:700;letter-spacing:0.5px">Proveedor</p>
          <p style="margin:0;font-size:15px;font-weight:700">${data.proveedor_nombre}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#166534">Tax ID: ${data.proveedor_tax_id}</p>
          ${data.proveedor_pais ? `<p style="margin:2px 0 0;font-size:12px;color:#166534">País: ${data.proveedor_pais}</p>` : ""}
        </div>
        <div style="flex:1;background:#f8fafc;padding:16px;border-radius:8px">
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:#94a3b8;font-weight:700;letter-spacing:0.5px">Referencia</p>
          <p style="margin:0;font-size:13px;color:#64748b">Cotización: <strong>${data.cotizacion_correlativo}</strong></p>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="background:#f0fdf4">
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;font-weight:700">#</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;font-weight:700">Producto</th>
            <th style="padding:10px 8px;text-align:center;font-size:11px;text-transform:uppercase;color:#166534;font-weight:700">Cant.</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;font-weight:700">Tipo</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;color:#166534;font-weight:700">Costo Unit.</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;color:#166534;font-weight:700">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end">
        <div style="width:280px">
          <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:18px;font-weight:800;color:#166534;border-top:2px solid #059669;margin-top:4px">
            <span>TOTAL</span><span>${formatCLP(data.total_general)}</span>
          </div>
        </div>
      </div>

      ${data.notas ? `
      <div style="margin-top:30px;padding:16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px">
        <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;color:#075985;font-weight:700">Notas</p>
        <p style="margin:0;font-size:13px;color:#0c4a6e">${data.notas}</p>
      </div>` : ""}

      <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center">
        <p style="margin:0;font-size:11px;color:#94a3b8">Orden de compra generada desde sistema CRM/ERP</p>
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

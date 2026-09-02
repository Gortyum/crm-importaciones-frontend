import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px">${i + 1}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px">
        <div style="display:flex;align-items:center;gap:8px">
          ${it.imagen_url ? `<img src="${it.imagen_url}" style="max-width:60px;max-height:60px;object-fit:contain;border-radius:4px;border:1px solid #e5e7eb;flex-shrink:0" crossorigin="anonymous" />` : ""}
          <span>${it.descripcion}</span>
        </div>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px">${it.cantidad}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:11px;color:#2563eb;font-weight:600">${it.divisa_origen}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280">${it.tipo_personalizacion}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px">${formatCLP(it.precio_venta_unitario)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px;font-weight:600">${formatCLP(it.total)}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family:Arial,sans-serif;width:794px;padding:40px;color:#1e293b">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;border-bottom:3px solid #2563eb;padding-bottom:20px">
        <div>
          <h1 style="margin:0;font-size:28px;color:#1e293b;font-weight:800">COTIZACIÓN</h1>
          <p style="margin:4px 0 0;font-size:14px;color:#64748b;font-family:monospace">${data.correlativo}</p>
        </div>
        <div style="text-align:right">
          <p style="margin:0;font-size:12px;color:#64748b">Fecha de emisión</p>
          <p style="margin:2px 0 0;font-size:14px;font-weight:600">${fechaFmt}</p>
        </div>
      </div>

      <div style="display:flex;gap:30px;margin-bottom:30px">
        <div style="flex:1;background:#f8fafc;padding:16px;border-radius:8px">
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:#94a3b8;font-weight:700;letter-spacing:0.5px">Cliente</p>
          <p style="margin:0;font-size:15px;font-weight:700">${data.cliente_razon_social}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b">RUT: ${data.cliente_rut}</p>
          ${data.cliente_direccion ? `<p style="margin:2px 0 0;font-size:12px;color:#64748b">${data.cliente_direccion}</p>` : ""}
        </div>
        ${data.contacto_nombre ? `
        <div style="flex:1;background:#f8fafc;padding:16px;border-radius:8px">
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:#94a3b8;font-weight:700;letter-spacing:0.5px">Contacto</p>
          <p style="margin:0;font-size:14px;font-weight:600">${data.contacto_nombre}</p>
          ${data.contacto_email ? `<p style="margin:2px 0 0;font-size:12px;color:#64748b">${data.contacto_email}</p>` : ""}
        </div>` : ""}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700">#</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700">Producto</th>
            <th style="padding:10px 8px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700">Cant.</th>
            <th style="padding:10px 8px;text-align:center;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700">Divisa</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700">Tipo</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700">P. Unitario</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end">
        <div style="width:280px">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#64748b">
            <span>Subtotal</span><span>${formatCLP(data.subtotal_general)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#64748b">
            <span>IVA (19%)</span><span>${formatCLP(data.iva_general)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:18px;font-weight:800;color:#1e40af;border-top:2px solid #2563eb;margin-top:4px">
            <span>TOTAL</span><span>${formatCLP(data.total_general)}</span>
          </div>
        </div>
      </div>

      ${data.notas ? `
      <div style="margin-top:30px;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px">
        <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;color:#92400e;font-weight:700">Observaciones</p>
        <p style="margin:0;font-size:13px;color:#78350f">${data.notas}</p>
      </div>` : ""}

      <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center">
        <p style="margin:0;font-size:11px;color:#94a3b8">Esta cotización tiene una vigencia de 30 días desde la fecha de emisión.</p>
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

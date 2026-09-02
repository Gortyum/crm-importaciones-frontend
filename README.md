# CRM Importaciones - Frontend

Interfaz web para gestionar cotizaciones de productos importados. React + TypeScript + Tailwind.

## Qué hace

- **Dashboard** con resumen de cotizaciones y estados
- **Clientes**: CRUD con contactos por cliente
- **Proveedores**: CRUD con datos de país y tax ID
- **Productos**: catálogo básico
- **Cotizaciones**: formulario completo con cálculo en tiempo real (costo → TC → flete → margen → descuento → IVA), selector de proveedor e divisa por item, subida de fotos
- **Órdenes de compra**: se generan desde la cotización por proveedor, con transiciones de estado
- **PDF**: genera PDF de cotización (sin costos ni proveedor) y de orden de compra (sin cliente)

## Requisitos

- Node.js 18+
- npm

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

El frontend queda en `http://localhost:5173` y hace proxy al backend en `http://localhost:8000`.

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL del backend (vacío = usa proxy en dev) | `` |

En desarrollo no necesitas configurar nada, el proxy de Vite se encarga.

En producción, buildtea con la variable apuntando al backend:
```bash
VITE_API_URL=http://192.168.1.100:8000 npm run build
```

## Estructura

```
src/
├── main.tsx                 # entry point
├── App.tsx                  # rutas
├── index.css                # estilos globales (Tailwind)
├── components/
│   ├── layout/
│   │   ├── Layout.tsx       # shell con sidebar
│   │   └── Sidebar.tsx      # navegación lateral
│   └── ui/                  # componentes base (Button, Input, Select, Dialog, Label)
├── pages/
│   ├── Dashboard.tsx
│   ├── Clientes.tsx         # CRUD + modal de contactos
│   ├── Proveedores.tsx
│   ├── Productos.tsx
│   ├── CotizacionesList.tsx
│   ├── NuevaCotizacion.tsx  # formulario con cálculo en vivo
│   ├── DetalleCotizacion.tsx # detalle + generar OC + PDF
│   ├── OrdenesCompraList.tsx
│   └── DetalleOrdenCompra.tsx
├── services/
│   └── api.ts               # cliente API (fetch)
├── lib/
│   ├── utils.ts             # formatCLP y helpers
│   ├── pdf-generator.ts     # PDF de cotización (jsPDF + html2canvas)
│   └── oc-pdf-generator.ts  # PDF de orden de compra
└── hooks/
```

## Endpoints que usa

El frontend espera que el backend esté corriendo en `localhost:8000` con estos endpoints:

- `GET/POST /api/clientes/` y sub-recursos de contactos
- `GET/POST /api/proveedores/`
- `GET/POST /api/productos/`
- `GET/POST /api/cotizaciones/`
- `PATCH /api/cotizaciones/{id}/estado`
- `GET /api/cotizaciones/{id}/pdf-data`
- `GET/POST /api/ordenes-compra/`
- `PATCH /api/ordenes-compra/{id}/estado`
- `GET /api/ordenes-compra/{id}/pdf-data`
- `GET /api/divisas/cambio`
- `POST /api/upload/` (imágenes)

## PDFs

Los PDFs se generan del lado del cliente usando jsPDF + html2canvas. El de cotización NO muestra costos, márgenes ni proveedor (eso es información interna). El de orden de compra NO muestra el cliente.

## Notas

- Las imágenes subidas se comprimen y procesan en el backend, el frontend solo muestra el resultado
- El cálculo de costos se replica en el frontend para el preview en vivo, pero el cálculo real lo hace el backend al guardar
- Se usa Tailwind CSS para estilos, sin librería de componentes externa

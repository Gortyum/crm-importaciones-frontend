# CRM Eleni Sourcing — Frontend (React)

Interfaz web del CRM de **Eleni Sourcing · Importaciones**: gestión de clientes, proveedores,
productos, **cotizaciones**, **importaciones** y **órdenes de compra** de mercancía entre
Brasil y Chile. React + TypeScript + Vite + Tailwind CSS.

---

## 1. Stack

- **React 18** + TypeScript, build con **Vite**
- **Tailwind CSS** + PostCSS (sin librería de componentes externa; componentes propios en `src/components/ui/`)
- **React Router** (rutas protegidas) — ver `src/App.tsx`
- **jsPDF + html2canvas** para generar PDFs en el navegador
- No usa state global externo: la sesión y las referencias viven en **AuthContext** (`src/hooks/AuthContext.tsx`)
- Cliente API tipado contra el backend FastAPI (`src/services/api.ts`)

## 2. Requisitos y puesta en marcha

```bash
# Requisitos: Node.js 18+
cp .env.example .env     # ajustar VITE_API_URL si es necesario
npm install
npm run dev              # → http://localhost:5173
```

En dev no hace falta `VITE_API_URL`: el **proxy de Vite** (`vite.config.ts`) reenvía `/api` y
`/uploads` al backend de `http://localhost:8000`. Cuando la variable está definida, el cliente API
la usa como base y ya no depende del proxy.

Comandos útiles:

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (genera `dist/`) |
| `npx tsc --noEmit` | Verificación de tipos |
| `npm run preview` | Sirve el build localmente |

## 3. Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL base del backend. Vacío = rutas relativas (proxy de Vite en dev); `http://localhost:8000` = backend local directo | vacío |

Producción:

```
VITE_API_URL=https://crm-importaciones-backend-production.up.railway.app npm run build
```

## 4. Estructura del proyecto

```
src/
├── main.tsx                     # bootstrap, fuentes (Manrope + IBM Plex Mono)
├── App.tsx                      # rutas y guard de autenticación
├── index.css                    # tokens Tailwind (paleta de marca) y estilos base
├── components/
│   ├── layout/
│   │   ├── Layout.tsx           # shell con sidebar
│   │   └── Sidebar.tsx          # navegación (Dashboard, Clientes, Proveedores,
│   │                            #   Productos, Cotizaciones, Importaciones,
│   │                            #   Órdenes de compra, Configuración)
│   ├── ui/                      # componentes base: Button, Input, Select, Label, Dialog
│   ├── cotizaciones/            # piezas del asistente y del detalle (ver §6)
│   └── ArchivosAdjuntos.tsx     # adjuntos de una entidad (R2): subir/listar/descargar/eliminar
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx                # KPIs y actividad reciente
│   ├── Clientes.tsx                 # CRUD + contactos por cliente
│   ├── Proveedores.tsx              # CRUD + categorías y países
│   ├── Productos.tsx                # catálogo + imagen del producto
│   ├── CotizacionesList.tsx
│   ├── NuevaCotizacion.tsx          # asistente en 4 pasos
│   ├── DetalleCotizacion.tsx        # detalle + preguntas + rentabilidad + OC + adjuntos + PDF
│   ├── ImportacionesList.tsx
│   ├── NuevaImportacion.tsx
│   ├── DetalleImportacion.tsx       # landing cost + botón "Pasar a cotización"
│   ├── OrdenesCompraList.tsx
│   ├── DetalleOrdenCompra.tsx       # PDF de OC
│   └── Configuracion.tsx            # IVA, aranceles, contingencia
├── services/api.ts             # cliente API tipado (auth, clientes, cotizaciones, ...)
├── hooks/
│   └── AuthContext.tsx         # sesión + referencias (TC, config, estados, categorías)
├── types/cotizacion.types.ts   # tipos compartidos (incluye ArchivoOut/ArchivoUploadResult)
└── lib/
    ├── utils.ts                # formatCLP, formatMoney, divisaNombre y helpers
    ├── auth.ts                 # gestión del token (localStorage)
    ├── importacion.ts          # cálculo de importación en el cliente (preview en vivo)
    ├── pdf-brand.ts            # marca: logo LeafMark, paleta pino, Manrope/mono
    ├── pdf-generator.ts        # PDF de cotización
    └── oc-pdf-generator.ts     # PDF de orden de compra
```

## 5. Rutas

| Ruta | Página |
|---|---|
| `/login` | Login |
| `/` | Dashboard |
| `/clientes` | Clientes |
| `/proveedores` | Proveedores |
| `/productos` | Productos |
| `/cotizaciones` | Lista de cotizaciones |
| `/cotizaciones/nueva` | Asistente de nueva cotización (4 pasos) |
| `/cotizaciones/:id` | Detalle de cotización |
| `/importaciones` | Lista de importaciones |
| `/importaciones/nueva` | Nueva importación |
| `/importaciones/:id` | Detalle de importación |
| `/ordenes-compra` | Lista de órdenes de compra |
| `/ordenes-compra/:id` | Detalle de OC |
| `/configuracion` | Configuración global |

Todas excepto `/login` requieren sesión (token JWT); si no hay token redirige a `/login`.

## 6. Módulos en detalle

### Asistente de cotización (`NuevaCotizacion`)

Wizard de 4 pasos que acumula estado en `NuevaCotizacion` (un `useState<CotizacionFormData>` con el
formulario completo más el control de `CotizacionStepper`):

| Paso | Componente | Qué hace |
|---|---|---|
| 1. Productos | `Step1Productos` | Cliente y contacto; lista de ítems con **proveedor/fabricante por ítem**, producto, descripción, precio de proveedor, **moneda y tipo de cambio por ítem**, cantidad, personalización, margen, descuento, **flete** (manual o auto por peso/volumen), peso/volumen, envío, IVA y **foto/subida de imagen** (R2 con fallback local); notas para el PDF |
| 2. Importación | `Step2Importacion` | **Tipo de cambio**: TC USD→CLP (`TipoCambioCard`) y TC **BRL→USD** si hay ítems en BRL; toggle "Calcular costo de importación"; **vía de transporte** (Aéreo/Terrestre/Courier); contingencia cambiaria; desglose **CIF** (`CIFBreakdown`); **certificado de origen Mercosur** (`MercosurSelector`); tabla de **costos de importación** (`CostosImportacionTable`) y **landed cost** (`LandedCostCard`) en preview |
| 3. Precio | `Step3Precio` | Visor del **flujo de precio** (`PrecioVentaFlow`): costo FOB → CIF (`CIFBreakdown`) → **landed cost** (`LandedCostCard` → `CostosImportacionTable`) → rentabilidad por ítem (`RentabilidadCard`); edición fina |
| 4. Resumen | `Step4Resumen` | Datos de cliente/contacto, moneda y layout; confirmación y guardado |

El tipo de cambio vive en cada ítem (`tipo_cambio`), así el PDF y el detalle reproducen el cálculo
exacto sin depender de un TC global. El preview en vivo se calcula en el cliente
(`lib/importacion.ts`), replicando la lógica del backend; el cálculo definitivo lo hace el backend.

### Detalle de cotización (`DetalleCotizacion`)

- **Regla de oro — 4 indicadores**: ¿cuánto cuesta? ¿cuánto cobro? ¿cuánto gano? ¿qué margen tengo?
- Datos de cliente/contacto, condiciones comerciales (moneda base, tipo de cambio), estado y
  botones de transición (`Creada → Enviada → Cerrada → En Produccion → Entregada`, más `Cancelada`).
- **Importación de costeo vinculada** (si existe): desglose FOB / flete+seguro / CIF / landed cost.
- **Crear Importación**: genera una importación de costeo desde la cotización (solo si no hay una).
- **Cotización aceptada** (Cerrada/En Produccion/Entregada): tarjeta destacada para **crear una Orden
  de Compra por proveedor**, conservando la moneda original de cada proveedor.
- **Documentos adjuntos** (`ArchivosAdjuntos`): sube archivos a Cloudflare R2 vía
  `/api/archivos/upload` con `entidadTipo="cotizacion"`, lista, descarga (URL firmada) y elimina.
- Tabla de productos, notas/observaciones, totales (subtotal, IVA, total cliente) y **PDF de cotización**.

### Importaciones (`NuevaImportacion` / `DetalleImportacion`)

- Costos de importación categorizados según transporte (Courier / Aéreo / Terrestre): flete
  internacional, seguro, despacho, agente de aduana y flete local, cada uno en su divisa.
- `DetalleImportacion` muestra el desglose **FOB → CIF → arancel → contingencia → landed cost → precio
  de venta** y permite avanzar por estados (`Borrador → En Transito → En Bodega → Cerrada`).
- Botón **"Pasar a cotización"**: convierte una importación cerrada en una cotización (elige
  cliente/contacto y crea la cotización con los precios de venta calculados).

### Órdenes de compra (`OrdenesCompraList` / `DetalleOrdenCompra`)

- Se crean desde la cotización (una por proveedor). Estados: `Pendiente → Confirmada → En
  Produccion → Recibida` (+ `Cancelada`).
- **PDF de OC** → `lib/oc-pdf-generator.ts` (sin datos del cliente).

### Configuración (`Configuracion`)

Edita los parámetros globales del negocio: **IVA Chile**, **arancel general**, **arancel Mercosur**
y **% de contingencia** (guardados en `config_service` del backend).

## 7. Marca y diseño (`pdf-brand.ts` + `index.css`)

- Identidad: **Eleni Sourcing · Importaciones** con logo *LeafMark*.
- Paleta: pino `#3d6a4c` · carbon `#151710` · bone `#faf8f1` · paper `#f0ede2`; radios 2px.
- Tipografía: **Manrope** (texto) + **IBM Plex Mono** (números/tasas).
- Historia de usuario: el sistema se construyó alrededor de la marca, no al revés; la familia de
  fuentes, la paleta y el logo acompañan a los PDFs y al panel (borde/acento mono, formas geométricas).

## 8. PDFs

Se generan **en el navegador** (jsPDF + html2canvas) con la marca de `pdf-brand.ts` (header con
logo y datos de la empresa).

- **PDF de cotización** (`pdf-generator.ts`): documentos para el cliente — **sin costos, márgenes ni
  proveedor** (información interna). No incluye columna de divisa: los precios se muestran en CLP.
- **PDF de orden de compra** (`oc-pdf-generator.ts`): documento para el proveedor — **sin datos del
  cliente**, solo los ítems, cantidades y precios de compra.
- Ambos usan los datos estructurados de `/pdf-data` del backend para reproducir el cálculo exacto.

> Para que el PDF (html2canvas) cargue las imágenes de R2, el bucket debe tener activa la política
> CORS con el origin del frontend (ver sección 10 del README del backend).

## 9. Cliente API y tipos

- `src/services/api.ts` exporta `api` con métodos tipados por recurso: `auth`, `config`,
  `clientes`, `proveedores`, `productos`, `cotizaciones`, `importaciones`, `ordenesCompra`,
  `divisas`, `upload`, `archivos`.
- `api.archivos` (R2): `upload(file, entidadTipo, entidadId, esPublico)`, `list`,
  `get`, `descargar`, `delete`. El tipo `ArchivoUploadResult` incluye `duplicado: boolean`
  (el backend reutiliza el archivo físico si el contenido ya existe).
- `Step1Productos` usa R2 para imágenes de producto (`esPublico=true`) y, si el backend devuelve
  `503` (R2 no configurado), cae al upload local de `/api/upload/`.

## 10. Autenticación

- `Login` → `POST /api/auth/login` → guarda token y username en `localStorage` y carga las
  **referencias** (tipos de cambio del día, % de contingencia, IVA/aranceles, estados y
  transiciones, categorías de productos).
- `AuthContext` expone `user`, `referencias`, `login`, `logout` y `refreshReferencias` (re-valida
  las referencias sin volver a loguear).
- El token viaja en el header `Authorization: Bearer ...` desde `lib/auth.ts` (cada request de `api.ts`).

## 11. Despliegue (Vercel / Netlify)

1. Build con la URL del backend:
   ```
   VITE_API_URL=https://crm-importaciones-backend-production.up.railway.app npm run build
   ```
2. Deployar la carpeta `dist/` como static (Vercel: framework preset **Vite**).
3. En el backend (Railway) configurar `ALLOWED_ORIGINS` con el origin del frontend e.g.
   `http://localhost:5173,https://crm-importaciones-frontend-pi.vercel.app` y la **CORS del bucket R2**
   con el mismo origin (ver README del backend).

## Notas

- El cálculo de costos se replica en el frontend para el preview en vivo, pero el **cálculo real lo
  hace el backend** al guardar; el detalle siempre lee lo que persistió el backend.
- Las imágenes subidas se procesan en el backend (EXIF, ajustes, resize → WebP); el frontend solo
  muestra el resultado (URL de `/uploads/` o de R2).
- No hay secrets en el repo: solo `VITE_API_URL` en `.env` local.
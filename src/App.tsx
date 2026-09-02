import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Proveedores from "./pages/Proveedores";
import Productos from "./pages/Productos";
import CotizacionesList from "./pages/CotizacionesList";
import NuevaCotizacion from "./pages/NuevaCotizacion";
import DetalleCotizacion from "./pages/DetalleCotizacion";
import OrdenesCompraList from "./pages/OrdenesCompraList";
import DetalleOrdenCompra from "./pages/DetalleOrdenCompra";
import ImportacionesList from "./pages/ImportacionesList";
import NuevaImportacion from "./pages/NuevaImportacion";
import DetalleImportacion from "./pages/DetalleImportacion";
import Configuracion from "./pages/Configuracion";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/cotizaciones" element={<CotizacionesList />} />
        <Route path="/cotizaciones/nueva" element={<NuevaCotizacion />} />
        <Route path="/cotizaciones/:id" element={<DetalleCotizacion />} />
        <Route path="/ordenes-compra" element={<OrdenesCompraList />} />
        <Route path="/ordenes-compra/:id" element={<DetalleOrdenCompra />} />
        <Route path="/importaciones" element={<ImportacionesList />} />
        <Route path="/importaciones/nueva" element={<NuevaImportacion />} />
        <Route path="/importaciones/:id" element={<DetalleImportacion />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}
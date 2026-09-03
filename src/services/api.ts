const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

import { getToken, clearSession } from "@/lib/auth";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    if (res.status === 401) clearSession();
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Error de servidor");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<any>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
    register: (username: string, password: string) =>
      request<any>("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }),
    me: () => request<any>("/auth/me"),
    cambiarPassword: (password_actual: string, password_nueva: string) =>
      request<any>("/auth/cambiar-password", { method: "POST", body: JSON.stringify({ password_actual, password_nueva }) }),
  },
  clientes: {
    list: () => request<any[]>("/clientes/"),
    get: (id: number) => request<any>(`/clientes/${id}`),
    create: (data: any) => request<any>("/clientes/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/clientes/${id}`, { method: "DELETE" }),
    contactos: (id: number) => request<any[]>(`/clientes/${id}/contactos`),
    addContacto: (id: number, data: any) => request<any>(`/clientes/${id}/contactos`, { method: "POST", body: JSON.stringify(data) }),
    deleteContacto: (cliId: number, contId: number) => request<void>(`/clientes/${cliId}/contactos/${contId}`, { method: "DELETE" }),
  },
  proveedores: {
    list: () => request<any[]>("/proveedores/"),
    create: (data: any) => request<any>("/proveedores/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/proveedores/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/proveedores/${id}`, { method: "DELETE" }),
  },
  proveedorCategorias: {
    list: () => request<any[]>("/proveedor-categorias/"),
    create: (data: any) => request<any>("/proveedor-categorias/", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/proveedor-categorias/${id}`, { method: "DELETE" }),
  },
  productos: {
    list: () => request<any[]>("/productos/"),
    create: (data: any) => request<any>("/productos/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/productos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/productos/${id}`, { method: "DELETE" }),
  },
  cotizaciones: {
    list: () => request<any[]>("/cotizaciones/"),
    get: (id: number) => request<any>(`/cotizaciones/${id}`),
    create: (data: any) => request<any>("/cotizaciones/", { method: "POST", body: JSON.stringify(data) }),
    changeEstado: (id: number, estado: string) => request<any>(`/cotizaciones/${id}/estado`, { method: "PATCH", body: JSON.stringify({ estado }) }),
    pdfData: (id: number) => request<any>(`/cotizaciones/${id}/pdf-data`),
    crearImportacion: (id: number) => request<any>(`/cotizaciones/${id}/crear-importacion`, { method: "POST" }),
  },
  importaciones: {
    list: () => request<any[]>("/importaciones/"),
    get: (id: number) => request<any>(`/importaciones/${id}`),
    create: (data: any) => request<any>("/importaciones/", { method: "POST", body: JSON.stringify(data) }),
    changeEstado: (id: number, estado: string) => request<any>(`/importaciones/${id}/estado`, { method: "PATCH", body: JSON.stringify({ estado }) }),
    pasarACotizacion: (id: number, clienteId: number, contactoId?: number | null) =>
      request<any>(`/importaciones/${id}/pasar-a-cotizacion`, { method: "POST", body: JSON.stringify({ cliente_id: clienteId, contacto_id: contactoId ?? null }) }),
    delete: (id: number) => request<void>(`/importaciones/${id}`, { method: "DELETE" }),
  },
  config: {
    get: () => request<any>("/config/"),
    update: (data: any) => request<any>("/config/", { method: "PUT", body: JSON.stringify(data) }),
  },
  divisas: {
    cambio: () => request<{ monedas: Record<string, number> }>("/divisas/cambio"),
  },
  ordenesCompra: {
    list: () => request<any[]>("/ordenes-compra/"),
    get: (id: number) => request<any>(`/ordenes-compra/${id}`),
    create: (data: any) => request<any>("/ordenes-compra/", { method: "POST", body: JSON.stringify(data) }),
    changeEstado: (id: number, estado: string) => request<any>(`/ordenes-compra/${id}/estado?estado=${estado}`, { method: "PATCH" }),
    pdfData: (id: number) => request<any>(`/ordenes-compra/${id}/pdf-data`),
  },
  upload: {
    image: async (file: File): Promise<{ url: string; filename: string }> => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${BASE}/upload/`, { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Error subiendo imagen");
      }
      return res.json();
    },
  },
};

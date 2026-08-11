export const API_BASE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1')
  : (process.env.INTERNAL_API_URL || 'http://backend:8000/api/v1');

export interface ScraperJob {
  id: string;
  sucursal_id: number | null;
  estado: string;
  total_scrapeados: number;
  total_errores: number;
  mensaje_error: string | null;
  iniciado_en: string;
  finalizado_en: string | null;
  sucursal?: {
    id: number;
    codigo_sucursal: string;
    nombre: string;
    provincia: string;
  };
}

export interface Sucursal {
  id: number;
  codigo_sucursal: string;
  nombre: string;
  provincia: string;
  creado_en: string;
}

export interface Producto {
  id: number;
  sku: string;
  titulo: string;
  marca: string | null;
  imagen_url: string | null;
  unidad_medida: string | null;
  precio_actual_lista: number | null;
  precio_actual_oferta: number | null;
  sucursal_nombre?: string;
}

export async function fetchJobs(): Promise<ScraperJob[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/scraper/jobs`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error cargando jobs:', err);
    return [];
  }
}

export async function fetchSucursales(): Promise<Sucursal[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sucursales`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error cargando sucursales:', err);
    return [];
  }
}

export async function triggerScraper(sucursal: string, limite_productos: number = 30): Promise<ScraperJob | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/scraper/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sucursal, limite_productos })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error lanzando scraper:', err);
    return null;
  }
}

export async function fetchProductosAdmin(): Promise<Producto[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products?limit=100`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error cargando productos admin:', err);
    return [];
  }
}

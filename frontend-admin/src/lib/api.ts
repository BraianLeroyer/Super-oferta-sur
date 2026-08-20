const rawApiUrl = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || process.env.PUBLIC_API_URL || 'http://localhost:8000/api/v1')
  : (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000/api/v1');

export const API_BASE_URL = rawApiUrl.trim().replace(/\/+$/, '');

export interface Comercio {
  id: number;
  nombre: string;
  slug: string;
  tipo: string;
  base_url?: string | null;
  scraping_modo?: string;
  color?: string | null;
  habilitado: boolean;
  creado_en: string;
}

export interface ScraperJob {
  id: string;
  comercio_id: number | null;
  sucursal_id: number | null;
  estado: string;
  total_scrapeados: number;
  total_errores: number;
  mensaje_error: string | null;
  iniciado_en: string;
  finalizado_en: string | null;
  comercio?: {
    id: number;
    nombre: string;
    slug: string;
    tipo: string;
  };
  sucursal?: {
    id: number;
    codigo_sucursal: string;
    nombre: string;
    provincia: string;
    tipo_sucursal?: string;
  };
}

export interface Sucursal {
  id: number;
  comercio_id?: number | null;
  codigo_sucursal: string;
  nombre: string;
  provincia: string;
  tipo_sucursal?: string;
  creado_en: string;
}

export interface Producto {
  id: number;
  sku: string;
  titulo: string;
  marca: string | null;
  descripcion: string | null;
  imagen_url: string | null;
  unidad_medida: string | null;
  url_producto?: string | null;
  categoria?: string | null;
  comercio_id?: number | null;
  comercio_nombre?: string | null;
  precio_actual_lista: number | null;
  precio_actual_oferta: number | null;
  precio_bulto: number | null;
  descripcion_bulto: string | null;
  sucursal_nombre?: string;
  tipo_sucursal?: string;
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

export async function fetchComercios(): Promise<Comercio[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/comercios`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error cargando comercios:', err);
    return [];
  }
}

export async function fetchSucursales(comercio_id?: number): Promise<Sucursal[]> {
  try {
    const query = new URLSearchParams();
    if (comercio_id) query.set('comercio_id', comercio_id.toString());
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/sucursales${suffix}`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error cargando sucursales:', err);
    return [];
  }
}

export async function triggerScraper(
  comercio: string,
  sucursal: string,
  limite_productos: number = 50,
  precio_maximo?: number | null
): Promise<ScraperJob | null> {
  try {
    const body: Record<string, unknown> = { comercio, sucursal, limite_productos };
    if (precio_maximo != null && precio_maximo > 0) {
      body.precio_maximo = precio_maximo;
    }
    const res = await fetch(`${API_BASE_URL}/scraper/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error lanzando scraper:', err);
    return null;
  }
}

export async function fetchProductosAdmin(comercio_id?: number): Promise<Producto[]> {
  try {
    const all: Producto[] = [];
    let page = 1;
    const pageSize = 500;
    while (true) {
      const query = new URLSearchParams({ page: page.toString(), limit: pageSize.toString() });
      if (comercio_id) query.set('comercio_id', comercio_id.toString());
      const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`, { cache: 'no-store' });
      if (!res.ok) break;
      const batch = await res.json();
      all.push(...batch);
      if (batch.length < pageSize) break;
      page += 1;
    }
    return all;
  } catch (err) {
    console.error('Error cargando productos admin:', err);
    return [];
  }
}

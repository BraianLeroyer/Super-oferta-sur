export const API_BASE_URL = typeof window !== 'undefined'
  ? (process.env.PUBLIC_API_URL || 'http://localhost:8000/api/v1')
  : (process.env.INTERNAL_API_URL || 'http://backend:8000/api/v1');

export interface Sucursal {
  id: number;
  codigo_sucursal: string;
  nombre: string;
  provincia: string;
  creado_en: string;
}

export interface PrecioHistorial {
  id: number;
  producto_id: number;
  sucursal_id: number;
  precio_lista: number;
  precio_oferta: number | null;
  es_oferta_club: boolean;
  disponible: boolean;
  fecha_captura: string;
  sucursal?: Sucursal;
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
  creado_en: string;
  actualizado_en: string;
  precio_actual_lista: number | null;
  precio_actual_oferta: number | null;
  es_oferta_club: boolean;
  disponible: boolean;
  sucursal_nombre?: string;
  historial_precios?: PrecioHistorial[];
}

export async function fetchSucursales(): Promise<Sucursal[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sucursales`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error cargando sucursales:', err);
    return [];
  }
}

export async function fetchProductos(params: {
  search?: string;
  marca?: string;
  categoria?: string;
  min_price?: number;
  max_price?: number;
  sucursal_id?: number;
  sucursal?: string;
  page?: number;
  limit?: number;
}): Promise<Producto[]> {
  try {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.marca) query.set('marca', params.marca);
    if (params.categoria) query.set('categoria', params.categoria);
    if (params.min_price) query.set('min_price', params.min_price.toString());
    if (params.max_price) query.set('max_price', params.max_price.toString());
    if (params.sucursal_id) query.set('sucursal_id', params.sucursal_id.toString());
    if (params.sucursal) query.set('sucursal', params.sucursal);
    if (params.page) query.set('page', params.page.toString());
    query.set('limit', (params.limit || 100).toString());

    const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error cargando productos:', err);
    return [];
  }
}

const PAGE_SIZE = 500;

export async function fetchAllProductos(params: {
  search?: string;
  marca?: string;
  categoria?: string;
  min_price?: number;
  max_price?: number;
  sucursal_id?: number;
  sucursal?: string;
}, maxItems: number = 25000): Promise<Producto[]> {
  // Páginas en PARALELO (Promise.all) para no esperar 33 roundtrips secuenciales.
  // Se piden hasta ceil(maxItems/PAGE_SIZE) páginas; las que no existen devuelven [].
  const maxPages = Math.ceil(maxItems / PAGE_SIZE);
  const batches = await Promise.all(
    Array.from({ length: maxPages }, (_, i) =>
      fetchProductos({ ...params, page: i + 1, limit: PAGE_SIZE })
    )
  );
  return batches.flat().slice(0, maxItems);
}

export async function fetchCategorias(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/categories`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error cargando categorías:', err);
    return [];
  }
}

export async function fetchSuggestions(
  q: string,
  sucursal_id?: number,
  limit: number = 8
): Promise<Producto[]> {
  try {
    const query = new URLSearchParams();
    query.set('q', q);
    query.set('limit', limit.toString());
    if (sucursal_id) query.set('sucursal_id', sucursal_id.toString());
    const res = await fetch(`${API_BASE_URL}/products/suggestions?${query.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error cargando sugerencias:', err);
    return [];
  }
}

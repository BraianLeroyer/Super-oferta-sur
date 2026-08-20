const rawApiUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.PUBLIC_API_URL || import.meta.env.NEXT_PUBLIC_API_URL)) ||
  (typeof process !== 'undefined' && process.env && (process.env.PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.INTERNAL_API_URL)) ||
  'http://localhost:8000/api/v1';

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

export interface Sucursal {
  id: number;
  comercio_id?: number | null;
  codigo_sucursal: string;
  nombre: string;
  provincia: string;
  tipo_sucursal?: string;
  creado_en: string;
}

export interface PrecioHistorial {
  id: number;
  producto_id: number;
  sucursal_id: number;
  precio_lista: number;
  precio_oferta: number | null;
  precio_bulto: number | null;
  descripcion_bulto: string | null;
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
  comercio_id?: number | null;
  comercio_nombre?: string | null;
  creado_en: string;
  actualizado_en: string;
  precio_actual_lista: number | null;
  precio_actual_oferta: number | null;
  precio_bulto: number | null;
  descripcion_bulto: string | null;
  es_oferta_club: boolean;
  disponible: boolean;
  sucursal_nombre?: string;
  tipo_sucursal?: string;
  es_oferta_semanal?: boolean;
  historial_precios?: PrecioHistorial[];
}

export interface ComercioComparacion {
  comercio: Comercio;
  productos: Producto[];
}

export interface ComparacionItem {
  producto_id: number;
  sku: string;
  titulo: string;
  marca: string | null;
  imagen_url: string | null;
  unidad_medida: string | null;
  precio_lista: number | null;
  precio_oferta: number | null;
  disponible: boolean;
}

export interface ComparacionOriginal {
  producto_id: number;
  titulo: string;
  marca: string | null;
  imagen_url: string | null;
  unidad_medida: string | null;
  comercio_nombre: string;
  precio_lista: number | null;
  precio_oferta: number | null;
}

export interface ComparacionComercio {
  comercio_nombre: string;
  comercio_slug: string;
  comercio_color: string | null;
  mejor_precio: number;
  productos: ComparacionItem[];
}

export interface ComparacionResponse {
  producto_original: ComparacionOriginal;
  comercios: ComparacionComercio[];
}

export async function fetchComercios(): Promise<Comercio[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/comercios`);
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
    const res = await fetch(`${API_BASE_URL}/sucursales${suffix}`);
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
  comercio_id?: number;
  comercio?: string;
  bulto_cerrado?: boolean;
  oferta_semanal?: boolean;
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
    if (params.comercio_id) query.set('comercio_id', params.comercio_id.toString());
    if (params.comercio) query.set('comercio', params.comercio);
    if (params.bulto_cerrado) query.set('bulto_cerrado', 'true');
    if (params.oferta_semanal) query.set('oferta_semanal', 'true');
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
  comercio_id?: number;
  comercio?: string;
  bulto_cerrado?: boolean;
  oferta_semanal?: boolean;
}, maxItems: number = 25000): Promise<Producto[]> {
  // Páginas en PARALELO (Promise.all) para no esperar roundtrips secuenciales.
  // Se piden hasta ceil(maxItems/PAGE_SIZE) páginas; las que no existen devuelven [].
  const maxPages = Math.ceil(maxItems / PAGE_SIZE);
  const batches = await Promise.all(
    Array.from({ length: maxPages }, (_, i) =>
      fetchProductos({ ...params, page: i + 1, limit: PAGE_SIZE })
    )
  );
  return batches.flat().slice(0, maxItems);
}

export async function fetchCategorias(comercio_id?: number): Promise<string[]> {
  try {
    const query = new URLSearchParams();
    if (comercio_id) query.set('comercio_id', comercio_id.toString());
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/products/categories${suffix}`);
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
  comercio_id?: number,
  limit: number = 8
): Promise<Producto[]> {
  try {
    const query = new URLSearchParams();
    query.set('q', q);
    query.set('limit', limit.toString());
    if (sucursal_id) query.set('sucursal_id', sucursal_id.toString());
    if (comercio_id) query.set('comercio_id', comercio_id.toString());
    const res = await fetch(`${API_BASE_URL}/products/suggestions?${query.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error cargando sugerencias:', err);
    return [];
  }
}

export async function fetchComparar(
  q: string,
  limitePorComercio: number = 5
): Promise<ComercioComparacion[]> {
  try {
    const query = new URLSearchParams();
    query.set('q', q);
    query.set('limite_por_comercio', limitePorComercio.toString());
    const res = await fetch(`${API_BASE_URL}/comparison?${query.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error comparando precios:', err);
    return [];
  }
}

export async function fetchCompararPorProducto(productId: number): Promise<ComparacionResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/compare-prices`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error comparando precios del producto:', err);
    return null;
  }
}

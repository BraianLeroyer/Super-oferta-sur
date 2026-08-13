import React, { useEffect, useRef, useState } from 'react';
import Header from './Header';
import ProductCard from './ProductCard';
import { fetchSucursales, fetchAllProductos, fetchCategorias } from '../lib/api';
import { Filter, Search, Loader2, Sparkles, AlertCircle, ChevronDown } from 'lucide-react';

const PAGE_INCREMENT = 60;

export default function ProductCatalogApp() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_INCREMENT);
  const searchSeqRef = useRef(0);

  // Cargar sucursales iniciales
  useEffect(() => {
    fetchSucursales()
      .then((data) => {
        setBranches(data);
        if (data.length > 0) {
          // Seleccionar Trelew o la primera sucursal por defecto
          const defaultBranch = data.find(b => b.nombre.toLowerCase().includes('trelew')) || data[0];
          setSelectedBranch(defaultBranch);
        }
      })
      .catch(console.error);

    fetchCategorias().then(setCategorias).catch(console.error);
  }, []);

  // Debounce del buscador (300ms) para no disparar un request por tecla
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Cargar productos al cambiar filtros o sucursal
  useEffect(() => {
    const seq = ++searchSeqRef.current;
    setLoading(true);
    const params = {
      search: debouncedSearch || undefined,
      sucursal_id: selectedBranch ? selectedBranch.id : undefined,
      categoria: selectedCategoria || undefined
    };

    fetchAllProductos(params)
      .then((data) => {
        // Ignorar respuestas obsoletas (race condition entre requests)
        if (seq !== searchSeqRef.current) return;
        let filtered = data;
        if (onlyOffers) {
          filtered = data.filter(p => Boolean(p.precio_actual_oferta));
        }
        setProducts(filtered);
        setVisibleCount(PAGE_INCREMENT);
        setLoading(false);
      })
      .catch((err) => {
        if (seq !== searchSeqRef.current) return;
        console.error(err);
        setLoading(false);
      });
  }, [selectedBranch, debouncedSearch, onlyOffers, selectedCategoria]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header React Island */}
      <Header
        selectedBranch={selectedBranch}
        branches={branches}
        onSelectBranch={setSelectedBranch}
      />

      {/* Hero / Filter Bar */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Banner Informativo de Sucursal */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-anonima-darkred rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-red-200">
              <Sparkles className="w-3.5 h-3.5" />
              Extracción por Sucursal en Tiempo Real
            </span>
            <h2 className="text-2xl font-black tracking-tight">
              Precios en {selectedBranch ? selectedBranch.nombre : 'Todas las Sucursales'}
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Comparativa de precios de lista, precios de oferta y Club La Anónima. Monitoreo diario por ubicación geográfica en Chubut y Patagonia.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-white">{products.length}</div>
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Productos Activos</div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div>
              <div className="text-2xl font-black text-red-300">
                {products.filter(p => Boolean(p.precio_actual_oferta)).length}
              </div>
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">En Oferta</div>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-lg">
              <Filter className="w-4 h-4 text-anonima-red" />
              Filtros:
            </div>

            <button
              onClick={() => setOnlyOffers(!onlyOffers)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                onlyOffers
                  ? 'bg-anonima-red text-white border-anonima-red shadow'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              🔥 Solo Ofertas
            </button>

            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-anonima-red max-w-[220px]"
            >
              <option value="">Todas las Categorías</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar Grande (filtra por nombre de producto) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
            <Search className="w-4 h-4 text-anonima-red" />
            Buscar producto por nombre
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Escribí el nombre del producto que buscás (ej: leche, iphone, vino tinto)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 text-base bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-anonima-red focus:border-transparent transition-all"
            />
          </div>
          {searchQuery && (
            <div className="mt-2 text-xs font-semibold text-slate-500">
              {products.length} resultado{products.length === 1 ? '' : 's'} para «{searchQuery}»
            </div>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-anonima-red" />
            <span className="text-xs font-bold text-slate-500">Consultando catálogo de precios...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center gap-3 max-w-md mx-auto my-12">
            <AlertCircle className="w-12 h-12 text-slate-300" />
            <h3 className="font-extrabold text-slate-800 text-lg">No se encontraron productos</h3>
            <p className="text-xs text-slate-500">
              {onlyOffers && debouncedSearch
                ? `No hay ofertas que coincidan con «${debouncedSearch}» en la sucursal seleccionada. Probá desactivar el filtro "Solo Ofertas" para ver todos los resultados.`
                : onlyOffers
                  ? 'No hay productos en oferta que coincidan con los filtros aplicados. Probá desactivar el filtro "Solo Ofertas".'
                  : 'No hay coincidencias para los filtros aplicados en la sucursal seleccionada. Prueba cambiando la sucursal o limpiando el buscador.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-semibold flex-wrap">
              <span>
                Mostrando {Math.min(visibleCount, products.length)} de {products.length} productos
              </span>
              {visibleCount < products.length && (
                <span className="text-anonima-red">{products.length - visibleCount} sin mostrar</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.slice(0, visibleCount).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
            {visibleCount < products.length && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setVisibleCount(v => v + PAGE_INCREMENT)}
                  className="flex items-center gap-2 px-6 py-3 bg-anonima-red hover:bg-anonima-darkred text-white text-sm font-bold rounded-xl shadow transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                  Cargar más ({Math.min(PAGE_INCREMENT, products.length - visibleCount)})
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import Header from './Header';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import { fetchComercios, fetchSucursales, fetchAllProductos, fetchCategorias, fetchSuggestions } from '../lib/api';
import { Filter, Search, Loader2, Sparkles, AlertCircle, ChevronDown, ShieldCheck, ShoppingCart } from 'lucide-react';

const PAGE_INCREMENT = 60;

export default function ProductCatalogApp() {
  const [comercios, setComercios] = useState([]);
  const [selectedComercio, setSelectedComercio] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [onlyBulto, setOnlyBulto] = useState(false);
  const [ofertaSemanal, setOfertaSemanal] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_INCREMENT);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchSeqRef = useRef(0);
  const suggestionSeqRef = useRef(0);
  const branchSeqRef = useRef(0);
  const searchBoxRef = useRef(null);

  // Cargar comercios iniciales (default: La Anónima)
  useEffect(() => {
    fetchComercios()
      .then((data) => {
        const filtered = data.filter(c => c.slug !== 'diarco');
        setComercios(filtered);
        const def = filtered.find(c => c.slug === 'la-anonima') || filtered[0] || null;
        setSelectedComercio(def);
      })
      .catch(console.error);
  }, []);

  // Al cambiar de comercio, cargar sus sucursales + categorías y resetear filtros
  useEffect(() => {
    if (!selectedComercio) return;
    const seq = ++branchSeqRef.current;
    setSelectedBranch(null);
    setBranches([]);
    setProducts([]);
    setSelectedCategoria('');
    setSearchQuery('');
    setDebouncedSearch('');
    setOnlyBulto(false);
    setOfertaSemanal(false);
    setVisibleCount(PAGE_INCREMENT);
    setLoading(true);

    fetchSucursales(selectedComercio.id)
      .then((data) => {
        if (seq !== branchSeqRef.current) return;
        setBranches(data);
        setSelectedBranch(data[0] || null);
      })
      .catch(console.error);
    fetchCategorias(selectedComercio.id).then(setCategorias).catch(console.error);
  }, [selectedComercio]);

  // Debounce del buscador (300ms) para no disparar un request por tecla
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Sugerencias de Almacén mientras se tipea (debounce 250ms, mínimo 2 caracteres)
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      suggestionSeqRef.current++;
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }
    const t = setTimeout(() => {
      const seq = ++suggestionSeqRef.current;
      setSuggestionsLoading(true);
      fetchSuggestions(query, selectedBranch ? selectedBranch.id : undefined, selectedComercio ? selectedComercio.id : undefined, 8)
        .then((data) => {
          if (seq !== suggestionSeqRef.current) return;
          setSuggestions(data);
          setShowSuggestions(true);
        })
        .catch((err) => {
          if (seq !== suggestionSeqRef.current) return;
          console.error(err);
        })
        .finally(() => {
          if (seq === suggestionSeqRef.current) setSuggestionsLoading(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery, selectedBranch, selectedComercio]);

  // Cerrar dropdown al hacer clic fuera o presionar Escape
  useEffect(() => {
    const onDown = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setShowSuggestions(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Cargar productos al cambiar comercio, sucursal o filtros
  useEffect(() => {
    const seq = ++searchSeqRef.current;
    setLoading(true);
    const params = {
      search: debouncedSearch || undefined,
      sucursal_id: selectedBranch ? selectedBranch.id : undefined,
      comercio_id: selectedComercio ? selectedComercio.id : undefined,
      categoria: selectedCategoria || undefined,
      bulto_cerrado: onlyBulto || undefined,
      oferta_semanal: ofertaSemanal || undefined,
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
  }, [selectedComercio, selectedBranch, debouncedSearch, onlyOffers, onlyBulto, ofertaSemanal, selectedCategoria]);

  const selectSuggestion = (product) => {
    suggestionSeqRef.current++;
    setSearchQuery(product.titulo);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedCategoria('');
  };

  const handleSearchSubmit = () => {
    suggestionSeqRef.current++;
    setShowSuggestions(false);
    setDebouncedSearch(searchQuery);
  };

  const comercioNombre = selectedComercio ? selectedComercio.nombre : 'todas las cadenas';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header React Island */}
      <Header
        comercios={comercios}
        selectedComercio={selectedComercio}
        onSelectComercio={setSelectedComercio}
        selectedBranch={selectedBranch}
        branches={branches}
        onSelectBranch={setSelectedBranch}
      />

      {/* Hero / Filter Bar */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Banner Informativo de Comercio/Sucursal */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-anonima-darkred rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-red-200">
              <Sparkles className="w-3.5 h-3.5" />
              {selectedComercio ? `${selectedComercio.nombre} — ${selectedComercio.tipo}` : 'Extracción Multi-Mercado'}
            </span>
            <h2 className="text-2xl font-black tracking-tight">
              Precios en {selectedComercio ? selectedComercio.nombre : 'todas las cadenas'}
              {selectedBranch ? ` · ${selectedBranch.nombre}` : ''}
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Comparativa de precios de lista y ofertas entre cadenas (La Anónima, Carrefour, Jumbo, Vea,
              Mas Online, Diarco, Yaguar). Hacé clic en un producto para ver sus detalles.
            </p>
            {onlyOffers && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-red-300">
                <ShieldCheck className="w-4 h-4" />
                Mostrando solo productos con oferta activa.
              </p>
            )}
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

            <button
              onClick={() => setOnlyBulto(!onlyBulto)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                onlyBulto
                  ? 'bg-amber-500 text-white border-amber-500 shadow'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              📦 Solo Bulto Cerrado
            </button>

            {selectedComercio?.slug === 'yaguar' && (
              <button
                onClick={() => setOfertaSemanal(!ofertaSemanal)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                  ofertaSemanal
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🏷️ Oferta Semanal
              </button>
            )}

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
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
            <Search className="w-4 h-4 text-anonima-red" />
            Buscar producto por nombre
          </label>
          <div ref={searchBoxRef} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Escribí el nombre del producto que buscás (ej: leche, iphone, vino tinto)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
              className="w-full pl-11 pr-14 py-3 sm:py-3.5 text-sm sm:text-base bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-anonima-red focus:border-transparent transition-all"
            />

            <button
              type="button"
              onClick={handleSearchSubmit}
              aria-label="Buscar"
              title="Buscar"
              className="absolute inset-y-0 right-1.5 my-auto w-9 h-9 flex items-center justify-center rounded-lg bg-anonima-red text-white hover:bg-darkred active:scale-95 transition-all shadow-sm"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Sugerencias de Almacén (autocompletado) */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-anonima-red" />
                  Sugerencias {selectedComercio ? `de ${selectedComercio.nombre}` : ''}
                </div>
                <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {suggestions.map((p) => {
                    const priceOffer = Number(p.precio_actual_oferta || 0);
                    const priceList = Number(p.precio_actual_lista || 0);
                    const showOffer = Boolean(p.precio_actual_oferta);
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => selectSuggestion(p)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors"
                        >
                          <img
                            src={p.imagen_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'}
                            alt={p.titulo}
                            loading="lazy"
                            className="w-10 h-10 object-contain shrink-0 bg-slate-50 rounded-lg border border-slate-100 p-1 mix-blend-multiply"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80';
                            }}
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-bold text-slate-800 truncate">
                              {p.titulo}
                            </span>
                            <span className="block text-xs text-slate-500 truncate">
                              {p.marca ? p.marca.toUpperCase() : selectedComercio ? selectedComercio.nombre.toUpperCase() : ''}
                              {p.unidad_medida ? ` • ${p.unidad_medida}` : ''}
                            </span>
                          </span>
                          <span className={`text-sm font-extrabold shrink-0 ${showOffer ? 'text-anonima-red' : 'text-slate-900'}`}>
                            ${(showOffer ? priceOffer : priceList).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {suggestionsLoading && (
              <div className="absolute inset-y-0 right-14 flex items-center pointer-events-none">
                <Loader2 className="w-4 h-4 animate-spin text-anonima-red" />
              </div>
            )}
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
        ) : products.length === 0 && onlyBulto && selectedComercio?.slug !== 'yaguar' ? (
          <div className="bg-amber-50 rounded-2xl p-12 text-center border-2 border-amber-200 shadow-sm flex flex-col items-center gap-3 max-w-md mx-auto my-12">
            <ShoppingCart className="w-12 h-12 text-amber-500" />
            <h3 className="font-extrabold text-amber-900 text-lg">Precios por Bulto Cerrado</h3>
            <p className="text-sm text-amber-700">
              Los precios por bulto cerrado son exclusivos de comercios <strong>mayoristas</strong>.
            </p>
            <p className="text-xs text-amber-600">
              Encontrá productos por bulto en <strong>Yaguar</strong> para ver precios mayoristas.
            </p>
            <button
              onClick={() => {
                const yaguar = comercios.find(c => c.slug === 'yaguar');
                if (yaguar) {
                  setSelectedComercio(yaguar);
                  setOnlyBulto(true);
                }
              }}
              className="mt-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition-colors shadow"
            >
              Ir a Yaguar
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center gap-3 max-w-md mx-auto my-12">
            <AlertCircle className="w-12 h-12 text-slate-300" />
            <h3 className="font-extrabold text-slate-800 text-lg">No se encontraron productos</h3>
            <p className="text-xs text-slate-500">
              {!selectedComercio
                ? 'Seleccioná un comercio en la barra superior para comenzar.'
                : onlyOffers && debouncedSearch
                  ? `No hay ofertas que coincidan con «${debouncedSearch}» en ${comercioNombre}. Probá desactivar el filtro "Solo Ofertas" para ver todos los resultados.`
                  : onlyOffers
                    ? `No hay productos en oferta que coincidan con los filtros en ${comercioNombre}. Probá desactivar el filtro "Solo Ofertas".`
                    : debouncedSearch
                      ? `No hay coincidencias para «${debouncedSearch}» en ${comercioNombre}. Probá limpiando el buscador o cambiando de sucursal.`
                      : `Este comercio aún no tiene catálogo cargado. Lanzá el scraper de ${comercioNombre} desde el Panel de Administración (http://localhost:3000) para poblar sus precios.`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {products.slice(0, visibleCount).map((product) => (
                <ProductCard
                  key={`${product.comercio_id || ''}-${product.id}`}
                  product={product}
                  onSelect={setSelectedProduct}
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

      {/* Modal de detalle con view transition */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

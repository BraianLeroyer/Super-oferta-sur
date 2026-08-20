import React, { useEffect, useRef, useState } from 'react';
import Header from './Header';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import ComparisonModal from './ComparisonModal';
import ShoppingListChat from './ShoppingListChat';
import { fetchComercios, fetchSucursales, fetchAllProductos, fetchCategorias, fetchSuggestions, fetchCompararPorProducto } from '../lib/api';
import { Filter, Search, Loader2, Sparkles, AlertCircle, ChevronDown, ShieldCheck, ShoppingCart, X } from 'lucide-react';

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
  const [showCatModal, setShowCatModal] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState('');
  const [comparingProduct, setComparingProduct] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Shopping list (persisted in localStorage)
  const [shoppingList, setShoppingList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ofertas-sur-list') || '[]'); }
    catch { return []; }
  });
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('ofertas-sur-list', JSON.stringify(shoppingList));
  }, [shoppingList]);

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
    setCatSearchQuery('');
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

  // Cerrar el dropdown de sugerencias al hacer clic fuera o presionar Escape
  useEffect(() => {
    const onDown = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setShowCatModal(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Bloquear scroll del fondo mientras el modal de categorías está abierto
  useEffect(() => {
    if (!showCatModal) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCatModal]);

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
      oferta_semanal: (ofertaSemanal && !onlyOffers) ? true : undefined,
    };

    fetchAllProductos(params)
      .then((data) => {
        // Ignorar respuestas obsoletas (race condition entre requests)
        if (seq !== searchSeqRef.current) return;
        // Filtrar productos con al menos un precio válido (> 0)
        let filtered = data.filter(p => {
          const list = Number(p.precio_actual_lista || 0);
          const offer = Number(p.precio_actual_oferta || 0);
          const bulto = Number(p.precio_bulto || 0);
          return list > 0 || offer > 0 || bulto > 0;
        });

        if (onlyOffers && ofertaSemanal) {
          // Ambos activos: mostrar productos que tengan oferta regular O sean oferta semanal
          filtered = filtered.filter(p => (Boolean(p.precio_actual_oferta) && Number(p.precio_actual_oferta) > 0) || p.es_oferta_semanal);
        } else if (onlyOffers) {
          // Solo ofertas regulares con precio > 0
          filtered = filtered.filter(p => Boolean(p.precio_actual_oferta) && Number(p.precio_actual_oferta) > 0);
        } else if (ofertaSemanal) {
          // Solo oferta semanal
          filtered = filtered.filter(p => p.es_oferta_semanal);
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

  const handleCompare = (product) => {
    setComparingProduct(product);
    setComparisonLoading(true);
    setComparisonData(null);
    fetchCompararPorProducto(product.id)
      .then((data) => setComparisonData(data))
      .catch((err) => console.error(err))
      .finally(() => setComparisonLoading(false));
  };

  const addToList = (product) => {
    const exists = shoppingList.some(item => item.id === product.id);
    if (exists) {
      setShoppingList(prev => prev.filter(item => item.id !== product.id));
    } else {
      const precio = Number(product.precio_actual_oferta || product.precio_actual_lista || product.precio_bulto || 0);
      setShoppingList(prev => [...prev, {
        id: product.id,
        sku: product.sku,
        titulo: product.titulo,
        marca: product.marca || product.comercio_nombre || '',
        precio,
        comercio_nombre: product.comercio_nombre || '',
      }]);
    }
  };

  const removeFromList = (productId) => {
    setShoppingList(prev => prev.filter(item => item.id !== productId));
  };

  const clearList = () => {
    setShoppingList([]);
  };

  const comercioNombre = selectedComercio ? selectedComercio.nombre : 'todas las cadenas';

  const filteredCategorias = catSearchQuery.trim()
    ? categorias.filter((c) => c.toLowerCase().includes(catSearchQuery.trim().toLowerCase()))
    : categorias;

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
      <main className="flex-grow max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 w-full space-y-4 sm:space-y-6">
        {/* Banner Informativo de Comercio/Sucursal */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-anonima-darkred rounded-2xl p-4 sm:p-6 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-bold text-red-200">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {selectedComercio ? `${selectedComercio.nombre} — ${selectedComercio.tipo}` : 'Extracción Multi-Mercado'}
              </span>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight">
                Precios en {selectedComercio ? selectedComercio.nombre : 'todas las cadenas'}
                {selectedBranch ? ` · ${selectedBranch.nombre}` : ''}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-300 max-w-xl hidden sm:block">
                Comparativa de precios de lista y ofertas entre cadenas (La Anónima, Carrefour, Jumbo, Vea,
                Mas Online, Yaguar). Hacé clic en un producto para ver sus detalles.
              </p>
              {onlyOffers && ofertaSemanal ? (
                <p className="mt-1 sm:mt-2 inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Mostrando ofertas generales y ofertas semanales activas.
                </p>
              ) : onlyOffers ? (
                <p className="mt-1 sm:mt-2 inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-red-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Mostrando solo productos con oferta activa.
                </p>
              ) : ofertaSemanal ? (
                <p className="mt-1 sm:mt-2 inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Mostrando solo productos de la Oferta Semanal.
                </p>
              ) : null}
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 text-center shrink-0">
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">{products.length}</div>
                <div className="text-[9px] sm:text-[10px] text-slate-300 font-bold uppercase tracking-wider">Activos</div>
              </div>
              <div className="h-6 sm:h-8 w-px bg-white/20"></div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-red-300">
                  {products.filter(p => Boolean(p.precio_actual_oferta) || p.es_oferta_semanal).length}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-300 font-bold uppercase tracking-wider">Ofertas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg">
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-anonima-red" />
              Filtros
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setOnlyOffers(!onlyOffers)}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all border ${
                onlyOffers
                  ? 'bg-anonima-red text-white border-anonima-red shadow'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              🔥 Solo Ofertas
            </button>

            <button
              onClick={() => setOnlyBulto(!onlyBulto)}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all border ${
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
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all border ${
                  ofertaSemanal
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🏷️ Oferta Semanal
              </button>
            )}

            {/* Categoría chip (abre modal) */}
            <button
              onClick={() => setShowCatModal(true)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all border ${
                selectedCategoria
                  ? 'bg-purple-600 text-white border-purple-600 shadow'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {selectedCategoria ? (
                <span className="truncate max-w-[100px] sm:max-w-[160px]">📁 {selectedCategoria.split(' > ').pop()}</span>
              ) : (
                '📁 Categoría'
              )}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Search Bar Grande (filtra por nombre de producto) */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm">
          <label className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-slate-700 mb-2">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-anonima-red" />
            Buscar producto por nombre
          </label>
          <div ref={searchBoxRef} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
              type="text"
              placeholder="Escribí el nombre del producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
              className="w-full pl-9 sm:pl-11 pr-12 sm:pr-14 py-2.5 sm:py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-anonima-red focus:border-transparent transition-all"
            />

            <button
              type="button"
              onClick={handleSearchSubmit}
              aria-label="Buscar"
              title="Buscar"
              className="absolute inset-y-0 right-1.5 my-auto w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-anonima-red text-white hover:bg-darkred active:scale-95 transition-all shadow-sm"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
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
                    const priceBulto = Number(p.precio_bulto || 0);
                    const showOffer = Boolean(p.precio_actual_oferta) && priceOffer > 0;
                    const displayPrice = showOffer ? priceOffer : priceList > 0 ? priceList : priceBulto;
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
                          {displayPrice > 0 ? (
                            <span className={`text-sm font-extrabold shrink-0 ${showOffer ? 'text-anonima-red' : 'text-slate-900'}`}>
                              ${displayPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400 shrink-0">
                              Consultar
                            </span>
                          )}
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
                : onlyOffers && ofertaSemanal && debouncedSearch
                  ? `No hay ofertas ni ofertas semanales que coincidan con «${debouncedSearch}» en ${comercioNombre}. Probá desactivando los filtros.`
                  : onlyOffers && ofertaSemanal
                    ? `No hay ofertas ni ofertas semanales activas con los filtros actuales en ${comercioNombre}.`
                  : ofertaSemanal && debouncedSearch
                    ? `No hay productos de oferta semanal que coincidan con «${debouncedSearch}» en ${comercioNombre}.`
                  : ofertaSemanal
                    ? `No hay productos de oferta semanal activos en este momento en ${comercioNombre}.`
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
            <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-500 font-semibold flex-wrap">
              <span>
                Mostrando {Math.min(visibleCount, products.length)} de {products.length} productos
              </span>
              {visibleCount < products.length && (
                <span className="text-anonima-red">{products.length - visibleCount} sin mostrar</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {products.slice(0, visibleCount).map((product) => (
                <ProductCard
                  key={`${product.comercio_id || ''}-${product.id}`}
                  product={product}
                  onSelect={setSelectedProduct}
                  onCompare={handleCompare}
                  onAddToList={addToList}
                  isInList={shoppingList.some(item => item.id === product.id)}
                />
              ))}
            </div>
            {visibleCount < products.length && (
              <div className="flex justify-center pt-3 sm:pt-4">
                <button
                  onClick={() => setVisibleCount(v => v + PAGE_INCREMENT)}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-anonima-red hover:bg-anonima-darkred text-white text-xs sm:text-sm font-bold rounded-xl shadow transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                  Cargar más ({Math.min(PAGE_INCREMENT, products.length - visibleCount)})
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de Categorías Fullscreen */}
      {showCatModal && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-slate-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Header blur con botón Salir */}
          <div className="sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg shrink-0 shadow-inner">
                📁
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-slate-900 text-base sm:text-lg truncate">
                  Categorías
                </h3>
                <p className="text-xs font-semibold text-slate-500 truncate">
                  {selectedComercio?.nombre || 'Todos los comercios'} · {categorias.length} categorías disponibles
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCatModal(false)}
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900/90 hover:bg-slate-900 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shrink-0"
              aria-label="Cerrar modal de categorías"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              Salir
            </button>
          </div>

          {/* Contenido Fullscreen con buscador y grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
              {/* Barra de herramientas / buscador interno */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por nombre de categoría..."
                    value={catSearchQuery}
                    onChange={(e) => setCatSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-9 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                  />
                  {catSearchQuery && (
                    <button
                      onClick={() => setCatSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedCategoria('');
                    setShowCatModal(false);
                  }}
                  className={`px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border shadow-sm shrink-0 ${
                    !selectedCategoria
                      ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  🗂️ Ver Todas las Categorías
                </button>
              </div>

              {/* Grid de Categorías en pantalla completa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredCategorias.map((cat) => {
                  const isSelected = selectedCategoria === cat;
                  const parts = cat.split(' > ');
                  const lastPart = parts[parts.length - 1];
                  const parentPath = parts.slice(0, -1).join(' > ');

                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategoria(cat);
                        setShowCatModal(false);
                      }}
                      className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between group min-h-[90px] ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300 scale-[1.01]'
                          : 'bg-white hover:bg-purple-50/50 text-slate-800 border-slate-200/80 hover:border-purple-300 hover:shadow-sm'
                      }`}
                    >
                      <div>
                        {parentPath && (
                          <span
                            className={`block text-[10px] font-bold uppercase tracking-wider mb-1 truncate ${
                              isSelected ? 'text-purple-200' : 'text-slate-400 group-hover:text-purple-600'
                            }`}
                          >
                            {parentPath}
                          </span>
                        )}
                        <span
                          className={`block text-xs sm:text-sm font-bold leading-snug line-clamp-2 ${
                            isSelected ? 'text-white' : 'text-slate-800 group-hover:text-purple-900'
                          }`}
                        >
                          {lastPart}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                        <span className={isSelected ? 'text-purple-100 font-bold' : 'text-slate-400 group-hover:text-purple-600'}>
                          {isSelected ? '✓ Seleccionada' : 'Seleccionar'}
                        </span>
                        <span className={`text-xs ${isSelected ? 'text-purple-100' : 'text-slate-300 group-hover:text-purple-600'}`}>
                          →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredCategorias.length === 0 && (
                <div className="py-20 text-center text-slate-400">
                  <p className="text-base font-bold text-slate-600">No se encontraron categorías para «{catSearchQuery}»</p>
                  <p className="text-xs text-slate-400 mt-1">Probá buscando con otro nombre o limpiando el filtro</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle con view transition */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Modal de comparación de precios */}
      {comparingProduct && (
        <ComparisonModal
          product={comparingProduct}
          data={comparisonData}
          loading={comparisonLoading}
          onClose={() => { setComparingProduct(null); setComparisonData(null); }}
        />
      )}

      {/* Chat flotante de lista de compras */}
      <ShoppingListChat
        items={shoppingList}
        onRemove={removeFromList}
        onClear={clearList}
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
      />
    </div>
  );
}

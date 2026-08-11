import React, { useEffect, useState } from 'react';
import Header from './Header';
import ProductCard from './ProductCard';
import PriceHistoryModal from './PriceHistoryModal';
import { fetchSucursales, fetchProductos } from '../lib/api';
import { Filter, SlidersHorizontal, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function ProductCatalogApp() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [selectedProductForHistory, setSelectedProductForHistory] = useState(null);

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
  }, []);

  // Cargar productos al cambiar filtros o sucursal
  useEffect(() => {
    setLoading(true);
    const params = {
      search: searchQuery || undefined,
      sucursal_id: selectedBranch ? selectedBranch.id : undefined,
      max_price: maxPriceFilter ? Number(maxPriceFilter) : undefined
    };

    fetchProductos(params)
      .then((data) => {
        let filtered = data;
        if (onlyOffers) {
          filtered = data.filter(p => Boolean(p.precio_actual_oferta));
        }
        setProducts(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedBranch, searchQuery, onlyOffers, maxPriceFilter]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header React Island */}
      <Header
        selectedBranch={selectedBranch}
        branches={branches}
        onSelectBranch={setSelectedBranch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
          </div>

          {/* Max price filter input */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500">Precio Máximo $:</span>
            <input
              type="number"
              placeholder="Ej: 5000"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(e.target.value)}
              className="w-32 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anonima-red bg-slate-50 font-medium"
            />
            {maxPriceFilter && (
              <button
                onClick={() => setMaxPriceFilter('')}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold underline"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-anonima-red" />
            <span className="text-xs font-bold text-slate-500">Consultando catálogo e historial de precios...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center gap-3 max-w-md mx-auto my-12">
            <AlertCircle className="w-12 h-12 text-slate-300" />
            <h3 className="font-extrabold text-slate-800 text-lg">No se encontraron productos</h3>
            <p className="text-xs text-slate-500">
              No hay coincidencias para los filtros aplicados en la sucursal seleccionada. Prueba cambiando la sucursal o limpiando el buscador.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenHistory={setSelectedProductForHistory}
              />
            ))}
          </div>
        )}
      </main>

      {/* Price History Modal Island */}
      {selectedProductForHistory && (
        <PriceHistoryModal
          product={selectedProductForHistory}
          onClose={() => setSelectedProductForHistory(null)}
        />
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { X, BarChart3, Loader2, TrendingDown, Store, ChevronDown, ChevronUp } from 'lucide-react';

export default function ComparisonModal({ product, data, loading, onClose }) {
  const [expandedComercios, setExpandedComercios] = useState({});

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const toggleComercio = (slug) => {
    setExpandedComercios(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  const comercios = data?.comercios || [];
  const original = data?.producto_original || null;
  const totalComercios = comercios.length;
  const originalPrice = original ? Number(original.precio_oferta || original.precio_lista || 0) : 0;

  const mejorPrecio = Math.min(
    originalPrice > 0 ? originalPrice : Infinity,
    ...comercios.map(c => c.mejor_precio).filter(p => p > 0)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 sm:px-6 py-4 text-white shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {product.imagen_url && (
                <img
                  src={product.imagen_url}
                  alt={product.titulo}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain bg-white/20 rounded-xl p-1 shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <div className="min-w-0">
                <h3 className="font-black text-base sm:text-lg leading-tight truncate">{product.titulo}</h3>
                <p className="text-xs sm:text-sm text-purple-200 font-semibold truncate">
                  {product.marca} {product.unidad_medida ? `· ${product.unidad_medida}` : ''}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors shrink-0" aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs sm:text-sm font-bold flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full">
              <Store className="w-3.5 h-3.5" />
              {totalComercios} comercio{totalComercios !== 1 ? 's' : ''}
            </span>
            {mejorPrecio > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/30 px-3 py-1 rounded-full">
                <TrendingDown className="w-3.5 h-3.5" />
                Mejor: ${mejorPrecio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              <span className="text-sm font-bold text-slate-500">Buscando precios en otros comercios...</span>
            </div>
          ) : !data || (comercios.length === 0 && !original) ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center px-6">
              <BarChart3 className="w-12 h-12 text-slate-300" />
              <h4 className="font-extrabold text-slate-800 text-lg">Sin precios disponibles</h4>
              <p className="text-sm text-slate-500 max-w-sm">
                No se encontraron productos similares en otros comercios para comparar.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {/* Producto original como referencia */}
              {original && (
                <div className="px-4 sm:px-6 py-4 bg-violet-50/60">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] sm:text-xs font-bold rounded-full">
                      Tu producto
                    </span>
                    <span className="text-[10px] sm:text-xs text-violet-600 font-semibold">{original.comercio_nombre}</span>
                    {originalPrice > 0 && originalPrice === mejorPrecio && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-bold rounded-full">
                        <TrendingDown className="w-3 h-3" /> Mejor precio
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {original.imagen_url && (
                        <img src={original.imagen_url} alt="" className="w-10 h-10 object-contain bg-white rounded-lg border border-violet-200 p-0.5 shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                      )}
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-800 truncate block">{original.titulo}</span>
                        <span className="text-[10px] text-slate-500">{original.marca} {original.unidad_medida ? `· ${original.unidad_medida}` : ''}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {original.precio_oferta && Number(original.precio_oferta) > 0 ? (
                        <>
                          <span className="text-base sm:text-lg font-extrabold text-violet-700">
                            ${Number(original.precio_oferta).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                          {original.precio_lista && Number(original.precio_lista) > 0 && (
                            <span className="block text-[10px] text-slate-400 line-through">
                              ${Number(original.precio_lista).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </>
                      ) : originalPrice > 0 ? (
                        <span className="text-base sm:text-lg font-extrabold text-slate-900">
                          ${originalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Consultar</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Comercios con sus productos */}
              {comercios.map((comercio, idx) => {
                const isFirst = idx === 0 && mejorPrecio > 0 && comercios[0].mejor_precio <= originalPrice;
                const isExpanded = expandedComercios[comercio.comercio_slug] !== false; // default open

                return (
                  <div key={comercio.comercio_slug} className={`transition-colors ${isFirst ? 'bg-emerald-50/80' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    {/* Comercio header (clickable to expand) */}
                    <button
                      onClick={() => toggleComercio(comercio.comercio_slug)}
                      className="w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3 text-left hover:bg-black/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 ${isFirst ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-200 text-slate-600'}`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-white shadow-sm" style={{ backgroundColor: comercio.comercio_color || '#6366f1' }} />
                            <span className="text-sm sm:text-base font-bold text-slate-800 truncate">{comercio.comercio_nombre}</span>
                          </div>
                          <span className="text-[10px] sm:text-xs text-slate-500 font-semibold">
                            {comercio.productos.length} producto{comercio.productos.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className={`text-sm sm:text-base font-extrabold ${isFirst ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {comercio.mejor_precio > 0 ? `$${comercio.mejor_precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : 'Consultar'}
                          </span>
                          {isFirst && (
                            <span className="block text-[9px] sm:text-[10px] font-bold text-emerald-600">Mejor precio</span>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {/* Productos de este comercio (colapsable) */}
                    {isExpanded && (
                      <div className="px-4 sm:px-6 pb-3 space-y-2">
                        {comercio.productos.map((p, pIdx) => {
                          const pPrice = Number(p.precio_oferta || p.precio_lista || 0);
                          const hasOffer = Boolean(p.precio_oferta) && Number(p.precio_oferta) > 0;
                          return (
                            <div key={p.producto_id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${pIdx === 0 && isFirst ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-slate-50/30'}`}>
                              {p.imagen_url && (
                                <img src={p.imagen_url} alt="" className="w-9 h-9 object-contain bg-white rounded-lg border border-slate-100 p-0.5 shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate block">{p.titulo}</span>
                                <span className="text-[10px] text-slate-500">{p.marca} {p.unidad_medida ? `· ${p.unidad_medida}` : ''}</span>
                              </div>
                              <div className="text-right shrink-0">
                                {hasOffer ? (
                                  <>
                                    <span className="text-sm sm:text-base font-extrabold text-anonima-red">
                                      ${Number(p.precio_oferta).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                    {Number(p.precio_lista) > 0 && (
                                      <span className="block text-[10px] text-slate-400 line-through">
                                        ${Number(p.precio_lista).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                      </span>
                                    )}
                                  </>
                                ) : pPrice > 0 ? (
                                  <span className="text-sm sm:text-base font-extrabold text-slate-900">
                                    ${pPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">Consultar</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

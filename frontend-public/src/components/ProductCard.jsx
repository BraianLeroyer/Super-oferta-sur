import React from 'react';
import { Tag, CheckCircle2, XCircle, Eye, ShoppingCart, BarChart3, Plus, Check } from 'lucide-react';

export default function ProductCard({ product, onSelect, onCompare, onAddToList, isInList }) {
  const priceList = Number(product.precio_actual_lista || 0);
  const priceOffer = Number(product.precio_actual_oferta || 0);
  const priceBulto = Number(product.precio_bulto || 0);
  const hasOffer = Boolean(product.precio_actual_oferta) && priceOffer > 0;
  const hasBulto = Boolean(product.precio_bulto) && priceBulto > 0;
  const showBultoAsMain = hasBulto && priceList <= 0;

  return (
    <div
      onClick={() => onSelect && onSelect(product)}
      aria-label={`Ver detalles de ${product.titulo}`}
      className="group bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-anonima-red/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer"
    >
      {/* Top badges */}
      <div className="relative p-3 sm:p-4 pb-0 flex justify-between items-start">
        <div className="flex flex-col gap-1 items-start">
          {product.es_oferta_semanal && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] sm:text-[11px] font-bold">
              🏷️ Oferta Semanal
            </span>
          )}
          {product.sucursal_nombre && (
            <span className="inline-block px-2 py-0.5 text-[10px] sm:text-[11px] font-bold bg-red-50 text-anonima-red rounded-full border border-red-100">
              <span className="hidden sm:inline">{product.comercio_nombre || 'Sucursal'} · {product.sucursal_nombre}</span>
              <span className="sm:hidden">{product.comercio_nombre || 'Suc'}</span>
            </span>
          )}
          {product.categoria && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] sm:text-[11px] font-semibold max-w-full truncate">
              <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">{product.categoria}</span>
            </span>
          )}
          {onCompare && (
            <button
              onClick={(e) => { e.stopPropagation(); onCompare(product); }}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-200 rounded-full text-[10px] sm:text-[11px] font-bold hover:bg-violet-100 hover:border-violet-300 transition-colors cursor-pointer"
            >
              <BarChart3 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
              Comparar precios
            </button>
          )}
          {product.tipo_sucursal === 'mayorista' && !hasBulto && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-[10px] sm:text-[11px] font-bold">
              Por Unidad
            </span>
          )}
        </div>
      </div>

      {/* Image & Main Info */}
      <div className="p-3 sm:p-4 flex flex-col items-center text-center flex-grow">
        <div className="w-full aspect-square max-w-[160px] sm:max-w-[180px] mb-3 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-2 sm:p-3 overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform duration-300">
          <img
            src={product.imagen_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'}
            alt={product.titulo}
            loading="lazy"
            className="max-h-full max-w-full object-contain mix-blend-multiply"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
            }}
          />
        </div>

        <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {product.marca || product.comercio_nombre || 'Ofertas Sur'} {product.unidad_medida ? `• ${product.unidad_medida}` : ''}
        </div>

        <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug line-clamp-2 mb-1 group-hover:text-anonima-red transition-colors">
          {product.titulo}
        </h3>

        {product.descripcion && (
          <p className="text-[10px] sm:text-xs text-slate-500 leading-snug line-clamp-2 mb-2">
            {product.descripcion}
          </p>
        )}

        {product.es_oferta_club && (
          <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold mb-2">
            <Tag className="w-3 h-3 text-amber-600" />
            Club Ofertas Sur
          </div>
        )}
      </div>

      {/* Pricing & Actions Footer */}
      <div className="p-3 sm:p-4 pt-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
        {product.es_oferta_semanal && hasBulto ? (
          <>
            {priceList > 0 && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Precio unitario</span>
                <span className="text-xs sm:text-sm text-slate-400 line-through font-medium">
                  ${priceList.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wide">Precio por bulto</span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight">
                ${priceBulto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {product.descripcion_bulto && product.descripcion_bulto.toLowerCase() !== 'bulto' && (
              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg py-1.5">
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                Llevás {product.descripcion_bulto.replace(/bulto\s*/i, '').replace(/x/i, '')} unidades
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-baseline justify-center gap-2">
              {showBultoAsMain ? (
                <span className="text-xl sm:text-2xl font-extrabold text-anonima-red tracking-tight">
                  ${priceBulto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              ) : hasOffer ? (
                <>
                  <span className="text-xl sm:text-2xl font-extrabold text-anonima-red tracking-tight">
                    ${priceOffer.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                  {priceList > 0 && (
                    <span className="text-xs sm:text-sm text-slate-400 line-through font-medium">
                      ${priceList.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </>
              ) : priceList > 0 ? (
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  ${priceList.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              ) : priceBulto > 0 ? (
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  ${priceBulto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              ) : (
                <span className="text-sm font-bold text-slate-500 bg-slate-200/70 px-3 py-1 rounded-lg">
                  Consultar precio
                </span>
              )}
            </div>
            {hasOffer && !showBultoAsMain && priceList > 0 && (
              <span className="text-[10px] text-slate-500 font-medium bg-red-50 text-anonima-red border border-red-100/80 rounded-md px-1.5 py-0.5">
                💡 Precio en promo · 1 u. suelta: ${priceList.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        )}

        {/* Bulto cerrado (mayoristas) — solo para NO oferta semanal */}
        {hasBulto && !product.es_oferta_semanal && (
          <div className="flex flex-col gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
            {product.descripcion_bulto && product.descripcion_bulto.toLowerCase() !== 'bulto' && (
              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold text-amber-800">
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                Llevás {product.descripcion_bulto.replace(/bulto\s*/i, '').replace(/x/i, '')} unidades
              </div>
            )}
            <div className="flex items-center justify-center gap-1">
              <span className="text-base sm:text-lg font-extrabold text-amber-900">
                Pagás ${priceBulto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {priceList > 0 && priceBulto > 0 && (
              <p className="text-center text-[9px] sm:text-[10px] text-amber-700">
                (${(priceBulto / priceList).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}/un · ahorro vs. comprar por separado)
              </p>
            )}
            <p className="text-[9px] sm:text-[10px] text-amber-700 text-center italic">
              {product.comercio_nombre || 'Comercio'} · {product.sucursal_nombre || 'Sucursal'}
            </p>
          </div>
        )}

        {/* Stock */}
        <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs">
          {product.disponible ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Stock
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-500 font-medium">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Agotado
            </span>
          )}
        </div>

        {/* Hint de detalle */}
        <span className="mt-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 w-full py-2 sm:py-2.5 border-2 border-anonima-red text-anonima-red text-xs sm:text-sm font-bold rounded-xl group-hover:bg-anonima-red group-hover:text-white transition-colors">
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Ver detalles
        </span>

        {/* Botón Agregar/Quitar de la lista */}
        {onAddToList && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToList(product);
            }}
            className={`mt-1.5 w-full flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border-2 ${
              isInList
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm'
            }`}
          >
            {isInList ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                En la lista
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Agregar a la lista
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

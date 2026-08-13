import React from 'react';
import { Tag, TrendingDown, CheckCircle2, XCircle } from 'lucide-react';

export default function ProductCard({ product }) {
  const hasOffer = Boolean(product.precio_actual_oferta);
  const priceList = Number(product.precio_actual_lista || 0);
  const priceOffer = Number(product.precio_actual_oferta || 0);

  const discountPercent = hasOffer && priceList > 0
    ? Math.round(((priceList - priceOffer) / priceList) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      {/* Top badges */}
      <div className="relative p-4 pb-0 flex justify-between items-start">
        <div className="flex flex-col gap-1 items-start">
          {product.sucursal_nombre && (
            <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-red-50 text-anonima-red rounded border border-red-100">
              Sucursal {product.sucursal_nombre}
            </span>
          )}
        </div>

        {/* Offer badge */}
        {hasOffer && (
          <span className="bg-anonima-red text-white text-xs font-black px-2.5 py-1 rounded-full shadow flex items-center gap-1 animate-pulse">
            <TrendingDown className="w-3.5 h-3.5" />
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Image & Main Info */}
      <div className="p-4 flex flex-col items-center text-center flex-grow">
        <div className="w-36 h-36 mb-3 flex items-center justify-center bg-slate-50 rounded-lg p-2 overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform duration-200">
          <img
            src={product.imagen_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'}
            alt={product.titulo}
            className="max-h-full max-w-full object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
            }}
          />
        </div>

        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {product.marca || 'La Anónima'} {product.unidad_medida ? `• ${product.unidad_medida}` : ''}
        </div>

        {product.categoria && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] font-semibold mb-2 max-w-full truncate">
            <Tag className="w-2.5 h-2.5 shrink-0" />
            {product.categoria}
          </div>
        )}

        <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-anonima-red transition-colors">
          {product.titulo}
        </h3>

        {product.descripcion && (
          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mb-2">
            {product.descripcion}
          </p>
        )}

        {/* Club La Anónima Tag */}
        {product.es_oferta_club && (
          <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold mb-2">
            <Tag className="w-3 h-3 text-amber-600" />
            Club La Anónima
          </div>
        )}
      </div>

      {/* Pricing & Actions Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-baseline justify-center gap-2">
          {hasOffer ? (
            <>
              <span className="text-xl font-extrabold text-anonima-red tracking-tight">
                ${priceOffer.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 line-through font-medium">
                ${priceList.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </>
          ) : (
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              ${priceList.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>

        {/* Stock */}
        <div className="flex items-center justify-center gap-1 text-xs">
          {product.disponible ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Stock
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-500 font-medium">
              <XCircle className="w-3.5 h-3.5" /> Agotado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

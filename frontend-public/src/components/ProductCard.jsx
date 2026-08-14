import React from 'react';
import { Tag, CheckCircle2, XCircle, Eye } from 'lucide-react';

export default function ProductCard({ product, onSelect }) {
  const hasOffer = Boolean(product.precio_actual_oferta);
  const priceList = Number(product.precio_actual_lista || 0);
  const priceOffer = Number(product.precio_actual_oferta || 0);

  return (
    <div
      onClick={() => onSelect && onSelect(product)}
      aria-label={`Ver detalles de ${product.titulo}`}
      className="group bg-white rounded-2xl border-2 border-slate-300 shadow-md hover:border-anonima-red/70 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer"
    >
      {/* Top badges */}
      <div className="relative p-5 pb-0 flex justify-between items-start">
        <div className="flex flex-col gap-1.5 items-start">
          {product.sucursal_nombre && (
            <span className="inline-block px-2.5 py-1 text-[11px] font-bold bg-red-50 text-anonima-red rounded-full border border-red-100">
              Sucursal {product.sucursal_nombre}
            </span>
          )}
          {product.categoria && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[11px] font-semibold max-w-full truncate">
              <Tag className="w-3 h-3 shrink-0" />
              {product.categoria}
            </span>
          )}
        </div>
      </div>

      {/* Image & Main Info */}
      <div className="p-5 flex flex-col items-center text-center flex-grow">
        <div className="w-48 h-48 mb-4 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform duration-300">
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

        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          {product.marca || 'Ofertas Sur'} {product.unidad_medida ? `• ${product.unidad_medida}` : ''}
        </div>

        <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2 mb-1.5 group-hover:text-anonima-red transition-colors">
          {product.titulo}
        </h3>

        {product.descripcion && (
          <p className="text-xs text-slate-500 leading-snug line-clamp-2 mb-2">
            {product.descripcion}
          </p>
        )}

        {/* Club Ofertas Sur Tag */}
        {product.es_oferta_club && (
          <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded text-xs font-semibold mb-2">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            Club Ofertas Sur
          </div>
        )}
      </div>

      {/* Pricing & Actions Footer */}
      <div className="p-5 pt-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-baseline justify-center gap-2">
          {hasOffer ? (
            <>
              <span className="text-2xl font-extrabold text-anonima-red tracking-tight">
                ${priceOffer.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-slate-400 line-through font-medium">
                ${priceList.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </>
          ) : (
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ${priceList.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>

        {/* Stock */}
        <div className="flex items-center justify-center gap-1 text-xs">
          {product.disponible ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Stock
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-500 font-medium">
              <XCircle className="w-4 h-4" /> Agotado
            </span>
          )}
        </div>

        {/* Hint de detalle */}
        <span className="mt-1 inline-flex items-center justify-center gap-2 w-full py-2.5 border-2 border-anonima-red text-anonima-red text-sm font-bold rounded-xl group-hover:bg-anonima-red group-hover:text-white transition-colors">
          <Eye className="w-4 h-4" />
          Ver detalles
        </span>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { Tag, TrendingDown, CheckCircle2, XCircle, X, ExternalLink, MapPin } from 'lucide-react';

export default function ProductDetailModal({ product, onClose }) {
  const hasOffer = Boolean(product.precio_actual_oferta);
  const priceList = Number(product.precio_actual_lista || 0);
  const priceOffer = Number(product.precio_actual_oferta || 0);
  const productUrl = product.url_producto || null;

  const discountPercent = hasOffer && priceList > 0
    ? Math.round(((priceList - priceOffer) / priceList) * 100)
    : 0;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-8 md:rounded-l-3xl">
            <img
              src={product.imagen_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'}
              alt={product.titulo}
              className="max-h-64 max-w-full object-contain mix-blend-multiply"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600';
              }}
            />
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col gap-4">
            {hasOffer && (
              <div className="flex items-center gap-3">
                <span className="bg-anonima-red text-white text-lg font-black px-4 py-2 rounded-full ring-2 ring-red-100 shadow-lg flex items-center gap-1">
                  <TrendingDown className="w-5 h-5" />
                  -{discountPercent}%
                </span>
                {product.es_oferta_club && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded text-xs font-semibold">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    Club Ofertas Sur
                  </span>
                )}
              </div>
            )}

            {!hasOffer && product.es_oferta_club && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded text-xs font-semibold w-fit">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                Club Ofertas Sur
              </span>
            )}

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {product.marca || 'Ofertas Sur'} {product.unidad_medida ? `• ${product.unidad_medida}` : ''}
            </div>

            <h2 className="font-black text-slate-900 text-2xl leading-tight">
              {product.titulo}
            </h2>

            {product.categoria && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-semibold w-fit">
                <Tag className="w-3 h-3 shrink-0" />
                {product.categoria}
              </div>
            )}

            {product.sucursal_nombre && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                <MapPin className="w-4 h-4 text-anonima-red" />
                Sucursal {product.sucursal_nombre}
              </div>
            )}

            {product.descripcion && (
              <p className="text-sm text-slate-600 leading-relaxed">
                {product.descripcion}
              </p>
            )}

            {/* Precios */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-end justify-between gap-3">
              {hasOffer ? (
                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-1">Precio oferta</div>
                  <div className="text-3xl font-black text-anonima-red tracking-tight">
                    ${priceOffer.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-slate-400 line-through font-medium mt-1">
                    ${priceList.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-1">Precio</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight">
                    ${priceList.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
              <div className="flex flex-col items-end gap-1 text-sm">
                {product.disponible ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Stock
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-500 font-semibold">
                    <XCircle className="w-4 h-4" /> Agotado
                  </span>
                )}
              </div>
            </div>

            {/* Link oficial */}
            {productUrl ? (
              <a
                href={productUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-anonima-red hover:bg-anonima-darkred text-white text-sm font-black rounded-xl shadow-lg shadow-red-900/20 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Ver en el sitio oficial
              </a>
            ) : (
              <div className="w-full py-3.5 bg-slate-100 text-slate-400 text-sm font-bold rounded-xl text-center">
                Link no disponible
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

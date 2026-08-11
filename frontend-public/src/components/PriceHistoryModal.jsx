import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, Tag, TrendingDown, Clock, Loader2 } from 'lucide-react';
import { fetchProductHistory } from '../lib/api';

export default function PriceHistoryModal({ product, onClose }) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!product) return;
    setLoading(true);
    fetchProductHistory(product.id)
      .then((res) => {
        setDetail(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [product]);

  if (!product) return null;

  const history = detail?.historial_precios || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-anonima-red rounded-lg flex items-center justify-center text-white font-bold">
              LA
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-white leading-tight">
                Historial de Precios y Sucursales
              </h2>
              <p className="text-xs text-slate-400">SKU: {product.sku} • {product.titulo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <img
                src={product.imagen_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'}
                alt={product.titulo}
                className="w-16 h-16 object-contain bg-white p-1 rounded-lg border"
              />
              <div>
                <div className="text-xs text-slate-400 font-semibold">{product.marca || 'La Anónima'}</div>
                <div className="font-bold text-slate-800 text-sm">{product.titulo}</div>
                <div className="text-xs text-slate-500">{product.unidad_medida}</div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Último Precio Registrado</span>
              <span className="text-2xl font-black text-anonima-red">
                ${Number(product.precio_actual_oferta || product.precio_actual_lista || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* History Timeline */}
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-anonima-red" />
              Registros Históricos de Precios ({history.length})
            </h3>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-anonima-red" />
                <span className="text-xs font-medium">Cargando historial de capturas...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed">
                No hay historial de capturas disponible aún para este producto.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b">
                    <tr>
                      <th className="py-3 px-4">Fecha Captura</th>
                      <th className="py-3 px-4">Sucursal</th>
                      <th className="py-3 px-4">Precio Lista</th>
                      <th className="py-3 px-4">Precio Oferta</th>
                      <th className="py-3 px-4 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {history.map((item) => {
                      const fechaStr = new Date(item.fecha_captura).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-500">{fechaStr}</td>
                          <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-anonima-red" />
                            {item.sucursal?.nombre || 'General'}
                          </td>
                          <td className="py-3 px-4">
                            ${Number(item.precio_lista).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4">
                            {item.precio_oferta ? (
                              <span className="text-anonima-red font-bold flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />
                                ${Number(item.precio_oferta).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {item.disponible ? (
                              <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold text-[10px]">
                                Disponible
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-700 rounded font-semibold text-[10px]">
                                Agotado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

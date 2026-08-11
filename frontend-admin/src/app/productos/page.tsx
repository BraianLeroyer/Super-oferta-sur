'use client';

import React, { useEffect, useState } from 'react';
import { fetchProductosAdmin, Producto } from '@/lib/api';
import { Database, Search, RefreshCw, Tag } from 'lucide-react';

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  const loadProductos = async () => {
    setLoading(true);
    const data = await fetchProductosAdmin();
    setProductos(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProductos();
  }, []);

  const filtered = productos.filter(p =>
    p.titulo.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (p.marca && p.marca.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Catálogo de Productos en DB</h1>
          <p className="text-xs text-slate-400">Total de artículos registrados sin categoría, clasificados por SKU y sucursal</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar SKU, título, marca..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-anonima-red"
            />
          </div>

          <button
            onClick={loadProductos}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">SKU</th>
              <th className="py-3.5 px-4">Imagen</th>
              <th className="py-3.5 px-4">Producto</th>
              <th className="py-3.5 px-4">Marca</th>
              <th className="py-3.5 px-4">Unidad</th>
              <th className="py-3.5 px-4">Última Sucursal</th>
              <th className="py-3.5 px-4">Precio Lista</th>
              <th className="py-3.5 px-4">Precio Oferta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/60 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{p.sku}</td>
                <td className="py-3.5 px-4">
                  <img
                    src={p.imagen_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                    alt={p.titulo}
                    className="w-8 h-8 object-contain bg-white rounded p-0.5"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-white max-w-xs">{p.titulo}</td>
                <td className="py-3.5 px-4 text-slate-400">{p.marca || 'La Anónima'}</td>
                <td className="py-3.5 px-4 text-slate-400">{p.unidad_medida || '-'}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 bg-red-950 text-anonima-red border border-red-900/40 rounded font-semibold text-[10px]">
                    {p.sucursal_nombre || 'Trelew'}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-bold text-white">
                  ${Number(p.precio_actual_lista || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4">
                  {p.precio_actual_oferta ? (
                    <span className="font-bold text-emerald-400">
                      ${Number(p.precio_actual_oferta).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

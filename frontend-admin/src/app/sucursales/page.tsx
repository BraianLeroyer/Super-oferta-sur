'use client';

import React, { useEffect, useState } from 'react';
import { fetchSucursales, fetchComercios, triggerScraper, Sucursal, Comercio } from '@/lib/api';
import { MapPin, Play, Plus, RefreshCw, CheckCircle2, Store } from 'lucide-react';

export default function SucursalesPage() {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [selectedComercioId, setSelectedComercioId] = useState<number | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJobMsg, setActiveJobMsg] = useState<{ [key: number]: string }>({});

  const loadData = async () => {
    setLoading(true);
    const c = await fetchComercios();
    setComercios(c);
    if (selectedComercioId === null && c.length > 0) {
      const def = c.find(item => item.slug === 'la-anonima') || c[0];
      setSelectedComercioId(def.id);
    }
    const data = await fetchSucursales(selectedComercioId ?? undefined);
    setSucursales(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComercioId]);

  const handleComercioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedComercioId(e.target.value ? Number(e.target.value) : null);
  };

  const handleTriggerBranch = async (suc: Sucursal) => {
    setActiveJobMsg(prev => ({ ...prev, [suc.id]: 'Enviando...' }));
    const comercio = comercios.find(c => c.id === suc.comercio_id) || comercios[0];
    const res = await triggerScraper(comercio?.slug || 'la-anonima', suc.nombre, 50);
    if (res) {
      setActiveJobMsg(prev => ({ ...prev, [suc.id]: `✅ Tarea ${res.id.slice(0, 6)} iniciada` }));
    } else {
      setActiveJobMsg(prev => ({ ...prev, [suc.id]: '❌ Error al iniciar' }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sucursales y Ubicaciones</h1>
          <p className="text-xs text-slate-400">Administra y lanza la extracción por cada comercio y nodo geográfico</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-anonima-red" />
            <select
              value={selectedComercioId ?? ''}
              onChange={handleComercioChange}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-anonima-red"
            >
              <option value="">Todos los comercios</option>
              {comercios.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>
      </div>

      {/* Grid of Branches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sucursales.map((suc) => (
          <div
            key={suc.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-red-950 text-anonima-red border border-red-800/40 rounded-md font-mono text-[11px] font-bold">
                  {suc.codigo_sucursal}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${suc.tipo_sucursal === 'mayorista' ? 'bg-amber-950 text-amber-400 border border-amber-800/40' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'}`}>
                    {suc.tipo_sucursal === 'mayorista' ? 'Mayorista' : 'Supermercado'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{suc.provincia}</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-anonima-red" />
                  Sucursal {suc.nombre}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {comercios.find(c => c.id === suc.comercio_id)?.nombre || 'La Anónima'} · Mapeo de sesión regional configurado.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
              <button
                onClick={() => handleTriggerBranch(suc)}
                className="flex items-center gap-2 px-4 py-2 bg-anonima-red hover:bg-anonima-darkred text-white text-xs font-black rounded-xl shadow transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Lanzar Scraper
              </button>

              {activeJobMsg[suc.id] && (
                <span className="text-[11px] font-bold text-slate-300">
                  {activeJobMsg[suc.id]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

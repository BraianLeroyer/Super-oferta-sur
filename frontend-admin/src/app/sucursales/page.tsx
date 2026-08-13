'use client';

import React, { useEffect, useState } from 'react';
import { fetchSucursales, triggerScraper, Sucursal } from '@/lib/api';
import { MapPin, Play, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJobMsg, setActiveJobMsg] = useState<{ [key: number]: string }>({});

  const loadData = async () => {
    setLoading(true);
    const data = await fetchSucursales();
    setSucursales(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerBranch = async (suc: Sucursal) => {
    setActiveJobMsg(prev => ({ ...prev, [suc.id]: 'Enviando...' }));
    const res = await triggerScraper(suc.nombre, 50);
    if (res) {
      setActiveJobMsg(prev => ({ ...prev, [suc.id]: `✅ Tarea ${res.id.slice(0, 6)} iniciada` }));
    } else {
      setActiveJobMsg(prev => ({ ...prev, [suc.id]: '❌ Error al iniciar' }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sucursales y Ubicaciones</h1>
          <p className="text-xs text-slate-400">Administra y lanza la extracción por cada nodo geográfico de La Anónima</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recargar
        </button>
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
                <span className="text-xs text-slate-400 font-semibold">{suc.provincia}</span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-anonima-red" />
                  Sucursal {suc.nombre}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Mapeo de cookies y encabezados regionales configurados.
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

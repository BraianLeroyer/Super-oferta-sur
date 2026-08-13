'use client';

import React, { useEffect, useState } from 'react';
import { fetchJobs, fetchSucursales, fetchProductosAdmin, triggerScraper, ScraperJob, Sucursal, Producto } from '@/lib/api';
import { MapPin, Play, Activity, Database, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [jobs, setJobs] = useState<ScraperJob[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSucursal, setSelectedSucursal] = useState('Trelew');
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [j, s, p] = await Promise.all([
      fetchJobs(),
      fetchSucursales(),
      fetchProductosAdmin()
    ]);
    setJobs(j);
    setSucursales(s);
    setProductos(p);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriggering(true);
    setTriggerMessage(null);
    const res = await triggerScraper(selectedSucursal, 50);
    setTriggering(false);
    if (res) {
      setTriggerMessage(`✅ Tarea de raspado enviada para ${selectedSucursal} (ID: ${res.id.slice(0, 8)})`);
      loadData();
    } else {
      setTriggerMessage(`❌ Error al iniciar la tarea de raspado`);
    }
  };

  const finishedJobs = jobs.filter(j => j.estado === 'FINISHED').length;
  const runningJobs = jobs.filter(j => j.estado === 'RUNNING' || j.estado === 'PENDING').length;
  const totalScrapedItems = jobs.reduce((acc, curr) => acc + (curr.total_scrapeados || 0), 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Dashboard General Scraper</h1>
          <p className="text-xs text-slate-400">Sistema de Extracción Espacial por Sucursales - La Anónima</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Datos
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Sucursales Activas
            </span>
            <span className="text-3xl font-black text-white">{sucursales.length}</span>
          </div>
          <div className="p-3 bg-red-950/60 text-anonima-red rounded-xl border border-red-900/40">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Productos en Base
            </span>
            <span className="text-3xl font-black text-white">{productos.length}</span>
          </div>
          <div className="p-3 bg-blue-950/60 text-blue-400 rounded-xl border border-blue-900/40">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Items Extraídos
            </span>
            <span className="text-3xl font-black text-emerald-400">{totalScrapedItems}</span>
          </div>
          <div className="p-3 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-900/40">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Tareas en Ejecución
            </span>
            <span className="text-3xl font-black text-amber-400">{runningJobs}</span>
          </div>
          <div className="p-3 bg-amber-950/60 text-amber-400 rounded-xl border border-amber-900/40">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Trigger Scraper Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-anonima-red bg-red-950/80 px-2.5 py-1 rounded-full border border-red-800/40 inline-block">
              Acción Manual Scraper
            </span>
            <h2 className="text-lg font-black text-white">Lanzar Raspado por Sucursal (Spatial Extraction)</h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Selecciona una ubicación (Trelew, Rawson, Puerto Madryn, Comodoro, Esquel) para simular la sesión del supermercado y extraer precios actualizados.
            </p>
          </div>

          <form onSubmit={handleTrigger} className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <select
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="w-full sm:w-48 bg-slate-950 text-white font-bold text-xs border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-anonima-red"
            >
              {sucursales.map((s) => (
                <option key={s.id} value={s.nombre}>
                  Sucursal {s.nombre} ({s.codigo_sucursal})
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={triggering}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-anonima-red hover:bg-anonima-darkred text-white text-xs font-black rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              {triggering ? 'Enviando...' : 'Iniciar Scraper'}
            </button>
          </form>
        </div>

        {triggerMessage && (
          <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200">
            {triggerMessage}
          </div>
        )}
      </div>

      {/* Recent Scraper Jobs Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-white text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-anonima-red" />
            Últimas Tareas de Raspado ({jobs.length})
          </h3>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Sucursal</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Extraídos</th>
                <th className="py-3 px-4">Errores</th>
                <th className="py-3 px-4">Iniciado En</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {jobs.slice(0, 8).map((job) => (
                <tr key={job.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">{job.id.slice(0, 8)}...</td>
                  <td className="py-3 px-4 font-bold text-white">
                    {job.sucursal?.nombre || 'Trelew'}
                  </td>
                  <td className="py-3 px-4">
                    {job.estado === 'FINISHED' && (
                      <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded-full font-bold text-[10px]">
                        Completado
                      </span>
                    )}
                    {job.estado === 'RUNNING' && (
                      <span className="px-2.5 py-1 bg-amber-950 text-amber-400 border border-amber-800/40 rounded-full font-bold text-[10px] animate-pulse">
                        En Ejecución
                      </span>
                    )}
                    {job.estado === 'PENDING' && (
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full font-bold text-[10px]">
                        Pendiente
                      </span>
                    )}
                    {job.estado === 'FAILED' && (
                      <span className="px-2.5 py-1 bg-rose-950 text-rose-400 border border-rose-800/40 rounded-full font-bold text-[10px]">
                        Fallido
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-400">{job.total_scrapeados}</td>
                  <td className="py-3 px-4 text-rose-400">{job.total_errores}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">
                    {new Date(job.iniciado_en).toLocaleTimeString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

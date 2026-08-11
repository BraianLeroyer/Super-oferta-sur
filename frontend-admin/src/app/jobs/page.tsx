'use client';

import React, { useEffect, useState } from 'react';
import { fetchJobs, ScraperJob } from '@/lib/api';
import { Clock, RefreshCw, AlertCircle, CheckCircle2, PlayCircle } from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs] = useState<ScraperJob[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    setLoading(true);
    const data = await fetchJobs();
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Historial de Trabajos (Scraper Jobs)</h1>
          <p className="text-xs text-slate-400">Auditoría en tiempo real de ejecuciones por sucursal en Celery/Redis</p>
        </div>
        <button
          onClick={loadJobs}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">UUID Job</th>
              <th className="py-3.5 px-4">Sucursal</th>
              <th className="py-3.5 px-4">Estado</th>
              <th className="py-3.5 px-4">Scrapeados</th>
              <th className="py-3.5 px-4">Errores</th>
              <th className="py-3.5 px-4">Inicio</th>
              <th className="py-3.5 px-4">Finalización</th>
              <th className="py-3.5 px-4">Mensaje / Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-800/60 transition-colors">
                <td className="py-3.5 px-4 font-mono text-slate-400">{job.id}</td>
                <td className="py-3.5 px-4 font-bold text-white">
                  {job.sucursal?.nombre || 'Trelew'}
                </td>
                <td className="py-3.5 px-4">
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
                <td className="py-3.5 px-4 font-bold text-emerald-400">{job.total_scrapeados}</td>
                <td className="py-3.5 px-4 text-rose-400">{job.total_errores}</td>
                <td className="py-3.5 px-4 text-slate-400 font-mono">
                  {new Date(job.iniciado_en).toLocaleString('es-AR')}
                </td>
                <td className="py-3.5 px-4 text-slate-400 font-mono">
                  {job.finalizado_en ? new Date(job.finalizado_en).toLocaleString('es-AR') : '-'}
                </td>
                <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                  {job.mensaje_error || 'Sin errores'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

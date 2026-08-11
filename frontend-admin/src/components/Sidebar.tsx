'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MapPin, PlayCircle, Database, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard Overview', href: '/', icon: LayoutDashboard },
    { label: 'Sucursales & Trigger', href: '/sucursales', icon: MapPin },
    { label: 'Trabajos Scraper Logs', href: '/jobs', icon: PlayCircle },
    { label: 'Catálogo Productos', href: '/productos', icon: Database },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 min-h-screen text-slate-300">
      <div>
        {/* Admin Brand */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-slate-800">
          <div className="w-9 h-9 bg-anonima-red rounded-lg flex items-center justify-center text-white font-black shadow">
            LA
          </div>
          <div>
            <h1 className="font-black text-white text-sm tracking-tight leading-none">
              La Anónima <span className="text-anonima-red">Admin</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Control Center V1.0</p>
          </div>
        </div>

        {/* Nav list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-anonima-red text-white shadow-md shadow-red-900/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
          <ShieldCheck className="w-4 h-4" />
          Scraper Engine Activo
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          Celery + Redis + FastAPI worker escuchando tareas por sucursal.
        </p>
        <a
          href="http://localhost:4321"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-anonima-red hover:underline pt-1"
        >
          Ver Portal Público Astro <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
}

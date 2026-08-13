import React from 'react';
import { MapPin, Tag, ExternalLink } from 'lucide-react';

export default function Header({
  selectedBranch,
  branches,
  onSelectBranch
}) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Top Banner Red bar */}
      <div className="bg-anonima-red text-white py-1.5 px-4 text-xs font-semibold flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5" />
          <span>Monitor de Precios y Sucursales - Supermercados La Anónima</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-red-100">
          <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1 font-medium bg-anonima-darkred px-2 py-0.5 rounded">
            Panel de Administración <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-anonima-red rounded-lg flex items-center justify-center text-white font-extrabold text-xl shadow">
              LA
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                La Anónima <span className="text-anonima-red">Precios</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Catalogo por Sucursal (Chubut / Patagonia)</p>
            </div>
          </div>
        </div>

        {/* Branch / Sucursal Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="bg-slate-100 p-2 rounded-lg text-anonima-red">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Sucursal Seleccionada
            </label>
            <select
              value={selectedBranch ? selectedBranch.id : ''}
              onChange={(e) => {
                const bId = Number(e.target.value);
                const b = branches.find(item => item.id === bId);
                onSelectBranch(b || null);
              }}
              className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer border-b border-transparent hover:border-anonima-red transition-colors py-0.5"
            >
              <option value="">Todas las Sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre} ({b.provincia})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}

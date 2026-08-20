import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Tag, ChevronDown, Check, Building2, ShoppingBag, Store, Info } from 'lucide-react';

function SelectorDropdown({ label, icon: Icon, options, selected, onSelect, disabled, renderOption }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-50/90 hover:bg-white border-2 border-slate-200/80 hover:border-anonima-red/50 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
      >
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-slate-200 text-anonima-red shrink-0 shadow-xs">
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black block leading-tight">{label}</span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate block leading-tight">
            {selected ? selected.nombre : 'Seleccionar'}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {options.map((opt) => {
              const isSelected = selected && selected.id === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { onSelect(opt); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-red-50/80 border-l-4 border-anonima-red'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  {renderOption ? renderOption(opt, isSelected) : (
                    <>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">{opt.nombre}</span>
                      {isSelected && <Check className="w-4 h-4 text-anonima-red shrink-0 ml-auto" />}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header({
  comercios,
  selectedComercio,
  onSelectComercio,
  selectedBranch,
  branches,
  onSelectBranch
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      {/* Top Banner Red bar */}
      <div className="bg-gradient-to-r from-anonima-red to-anonima-darkred text-white py-1.5 px-4 text-xs font-semibold flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Monitor de Precios y Ofertas de la Patagonia · Chubut</span>
          <span className="sm:hidden">Ofertas Sur Patagonia</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-red-100 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Actualizado en vivo</span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Left: Brand + Static Frosted Nav Pills */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 sm:gap-6">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-95 transition-opacity group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-anonima-red to-anonima-darkred rounded-2xl flex items-center justify-center text-white font-black text-base sm:text-xl shadow-md shadow-red-900/20 group-hover:scale-105 transition-transform">
              OS
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                Ofertas <span className="text-anonima-red">Sur</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patagonia Argentina</p>
            </div>
          </a>

          {/* Frosted Blur Nav Pills */}
          <nav className="inline-flex items-center gap-1 bg-slate-100/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200/70 shadow-inner">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-white text-anonima-red shadow-xs border border-slate-200/60 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Catálogo</span>
            </a>
            <a
              href="/sucursales"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all"
            >
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Sucursales</span>
            </a>
            <a
              href="/sobre-nosotros"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Sobre Nosotros</span>
            </a>
          </nav>
        </div>

        {/* Right: Selectors for Comercio + Sucursal */}
        <div className="flex items-stretch gap-2 w-full md:w-auto md:min-w-[420px]">
          <SelectorDropdown
            label="Comercio"
            icon={Building2}
            options={comercios}
            selected={selectedComercio}
            onSelect={onSelectComercio}
          />
          <SelectorDropdown
            label="Sucursal"
            icon={MapPin}
            options={branches}
            selected={selectedBranch}
            onSelect={onSelectBranch}
            disabled={!selectedComercio || branches.length === 0}
            renderOption={(opt, isSelected) => (
              <>
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block truncate">{opt.nombre}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {opt.tipo_sucursal === 'mayorista' ? '📦 Mayorista' : '🛒 Supermercado'} · {opt.provincia}
                  </span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-anonima-red shrink-0" />}
              </>
            )}
          />
        </div>

      </div>
    </header>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Minus, Maximize2, Trash2, X, Copy, Check } from 'lucide-react';

export default function ShoppingListChat({ items, onRemove, onClear, isOpen, onToggle }) {
  const [copied, setCopied] = useState(false);
  const listRef = useRef(null);
  const prevCountRef = useRef(items.length);

  const total = items.reduce((sum, item) => sum + item.precio, 0);

  useEffect(() => {
    if (items.length > prevCountRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    prevCountRef.current = items.length;
  }, [items.length]);

  const handleCopy = () => {
    const lines = [
      '🛒 Mi Lista - Ofertas Sur',
      '─────────────────────',
      ...items.map(item => `• ${item.titulo} ${item.marca ? `(${item.marca})` : ''} — $${item.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`),
      '─────────────────────',
      `Total: $${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 flex flex-col items-center gap-1 bg-anonima-red hover:bg-anonima-darkred text-white rounded-2xl shadow-2xl shadow-red-900/30 transition-all hover:scale-105 active:scale-95 px-4 py-3 min-w-[72px]"
        aria-label="Abrir lista de compras"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2.5 bg-white text-anonima-red text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <span className="text-xs font-extrabold leading-none">
            ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300"
      style={{ maxHeight: 'min(520px, calc(100vh - 100px))' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-anonima-red to-anonima-darkred px-4 py-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingCart className="w-4 h-4 text-white shrink-0" />
          <span className="text-sm font-bold text-white truncate">
            Mi Lista
          </span>
          {items.length > 0 && (
            <span className="text-[10px] font-bold text-red-200 bg-white/15 px-1.5 py-0.5 rounded-full shrink-0">
              {items.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {items.length > 0 && (
            <button
              onClick={onClear}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Vaciar lista"
              title="Vaciar lista"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Minimizar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
          <ShoppingCart className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">Tu lista está vacía</p>
          <p className="text-xs text-slate-400">
            Tocá "Agregar a la lista" en cualquier producto para empezar a armar tu compra.
          </p>
        </div>
      ) : (
        <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50/50">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-start gap-2 bg-white border border-slate-100 rounded-xl px-3 py-2.5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">
                  {item.titulo}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {item.marca || item.comercio_nombre || ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-xs font-extrabold ${item.precio > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                  {item.precio > 0 ? `$${item.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : 'Consultar'}
                </span>
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  aria-label="Quitar de la lista"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {items.length > 0 && (
        <div className="border-t border-slate-200 px-4 py-3 bg-white shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
            <span className="text-base font-black text-slate-900">
              ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              copied
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copiar lista
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

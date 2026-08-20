import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, ChevronRight, X } from 'lucide-react';

export default function CookieConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('ofertas_sur_consent');
      if (!consent) {
        setShow(true);
      }
    } catch (e) {
      // Ignorar si localStorage no está disponible
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('ofertas_sur_consent', 'accepted');
    } catch (e) {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-3xl border border-slate-700/70 shadow-2xl shadow-black/40 flex flex-col gap-3.5">
        
        {/* Header with icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Términos y Almacenamiento Local
              </h4>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Navegación segura y sin rastreo
              </span>
            </div>
          </div>
          <button
            onClick={handleAccept}
            className="text-slate-400 hover:text-white p-1 transition-colors"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-300 leading-relaxed">
          Utilizamos almacenamiento local en tu navegador exclusivamente para guardar tu lista de compras y preferencias de sucursal. Al continuar navegando, aceptás nuestros{' '}
          <a href="/terminos" class="text-red-300 hover:text-white underline font-semibold transition-colors">
            Términos y Condiciones
          </a>{' '}
          y{' '}
          <a href="/privacidad" class="text-red-300 hover:text-white underline font-semibold transition-colors">
            Política de Privacidad
          </a>.
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAccept}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-anonima-red hover:bg-anonima-darkred text-white text-xs font-black rounded-xl shadow-lg shadow-red-900/40 active:scale-95 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            Aceptar y Continuar
          </button>
          <a
            href="/terminos"
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-colors shrink-0"
          >
            Leer Términos
          </a>
        </div>

      </div>
    </div>
  );
}

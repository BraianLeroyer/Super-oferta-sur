import React, { useState, useMemo } from 'react';
import { MapPin, Building2, Store, Search, ShieldCheck, ArrowRight, Boxes, Tag } from 'lucide-react';

const SUCURSALES_DATA = [
  // Trelew
  {
    id: 1,
    comercio: 'La Anónima',
    comercioSlug: 'la-anonima',
    color: '#D91F26',
    nombre: 'Trelew Sucursal 01',
    codigo: 'TRELEW_01',
    localidad: 'Trelew',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: 'Belgrano y Colombia, Trelew',
    descripcion: 'Hipermercado con catálogo completo de alimentos, electro, bebidas, limpieza y bazar.',
    destacado: '16.165+ productos',
  },
  {
    id: 2,
    comercio: 'Carrefour',
    comercioSlug: 'carrefour',
    color: '#004A97',
    nombre: 'Carrefour Trelew',
    codigo: 'CARREFOUR_TRELEW',
    localidad: 'Trelew',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: '25 de Mayo 1444, Trelew',
    descripcion: 'Supermercado Carrefour con ofertas semanales, marcas propias y rubros de almacén.',
    destacado: 'Catálogo VTEX oficial',
  },
  {
    id: 4,
    comercio: 'Vea',
    comercioSlug: 'vea',
    color: '#E30613',
    nombre: 'Vea Trelew',
    codigo: 'VEA_TRELEW',
    localidad: 'Trelew',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: 'Sarmiento 230, Trelew',
    descripcion: 'Supermercado de cercanía con ofertas destacadas tipo 3x2, 2do al 70% y descuentos diarios.',
    destacado: 'Promociones Cencosud',
  },
  {
    id: 5,
    comercio: 'Mas Online',
    comercioSlug: 'mas-online',
    color: '#FFB800',
    nombre: 'Mas Online Trelew',
    codigo: 'MAS_ONLINE_TRELEW',
    localidad: 'Trelew',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: 'Pellegrini 450, Trelew',
    descripcion: 'Cadena GDN Argentina con marcas Great Value, ofertas especiales y amplia variedad.',
    destacado: 'Supermercado online',
  },
  {
    id: 6,
    comercio: 'Yaguar',
    comercioSlug: 'yaguar',
    color: '#78BE20',
    nombre: 'Yaguar Trelew',
    codigo: 'YAGUAR_TRELEW',
    localidad: 'Trelew',
    provincia: 'Chubut',
    tipo: 'mayorista',
    direccion: 'Ruta 25 y Av. Eva Perón, Trelew',
    descripcion: 'Distribuidora mayorista con venta por bulto cerrado, pack x4/x6/x12 y ofertas semanales especiales.',
    destacado: 'Oferta Semanal en vivo',
  },

  // Puerto Madryn
  {
    id: 7,
    comercio: 'La Anónima',
    comercioSlug: 'la-anonima',
    color: '#D91F26',
    nombre: 'La Anónima Puerto Madryn',
    codigo: 'MADRYN_01',
    localidad: 'Puerto Madryn',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: '28 de Julio 120, Puerto Madryn',
    descripcion: 'Sucursal céntrica con amplia variedad de productos frescos, almacén y perfumería.',
    destacado: 'Precios locales actualizados',
  },
  {
    id: 8,
    comercio: 'Carrefour',
    comercioSlug: 'carrefour',
    color: '#004A97',
    nombre: 'Carrefour Hiper Puerto Madryn',
    codigo: 'CARREFOUR_PTO_MADRYN_HIPER',
    localidad: 'Puerto Madryn',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: 'Av. Juan B. Justo y Gales, Puerto Madryn',
    descripcion: 'Hipermercado completo con ofertas en electro, hogar, alimentos y bebidas.',
    destacado: 'Hipermercado',
  },
  {
    id: 9,
    comercio: 'Carrefour',
    comercioSlug: 'carrefour',
    color: '#004A97',
    nombre: 'Carrefour Market Puerto Madryn',
    codigo: 'CARREFOUR_PTO_MADRYN_MARKET',
    localidad: 'Puerto Madryn',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: 'Mitre 250, Puerto Madryn',
    descripcion: 'Formato Market céntrico con compras rápidas y promociones Mi Carrefour.',
    destacado: 'Market de cercanía',
  },
  {
    id: 10,
    comercio: 'Vea',
    comercioSlug: 'vea',
    color: '#E30613',
    nombre: 'Vea Puerto Madryn',
    codigo: 'VEA_PTO_MADRYN',
    localidad: 'Puerto Madryn',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: 'Belgrano 410, Puerto Madryn',
    descripcion: 'Supermercado Vea con descuentos Cencosud y ofertas de temporada.',
    destacado: 'Ofertas semanales',
  },

  // Comodoro Rivadavia
  {
    id: 11,
    comercio: 'La Anónima',
    comercioSlug: 'la-anonima',
    color: '#D91F26',
    nombre: 'La Anónima Comodoro Rivadavia',
    codigo: 'COMODORO_01',
    localidad: 'Comodoro Rivadavia',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: 'San Martín 450, Comodoro Rivadavia',
    descripcion: 'Sucursal principal de Comodoro Rivadavia con catálogo completo y promociones del Club.',
    destacado: 'Catálogo de Comodoro',
  },
  {
    id: 12,
    comercio: 'Carrefour',
    comercioSlug: 'carrefour',
    color: '#004A97',
    nombre: 'Carrefour Comodoro Rivadavia',
    codigo: 'CARREFOUR_COMODORO',
    localidad: 'Comodoro Rivadavia',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: 'Av. Rivadavia 1500, Comodoro Rivadavia',
    descripcion: 'Hipermercado con estacionamiento, precios Carrefour y promociones bancarias.',
    destacado: 'Hipermercado',
  },
  {
    id: 13,
    comercio: 'Jumbo',
    comercioSlug: 'jumbo',
    color: '#008B45',
    nombre: 'Jumbo Comodoro Rivadavia',
    codigo: 'JUMBO_COMODORO',
    localidad: 'Comodoro Rivadavia',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: 'Ruta 3 km 3, Comodoro Rivadavia',
    descripcion: 'Supermercado premium con productos gourmet, marcas importadas y descuentos Cencosud.',
    destacado: 'Calidad Jumbo',
  },
  {
    id: 14,
    comercio: 'Mas Online',
    comercioSlug: 'mas-online',
    color: '#FFB800',
    nombre: 'Mas Online Comodoro',
    codigo: 'MAS_ONLINE_COMODORO',
    localidad: 'Comodoro Rivadavia',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: 'Av. Hipólito Yrigoyen 2800, Comodoro Rivadavia',
    descripcion: 'Hipermercado Mas Online con ofertas masivas y precios mayoristas.',
    destacado: 'Gran superficie',
  },

  // Rawson
  {
    id: 15,
    comercio: 'La Anónima',
    comercioSlug: 'la-anonima',
    color: '#D91F26',
    nombre: 'La Anónima Rawson',
    codigo: 'RAWSON_01',
    localidad: 'Rawson',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: 'Av. San Martín y 25 de Mayo, Rawson',
    descripcion: 'Sucursal de la capital provincial con stock constante de alimentos, bebidas y carnicería.',
    destacado: 'Capital provincial',
  },

  // Esquel
  {
    id: 16,
    comercio: 'La Anónima',
    comercioSlug: 'la-anonima',
    color: '#D91F26',
    nombre: 'La Anónima Esquel',
    codigo: 'ESQUEL_01',
    localidad: 'Esquel',
    provincia: 'Chubut',
    tipo: 'supermercado',
    direccion: '25 de Mayo 520, Esquel',
    descripcion: 'Supermercado en la cordillera chubutense con abastecimiento integral y precios unificados.',
    destacado: 'Cordillera de Chubut',
  },
];

const LOCALIDADES = ['Todas', 'Trelew', 'Puerto Madryn', 'Comodoro Rivadavia', 'Rawson', 'Esquel'];
const COMERCIOS = ['Todos', 'La Anónima', 'Carrefour', 'Jumbo', 'Vea', 'Mas Online', 'Yaguar'];

export default function SucursalesDirectory() {
  const [selectedLocalidad, setSelectedLocalidad] = useState('Todas');
  const [selectedComercio, setSelectedComercio] = useState('Todos');
  const [selectedTipo, setSelectedTipo] = useState('todos');
  const [search, setSearch] = useState('');

  const filteredSucursales = useMemo(() => {
    return SUCURSALES_DATA.filter((s) => {
      const matchLoc = selectedLocalidad === 'Todas' || s.localidad === selectedLocalidad;
      const matchCom = selectedComercio === 'Todos' || s.comercio === selectedComercio;
      const matchTipo = selectedTipo === 'todos' || s.tipo === selectedTipo;
      const matchSearch =
        !search ||
        s.nombre.toLowerCase().includes(search.toLowerCase()) ||
        s.comercio.toLowerCase().includes(search.toLowerCase()) ||
        s.localidad.toLowerCase().includes(search.toLowerCase()) ||
        s.direccion.toLowerCase().includes(search.toLowerCase());
      return matchLoc && matchCom && matchTipo && matchSearch;
    });
  }, [selectedLocalidad, selectedComercio, selectedTipo, search]);

  return (
    <div className="space-y-8">
      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        {/* Search input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar sucursal por nombre, comercio, localidad o calle..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-anonima-red/20 focus:border-anonima-red transition-all"
          />
        </div>

        {/* Localidades Chips */}
        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
            Filtrar por Localidad
          </label>
          <div className="flex flex-wrap gap-2">
            {LOCALIDADES.map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocalidad(loc)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedLocalidad === loc
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                📍 {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Comercios & Tipo Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              Comercio
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMERCIOS.map((com) => (
                <button
                  key={com}
                  onClick={() => setSelectedComercio(com)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedComercio === com
                      ? 'bg-anonima-red text-white shadow-sm shadow-red-900/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {com}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              Tipo de Sucursal
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTipo('todos')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedTipo === 'todos'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedTipo('supermercado')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedTipo === 'supermercado'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🛒 Supermercado
              </button>
              <button
                onClick={() => setSelectedTipo('mayorista')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedTipo === 'mayorista'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                📦 Mayorista
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Mostrando {filteredSucursales.length} sucursal{filteredSucursales.length !== 1 ? 'es' : ''} activa{filteredSucursales.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid of Branch Cards */}
      {filteredSucursales.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <Store className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron sucursales</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Probá cambiando la localidad o los filtros de comercio seleccionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSucursales.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-anonima-red/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header card badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {s.comercio}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      s.tipo === 'mayorista'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {s.tipo === 'mayorista' ? '📦 Mayorista' : '🛒 Supermercado'}
                  </span>
                </div>

                {/* Branch name & City */}
                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-anonima-red transition-colors leading-tight">
                    {s.nombre}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-anonima-red shrink-0" />
                    {s.localidad}, {s.provincia}
                  </div>
                </div>

                {/* Address */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 text-xs">
                  <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block">
                    Dirección
                  </span>
                  <p className="font-semibold text-slate-700 leading-snug">
                    {s.direccion}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {s.descripcion}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  ✨ {s.destacado}
                </span>
                <a
                  href="/"
                  className="inline-flex items-center gap-1 text-xs font-black text-anonima-red hover:text-anonima-darkred transition-colors"
                >
                  Ver ofertas <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

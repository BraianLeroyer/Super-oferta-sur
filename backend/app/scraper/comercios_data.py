from typing import Dict, Any, List

from app.scraper.sucursal_session import SUCURSALES_DATA


# Configuración de las cadenas (comercios) soportadas por el sistema multi-mercado.
# Cada comercio define su plataforma (scraping_modo) y las sucursales que se siembran en DB.
COMERCIOS: Dict[str, Dict[str, Any]] = {
    "la-anonima": {
        "slug": "la-anonima",
        "nombre": "La Anónima",
        "tipo": "supermercado",
        "base_url": "https://www.laanonima.com.ar",
        "scraping_modo": "html",
        "color": "#D91F26",
        "sucursales": [
            {"codigo": d["codigo"], "nombre": d["nombre"], "provincia": d.get("provincia", "Chubut"), "tipo_sucursal": "supermercado"}
            for d in SUCURSALES_DATA.values()
        ],
    },
    "carrefour": {
        "slug": "carrefour",
        "nombre": "Carrefour",
        "tipo": "hipermercado",
        "base_url": "https://www.carrefour.com.ar",
        "scraping_modo": "vtex",
        "color": "#00478F",
        "sucursales": [
            {"codigo": "CARREFOUR_PTO_MADRYN_HIPER", "nombre": "Puerto Madryn Hiper", "provincia": "Chubut", "tipo_sucursal": "supermercado"},
            {"codigo": "CARREFOUR_PTO_MADRYN_MARKET", "nombre": "Puerto Madryn Market", "provincia": "Chubut", "tipo_sucursal": "supermercado"},
            {"codigo": "CARREFOUR_TRELEW", "nombre": "Trelew", "provincia": "Chubut", "tipo_sucursal": "supermercado"},
            {"codigo": "CARREFOUR_COMODORO", "nombre": "Comodoro Rivadavia", "provincia": "Chubut", "tipo_sucursal": "supermercado"},
        ],
    },
    "jumbo": {
        "slug": "jumbo",
        "nombre": "Jumbo",
        "tipo": "hipermercado",
        "base_url": "https://www.jumbo.com.ar",
        "scraping_modo": "vtex",
        "color": "#E4002B",
        "sucursales": [
            {"codigo": "JUMBO_COMODORO", "nombre": "Comodoro Rivadavia", "provincia": "Chubut", "tipo_sucursal": "supermercado"},
        ],
    },
    "vea": {
        "slug": "vea",
        "nombre": "Vea",
        "tipo": "supermercado",
        "base_url": "https://www.vea.com.ar",
        "scraping_modo": "vtex",
        "color": "#F58220",
        "sucursales": [
            {"codigo": "VEA_TRELEW", "nombre": "Trelew", "provincia": "Chubut", "tipo_sucursal": "supermercado"},
            {"codigo": "VEA_PTO_MADRYN", "nombre": "Puerto Madryn", "provincia": "Chubut", "tipo_sucursal": "supermercado"},
        ],
    },
    "mas-online": {
        "slug": "mas-online",
        "nombre": "Mas Online",
        "tipo": "supermercado",
        "base_url": "https://www.masonline.com.ar",
        "scraping_modo": "vtex",
        "color": "#F03D2F",
        "sucursales": [
            {"codigo": "MAS_ONLINE_COMODORO", "nombre": "Comodoro Rivadavia", "provincia": "Chubut", "tipo_sucursal": "supermercado"},
            {"codigo": "MAS_ONLINE_TRELEW", "nombre": "Trelew", "provincia": "Chubut", "tipo_sucursal": "supermercado"},
        ],
    },
    "yaguar": {
        "slug": "yaguar",
        "nombre": "Yaguar",
        "tipo": "mayorista",
        "base_url": "https://yaguar.com.ar",
        "scraping_modo": "woocommerce",
        "color": "#78BE20",
        "sucursales": [
            {"codigo": "YAGUAR_TRELEW", "nombre": "Trelew", "provincia": "Chubut", "tipo_sucursal": "mayorista", "path": "/trelew"},
        ],
    },
}


def get_sucursal_config(comercio_cfg: Dict[str, Any], sucursal_query: str) -> Dict[str, Any]:
    """Resuelve una sucursal dentro de un comercio por código o coincidencia de nombre.

    Prioridad de matching:
    1. Código exacto (case-insensitive)
    2. Nombre exacto (case-insensitive)
    3. Código contiene la query
    4. Query contiene el nombre
    5. Nombre contiene la query (parcial)
    6. Primer fallback
    """
    sucursales: List[Dict[str, Any]] = comercio_cfg.get("sucursales", [])
    q = (sucursal_query or "").strip().upper()
    if not q:
        fallback = sucursales[0] if sucursales else {"codigo": "ONLINE_01", "nombre": "Online", "provincia": "", "tipo_sucursal": "supermercado"}
        return fallback

    # Pass 1: match exacto por código
    for s in sucursales:
        if q == s["codigo"].upper():
            return s

    # Pass 2: match exacto por nombre
    for s in sucursales:
        if q == s["nombre"].upper():
            return s

    # Pass 3: código contiene la query (ej: "CARREFOUR_TRELEW" matchea query "TRELEW")
    for s in sucursales:
        if q in s["codigo"].upper():
            return s

    # Pass 4: query contiene el nombre (ej: "TRELEW MAYORISTA" contiene "TRELEW")
    for s in sucursales:
        if s["nombre"].upper() in q:
            return s

    # Pass 5: nombre contiene la query (parcial inverso)
    for s in sucursales:
        if q in s["nombre"].upper():
            return s

    fallback = sucursales[0] if sucursales else {"codigo": "ONLINE_01", "nombre": "Online", "provincia": "", "tipo_sucursal": "supermercado"}
    return fallback

from typing import Dict, Any

from app.scraper.comercios_data import COMERCIOS
from app.scraper.vtex import VtexScraper
from app.scraper.woocommerce import WooCommerceScraper
from app.scraper.la_anonima import LaAnonimaScraper


def get_comercio_config(comercio_query: str) -> Dict[str, Any]:
    """Resuelve la config de un comercio por slug o coincidencia parcial de nombre."""
    q = (comercio_query or "").strip().lower()
    if q in COMERCIOS:
        return COMERCIOS[q]
    for slug, data in COMERCIOS.items():
        nombre = data["nombre"].lower()
        if q and (q in nombre or nombre in q):
            return data
    return COMERCIOS["la-anonima"]


def get_scraper(comercio_query: str, sucursal_query: str):
    """Devuelve la instancia de scraper adecuada según el modo de la cadena."""
    cfg = get_comercio_config(comercio_query)
    modo = cfg.get("scraping_modo", "html")
    if modo == "vtex":
        return VtexScraper(sucursal_query, cfg)
    if modo == "woocommerce":
        return WooCommerceScraper(sucursal_query, cfg)
    return LaAnonimaScraper(sucursal_query, cfg)

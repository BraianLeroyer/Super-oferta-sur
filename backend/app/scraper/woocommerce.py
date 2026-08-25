import logging
import re
from typing import List, Dict, Any, Optional

from app.scraper.base import BaseScraper
from app.scraper.anti_blocking import random_delay_async
from app.scraper.comercios_data import get_sucursal_config

logger = logging.getLogger(__name__)


class WooCommerceScraper(BaseScraper):
    """Scraper genérico para cadenas sobre WordPress/WooCommerce (Diarco, Yaguar).

    Usa la REST API pública de la tienda:
        /wp-json/wc/store/v1/products?per_page=100&page=N
    (o /{sucursal_path}/wp-json/wc/store/v1/products en multisitios como Yaguar).
    Paginando hasta agotar el catálogo o alcanzar el límite.
    Algunas tiendas (ej. Diarco) devuelven price 0 por API: en ese caso se
    hace un fallback scrapeando la página HTML del producto para obtener el precio.
    El "bulto cerrado" se detecta por marcadores en el título (x6 un, bulto, pack...)
    o por la cantidad mínima de compra mayorista (add_to_cart.minimum > 1).
    """

    API_PATH = "/wp-json/wc/store/v1/products"
    PAGE_SIZE = 100
    MAX_TOTAL = 30000

    _BULK_QTY_RE = re.compile(
        r"(?:x\s*)?(\d+)\s*(un|uni|u|unds|uds|unidades|botellas|latas|paquetes|paqs|unidad)\b", re.I
    )
    _BULK_WORD_RE = re.compile(r"\b(bulto|pack|paquete|docena|mayorista|caja cerrada)\b", re.I)

    def __init__(self, sucursal_query: str, comercio: Dict[str, Any]):
        super().__init__(sucursal_query, comercio)
        self.base_url = (comercio.get("base_url") or "").rstrip("/")
        suc_cfg = get_sucursal_config(comercio, sucursal_query)
        self.branch_path = suc_cfg.get("path", "")
        if not self.branch_path and comercio.get("slug") == "yaguar":
            self.branch_path = "/trelew"

    async def _fetch_price_from_page(self, permalink: str) -> Optional[float]:
        """Fallback: parsea el precio de la página HTML del producto (WooCommerce render)."""
        try:
            async with self._new_client() as client:
                resp = await client.get(permalink)
            if resp.status_code != 200:
                return None
            html = resp.text

            patterns = [
                r'<meta\s+itemprop="price"\s+content="([0-9.,]+)"',
                r'<meta\s+property="product:price:amount"\s+content="([0-9.,]+)"',
                r'<span\s+class="woocommerce-Price-amount amount">\s*\$?\s*([0-9.,]+)',
                r'data-price="([0-9.,]+)"',
            ]
            for pat in patterns:
                m = re.search(pat, html)
                if m:
                    price = self._parse_price(m.group(1))
                    if price is not None and price > 0:
                        return price
        except Exception as e:
            logger.warning(f"[WOO {self.comercio['nombre']}] fallback de precio falló para {permalink}: {e}")
        return None

    def _detect_bulk(self, titulo: str, price: float) -> Dict[str, Any]:
        """Detecta presentación de bulto cerrado a partir del título."""
        m_qty = self._BULK_QTY_RE.search(titulo or "")
        m_word = self._BULK_WORD_RE.search(titulo or "")
        if m_qty:
            qty = int(m_qty.group(1))
            descripcion_bulto = f"Bulto x{qty}"
            precio_unitario = round(price / qty, 2) if qty > 0 and price else price
            return {
                "precio_bulto": price,
                "descripcion_bulto": descripcion_bulto,
                "precio_lista": precio_unitario,
            }
        if m_word:
            return {
                "precio_bulto": price,
                "descripcion_bulto": "Bulto",
                "precio_lista": price,
            }
        return {}

    async def _normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        titulo = raw.get("name") or ""
        sku = (raw.get("sku") or "").strip() or str(raw.get("id") or "").strip()
        permalink = raw.get("permalink")

        prices = raw.get("prices") or {}
        price = self._parse_price(prices.get("price"))
        regular = self._parse_price(prices.get("regular_price")) or price
        sale = self._parse_price(prices.get("sale_price"))

        if price is None or price <= 0:
            price = await self._fetch_price_from_page(permalink) if permalink else None
            if price is not None:
                regular = regular or price

        # Sin precio público real (ej. Diarco, que lo oculta a invitados): se descarta.
        if price is None or price <= 0:
            return None

        images = raw.get("images") or []
        imagen = images[0].get("src") if images else None
        cats = raw.get("categories") or []
        categoria = " > ".join([c.get("name", "") for c in cats if c.get("name")]) if cats else ""
        marca = ""
        unidad = self._parse_unit(titulo)

        add_to_cart = raw.get("add_to_cart") or {}
        min_qty = int(add_to_cart.get("minimum") or 1)

        precio_bulto = None
        descripcion_bulto = None
        precio_oferta = None

        if price is not None and price > 0:
            bulk = self._detect_bulk(titulo, price)
            if bulk:
                precio_bulto = round(bulk["precio_bulto"], 2)
                descripcion_bulto = bulk["descripcion_bulto"]
                precio_lista = bulk["precio_lista"]
            elif min_qty > 1:
                precio_bulto = round(price * min_qty, 2)
                descripcion_bulto = f"Bulto x{min_qty}"
                precio_lista = price
            else:
                precio_lista = price
                if sale is not None and sale < price:
                    precio_oferta = round(sale, 2)
        else:
            precio_lista = price if price is not None else 0.0

        descripcion = (f"{titulo} de la marca {marca}. Disponible en {self.comercio['nombre']}."
                       + (f" Categoría {categoria}." if categoria else ""))

        return {
            "sku": sku,
            "titulo": titulo,
            "marca": marca,
            "descripcion": descripcion,
            "imagen_url": imagen,
            "unidad_medida": unidad,
            "url_producto": permalink,
            "categoria": categoria,
            "precio_lista": round(precio_lista, 2),
            "precio_oferta": precio_oferta,
            "es_oferta_club": False,
            "disponible": bool(raw.get("is_in_stock", True)),
            "precio_bulto": precio_bulto,
            "descripcion_bulto": descripcion_bulto,
        }

    async def run_extraction(self, limit: int = 100, *args, **kwargs) -> List[Dict[str, Any]]:
        productos: List[Dict[str, Any]] = []
        seen: set = set()
        page = 1
        max_total = self.MAX_TOTAL if limit is None else min(limit, self.MAX_TOTAL)
        api_path = f"{self.branch_path}{self.API_PATH}"

        while len(productos) < max_total:
            url = f"{self.base_url}{api_path}?per_page={self.PAGE_SIZE}&page={page}&orderby=id&order=asc"
            try:
                await random_delay_async(0.05, 0.1)
                async with self._new_client() as client:
                    resp = await client.get(url)
                if resp.status_code in (403, 429):
                    logger.warning(f"[WOO {self.comercio['nombre']}] bloqueo ({resp.status_code}) en página {page}")
                    break
                if resp.status_code != 200:
                    logger.warning(f"[WOO {self.comercio['nombre']}] status {resp.status_code} en página {page}")
                    break
                data = resp.json()
                if not data:
                    break
                for raw in data:
                    norm = await self._normalize(raw)
                    if norm is None or norm["sku"] in seen:
                        continue
                    seen.add(norm["sku"])
                    productos.append(norm)
                if len(data) < self.PAGE_SIZE:
                    break
                page += 1
            except Exception as e:
                logger.warning(f"[WOO {self.comercio['nombre']}] error en página {page}: {e}")
                break

        logger.info(f"[WOO {self.comercio['nombre']}] extraídos {len(productos)} productos.")
        return productos[:limit] if limit else productos

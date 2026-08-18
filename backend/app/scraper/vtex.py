import logging
from typing import List, Dict, Any

from app.scraper.base import BaseScraper
from app.scraper.anti_blocking import random_delay_async

logger = logging.getLogger(__name__)


class VtexScraper(BaseScraper):
    """Scraper genérico para cadenas sobre plataforma VTEX (Carrefour, Jumbo, Vea, Mas Online).

    Usa la API pública de búsqueda del catálogo:
        /api/catalog_system/pub/products/search/?_from=0&_to=999
    Paginando en bloques de 1000 hasta agotar el catálogo o alcanzar el límite.
    El "bulto cerrado" se detecta por items con unitMultiplier > 1 dentro del producto.
    """

    API_PATH = "/api/catalog_system/pub/products/search"
    # El endpoint products/search limita la ventana por request a 50 ítems
    # (_to=_from+49; ventanas mayores devuelven HTTP 400).
    PAGE_SIZE = 50
    MAX_TOTAL = 50000

    def __init__(self, sucursal_query: str, comercio: Dict[str, Any]):
        super().__init__(sucursal_query, comercio)
        self.base_url = (comercio.get("base_url") or "").rstrip("/")

    @staticmethod
    def _parse_categorias(categories: List[str]) -> str:
        if not categories:
            return ""
        parts = [p.strip() for p in categories[0].split("/") if p.strip()]
        return " > ".join(parts)

    @staticmethod
    def _get_offer(item: Dict[str, Any]) -> Dict[str, Any]:
        sellers = item.get("sellers") or []
        seller = next((s for s in sellers if s.get("sellerDefault")), sellers[0] if sellers else {})
        return seller.get("commertialOffer") or {}

    def _normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        items = raw.get("items") or []
        if not items:
            return None

        unit_item = next((i for i in items if float(i.get("unitMultiplier", 1) or 1) <= 1), items[0])
        bulk_item = next((i for i in items if float(i.get("unitMultiplier", 1) or 1) > 1), None)

        offer = self._get_offer(unit_item)
        price = self._parse_price(offer.get("Price"))
        list_price = self._parse_price(offer.get("ListPrice"))
        if list_price is not None and price is not None and list_price > price * 10:
            # Jumbo y Vea devuelven ListPrice en CÉNTIMOS (ej. 244253 = $2442,53)
            # mientras que Price viene en pesos. Se normaliza a pesos.
            list_price = round(list_price / 100, 2)
        list_price = list_price or price
        if list_price is None:
            list_price = self._parse_price(offer.get("PriceWithoutDiscount")) or price

        images = unit_item.get("images") or []
        imagen = images[0].get("imageUrl") if images else None

        categoria = self._parse_categorias(raw.get("categories") or [])
        titulo = raw.get("productName") or raw.get("productTitle") or ""
        marca = raw.get("brand") or ""
        ref = raw.get("productReference") or raw.get("productId") or str(raw.get("id") or "")
        sku = str(ref).strip()
        link = raw.get("linkText") or ""
        url_producto = f"{self.base_url}/{link}/p" if link else self.base_url
        unit = unit_item.get("measurementUnit") or "un"

        precio_oferta = None
        if price is not None and list_price is not None and price < list_price:
            precio_oferta = round(price, 2)

        precio_bulto = None
        descripcion_bulto = None
        if bulk_item:
            bulk_offer = self._get_offer(bulk_item)
            bprice = self._parse_price(bulk_offer.get("Price"))
            mult = int(float(bulk_item.get("unitMultiplier", 1) or 1))
            if bprice is not None and bprice > 0:
                precio_bulto = round(bprice, 2)
                descripcion_bulto = f"Bulto x{mult}"

        descripcion = (f"{titulo} de la marca {marca}. Disponible en {self.comercio['nombre']}."
                       + (f" Categoría {categoria}." if categoria else ""))

        return {
            "sku": sku,
            "titulo": titulo,
            "marca": marca,
            "descripcion": descripcion,
            "imagen_url": imagen,
            "unidad_medida": unit,
            "url_producto": url_producto,
            "categoria": categoria,
            "precio_lista": round(list_price, 2) if list_price is not None else 0.0,
            "precio_oferta": precio_oferta,
            "es_oferta_club": False,
            "disponible": bool(offer.get("IsAvailable", True)),
            "precio_bulto": precio_bulto,
            "descripcion_bulto": descripcion_bulto,
        }

    async def run_extraction(self, limit: int = 100) -> List[Dict[str, Any]]:
        productos: List[Dict[str, Any]] = []
        seen: set = set()
        _from = 0
        max_total = self.MAX_TOTAL if limit is None else min(limit, self.MAX_TOTAL)

        while len(productos) < max_total:
            _to = _from + self.PAGE_SIZE - 1
            url = f"{self.base_url}{self.API_PATH}/?_from={_from}&_to={_to}"
            try:
                await random_delay_async(0.3, 0.8)
                async with self._new_client() as client:
                    resp = await client.get(url, headers={"Accept": "application/json"})
                if resp.status_code in (403, 429):
                    logger.warning(f"[VTEX {self.comercio['nombre']}] bloqueo ({resp.status_code}) en _from={_from}")
                    break
                if resp.status_code not in (200, 206):
                    logger.warning(f"[VTEX {self.comercio['nombre']}] status {resp.status_code} en _from={_from}")
                    break
                data = resp.json()
                if not data:
                    break
                for raw in data:
                    norm = self._normalize(raw)
                    if norm is None or norm["sku"] in seen:
                        continue
                    seen.add(norm["sku"])
                    productos.append(norm)
                if len(data) < self.PAGE_SIZE:
                    break
                _from += self.PAGE_SIZE
            except Exception as e:
                logger.warning(f"[VTEX {self.comercio['nombre']}] error en _from={_from}: {e}")
                break

        logger.info(f"[VTEX {self.comercio['nombre']}] extraídos {len(productos)} productos.")
        return productos[:limit] if limit else productos

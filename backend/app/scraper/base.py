import abc
import re
from typing import List, Dict, Any
import httpx

from app.scraper.anti_blocking import get_anti_blocking_headers


class BaseScraper(abc.ABC):
    """Interfaz común para los scrapers de cada cadena."""

    def __init__(self, sucursal_query: str, comercio: Dict[str, Any]):
        self.sucursal_query = sucursal_query
        self.comercio = comercio
        self.headers = get_anti_blocking_headers()

    @staticmethod
    def _parse_price(text: Any):
        if text is None:
            return None
        if isinstance(text, (int, float)):
            return float(text)
        t = str(text).replace("$", "").replace(" ", "").strip()
        if not t:
            return None
        t = re.sub(r"\.(?=\d{3}(?:\.|$)|\..\d{2}$)", "", t)
        t = t.replace(",", ".")
        try:
            return float(t)
        except ValueError:
            return None

    @staticmethod
    def _parse_unit(titulo: str) -> str:
        m = re.search(r"x\s*([0-9.,]+\s*[a-zA-Z.]+)\s*\.?\s*$", titulo or "")
        return m.group(1).strip() if m else ""

    def _new_client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=self.headers)

    @abc.abstractmethod
    async def run_extraction(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Extrae y normaliza productos de la cadena. limit=None extrae el catálogo completo."""
        raise NotImplementedError

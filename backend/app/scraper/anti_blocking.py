import random
import time
import asyncio
from typing import Dict

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15"
]

def get_random_user_agent() -> str:
    return random.choice(USER_AGENTS)

def get_anti_blocking_headers(extra_headers: Dict[str, str] = None) -> Dict[str, str]:
    headers = {
        "User-Agent": get_random_user_agent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0"
    }
    if extra_headers:
        headers.update(extra_headers)
    return headers

async def random_delay_async(min_seconds: float = 0.5, max_seconds: float = 2.5):
    """Introduce una latencia aleatoria para evitar detección de scraper."""
    delay = random.uniform(min_seconds, max_seconds)
    await asyncio.sleep(delay)

def random_delay_sync(min_seconds: float = 0.5, max_seconds: float = 2.5):
    delay = random.uniform(min_seconds, max_seconds)
    time.sleep(delay)

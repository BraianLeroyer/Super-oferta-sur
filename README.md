# 🛒 Super Oferta Sur

> **Plataforma inteligente de monitoreo, scraping y comparación de precios en tiempo real para supermercados y mayoristas de la Patagonia (Chubut, Argentina).**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Astro](https://img.shields.io/badge/Astro_SSR-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![React](https://img.shields.io/badge/React_Islands-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🌐 Enlaces en Producción y Local

| Servicio | Entorno de Producción | Entorno Local |
| :--- | :--- | :--- |
| **Portal Público de Catálogo** | [super-oferta-sur.vercel.app](https://super-oferta-sur.vercel.app) | `http://localhost:4321` |
| **Backend REST API + Docs** | [super-oferta-sur.onrender.com/docs](https://super-oferta-sur.onrender.com/docs) | `http://localhost:8000/docs` |
| **Panel de Control Admin** | — | `http://localhost:3000` |

---

## 📝 Descripción del Proyecto

**Super Oferta Sur** es una plataforma integral para centralizar, auditar y comparar precios y ofertas de las principales cadenas de supermercados y mayoristas que operan en la provincia de **Chubut (Patagonia Argentina)**.

El sistema ejecuta tareas asíncronas y resilientes de **web scraping en vivo** e ingestión por API (HTML en vivo, VTEX Catalog System y WooCommerce REST API), normalizando cientos de miles de registros de precios por sucursal, detectando ofertas del club, descuentos bancarios y precios mayoristas por bulto cerrado.

---

## 🏪 Cobertura Multi-Mercado (6 Cadenas y 19 Sucursales Activas)

El sistema monitorea en paralelo **6 comercios activos** distribuidos en **19 sucursales** de las principales ciudades de Chubut:

```
                  ┌────────────────────────────────────────────────────────┐
                  │                   SUPER OFERTA SUR                     │
                  └───────────────────────────┬────────────────────────────┘
                                              │
         ┌───────────────────┬────────────────┼──────────────────┬──────────────────┐
         │                   │                │                  │                  │
   [La Anónima]        [Carrefour]         [Jumbo]             [Vea]          [Mas Online / Yaguar]
   (5 sucursales)     (4 sucursales)    (1 sucursal)       (2 sucursales)     (3 sucursales)
```

| Comercio | Tipo | Color | Sucursales Monitoreadas en Chubut | Motor de Scraping |
| :--- | :--- | :---: | :--- | :--- |
| **La Anónima** | Supermercado | `#D91F26` | **Trelew 01, Rawson 01, Puerto Madryn 01, Comodoro Rivadavia 01, Esquel 01** (5) | Scraping HTML en vivo + Catálogo 16.165 productos |
| **Carrefour** | Hipermercado | `#00478F` | **Puerto Madryn Hiper, Puerto Madryn Market, Trelew, Comodoro Rivadavia** (4) | VTEX Catalog API Multi-Departamento |
| **Jumbo** | Hipermercado | `#E4002B` | **Comodoro Rivadavia** (1) | VTEX API + Precios Cencosud e Importados |
| **Vea** | Supermercado | `#F58220` | **Trelew, Puerto Madryn** (2) | VTEX API + Promociones Cencosud (3x2, 2do al 70%) |
| **Mas Online** | Supermercado | `#F03D2F` | **Comodoro Rivadavia, Trelew** (2) | VTEX API + Marcas Great Value y GDN |
| **Yaguar** | Mayorista | `#78BE20` | **Trelew** (1) | WooCommerce REST Store API + Precios por Bulto |

---

## 🚀 Características Principales

- ⚡ **Carga Web Instantánea (< 0.25s)**: Paginación progresiva por demanda (`fetchProductos({ page: 1, limit: 60 })`) con botón interactivo *"Cargar más productos"* y caché de categorías en memoria (< 1ms).
- 🔍 **Buscador Universal con Acentos Flexibles**: Búsqueda tokenizada insensible a mayúsculas/minúsculas y acentos (`jabon` encuentra `Jabón Líquido`, `vino tinto` encuentra tintos de todas las marcas).
- ⚖️ **Comparador de Precios Inter-Comercio**: Compara cualquier producto contra las demás cadenas para encontrar automáticamente el precio más bajo de la región.
- 📦 **Soporte Mayorista y Bulto Cerrado**: Detección automática de packs (`Bulto x3`, `Bulto x6`, `Bulto x10`) con visualización de precio unitario y precio total por bulto (exclusivo Yaguar).
- 🏷️ **Ofertas Semanales y Beneficios Club**: Badges dinámicos de ofertas en vivo (Ofertas Semanales de Yaguar, Club La Anónima, Mi Carrefour, Cencosud).
- 🤖 **Lista de Compras Interactiva con Asistente**: Guardá productos en tu carrito local persistente y calculá el total estimado de tu compra.
- 🛡️ **Streaming en Chunks de 300 Items y Garantía RAM < 50MB**: Ingestión por lotes con purgado de memoria (`db.expunge()` + `gc.collect()`) para operar sin interrupciones en entornos de recursos limitados (Render Free Tier 512MB).
- 🗺️ **SEO & Google Search Console Ready**: Meta tag de verificación integrado, generación dinámica de `sitemap.xml` y `robots.txt`.

---

## 🏗️ Arquitectura del Monorepo

```
Project/
├── docker-compose.yml          # Orquestación completa (DB, Redis, Backend, Celery, 2 Frontends)
├── start_project.sh            # Script para iniciar todo con docker compose
├── backend/                    # Backend FastAPI + Celery + Scrapers
│   ├── app/
│   │   ├── api/                # Endpoints REST (products, sucursales, comercios, comparison, scraper)
│   │   ├── models/             # Modelos SQLAlchemy (Comercio, Sucursal, Producto, PrecioHistorial, ScraperJob)
│   │   ├── schemas/            # Validación de datos con Pydantic
│   │   ├── scraper/            # Scrapers modulares (vtex.py, woocommerce.py, la_anonima.py)
│   │   ├── tasks/              # Tareas asíncronas de Celery (scraper_tasks.py)
│   │   └── seed.py             # Siembra inicial ultra rápida con propagación in-memory
│   └── entrypoint.sh           # Espera a PostgreSQL y ejecuta Uvicorn
├── frontend-public/            # Portal público de catálogo (Astro SSR + React Islands + Tailwind)
│   └── src/
│       ├── components/         # Componentes React (ProductCatalogApp, Header, ProductCard, etc.)
│       ├── layouts/            # Layout general con Google Search Console meta tags
│       └── pages/              # Páginas Astro (index, sucursales, sobre-nosotros, terminos, privacidad)
└── frontend-admin/             # Panel de administración (Next.js 14 App Router + Tailwind)
    └── src/app/                # Páginas de gestión de jobs, productos, comercios y sucursales
```

---

## 🛠️ Instalación y Puesta en Marcha Local

### Prerrequisitos
- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/) instalados.
- Git.

### 1. Clonar el repositorio
```bash
git clone https://github.com/BraianLeroyer/Super-oferta-sur.git
cd Super-oferta-sur
```

### 2. Levantar los servicios con Docker Compose
```bash
docker compose up --build -d
```

### 3. Acceder a las aplicaciones locales
* 🌐 **Portal Público (Astro):** [http://localhost:4321](http://localhost:4321)
* ⚙️ **Backend REST API (FastAPI Docs):** [http://localhost:8000/docs](http://localhost:8000/docs)
* 📊 **Panel de Administración (Next.js):** [http://localhost:3000](http://localhost:3000)

---

## 📡 Endpoints Principales de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/v1/comercios` | Lista los comercios activos (La Anónima, Carrefour, Jumbo, Vea, Mas Online, Yaguar). |
| `GET` | `/api/v1/sucursales?comercio_id={id}` | Lista las sucursales filtradas por comercio. |
| `GET` | `/api/v1/products` | Catálogo de productos con filtros (`search`, `categoria`, `marca`, `comercio`, `sucursal`, `bulto_cerrado`, `page`, `limit`). |
| `GET` | `/api/v1/products/categories` | Lista las categorías únicas disponibles por comercio (con caché < 1ms). |
| `GET` | `/api/v1/products/suggestions?q={texto}` | Autocompletado rápido de productos para la barra de búsqueda. |
| `GET` | `/api/v1/comparison?q={texto}` | Compara el precio de un término en todos los comercios disponibles. |
| `GET` | `/api/v1/products/{id}/compare-prices` | Comparativa directa de un producto específico contra las demás cadenas. |
| `POST` | `/api/v1/scraper/trigger` | Dispara una tarea asíncrona de scraping para una sucursal o comercio. |
| `GET` | `/api/v1/scraper/jobs` | Historial y estado de las tareas de scraping (`RUNNING`, `FINISHED`, `FAILED`). |

---

## 📄 Licencia

Este proyecto fue desarrollado para monitoreo de precios y transparencia al consumidor en la Patagonia Argentina. Todos los derechos de marcas, logos e imágenes pertenecen a sus respectivos comercios.


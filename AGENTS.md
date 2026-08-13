# AGENTS.md — Guía del Proyecto "La Anónima Scraper & Portal"

## Resumen general

Sistema monorepo para scrapear, almacenar y visualizar precios de **Supermercados La Anónima** por sucursal (Chubut / Patagonia). Incluye un backend REST API (FastAPI) con tareas asíncronas de scraping (Celery + Redis), un portal público de catálogo (Astro SSR + React) y un panel de administración (Next.js App Router). Todo se orquesta con Docker Compose.

URLs de servicios en local:
- Portal Público (Astro): http://localhost:4321
- Panel Admin (Next.js): http://localhost:3000
- Backend API + Docs (FastAPI): http://localhost:8000/docs

## Arquitectura y estructura de directorios

```
Project/
├── docker-compose.yml          # Orquestación de los 6 servicios
├── start_project.sh            # Levanta todo con docker compose up --build -d
├── install_docker.sh           # Instalador Docker CE para Linux Mint 22 (Ubuntu noble)
├── README.md                   # Presentación "Super Oferta Sur" + catálogo de ofertas (datos reales de la API)
├── backend/                    # API REST FastAPI + Celery + Scraper
├── frontend-admin/             # Panel de control admin (Next.js App Router + Tailwind)
└── frontend-public/            # Portal público de catálogo (Astro SSR + React islands)
```

### Servicios de Docker Compose
1. **db**: PostgreSQL 16 (`laanonima_postgres`), puerto **5433 en el host** (mapeado a 5432 interno), DB `la_anonima_db`, user/pass `postgres`/`postgres`. **Nota:** el puerto host es 5433 para no chocar con un PostgreSQL local en 5432.
2. **redis**: Redis 7 (`laanonima_redis`), puerto 6379 (broker Celery + cache).
3. **backend**: API FastAPI (`laanonima_backend`), puerto 8000. Depende de db y redis sanos. Es el único que corre `entrypoint.sh` (espera DB + seed).
4. **celery_worker**: Worker Celery (`laanonima_celery_worker`), comando `celery -A app.tasks.celery_app worker --loglevel=info`. **Saltea el seed**: su `entrypoint` se sobrescribe en compose (`/bin/sh -c`) para no duplicar el seeding que hace el backend.
5. **frontend_public**: Astro SSR (`laanonima_frontend_public`), puerto 4321.
6. **frontend_admin**: Next.js (`laanonima_frontend_admin`), puerto 3000.

Variables de entorno usadas por los contenedores:
- `DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/la_anonima_db`
- `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND=redis://redis:6379/0`
- `PUBLIC_API_URL=http://localhost:8000/api/v1` (navegador) / `INTERNAL_API_URL=http://backend:8000/api/v1` (server-side) para los frontends.

## Backend (FastAPI) — `backend/`

- Python 3.11, imagen `python:3.11-slim`. Endpoints bajo el prefijo `/api/v1`.
- `entrypoint.sh`: espera a PostgreSQL (hasta 30 intentos), ejecuta `python -m app.seed` y luego lanza uvicorn. Convierte `postgresql+psycopg2://` → `postgresql://` para la comprobación con psycopg2 (que no acepta el prefijo SQLAlchemy). Se ejecuta con `-m app.seed` (no `app/seed.py`) porque al correr un script el cwd no entra en `sys.path` y falla con `ModuleNotFoundError: No module named 'app'`.
- `app/main.py`: crea la app, CORS abierto (`*`), en startup crea tablas (`Base.metadata.create_all`) y ejecuta el seed.
- `app/config.py`: `Settings` (pydantic-settings) con `PROJECT_NAME`, `VERSION`, `API_V1_STR=/api/v1` y URLs de DB/Redis/Celery.
- `app/database.py`: engine SQLAlchemy con pool (size 10, overflow 20), `SessionLocal`, `Base` y dependencia `get_db`.

### Modelos (SQLAlchemy) — `app/models/`
- **Sucursal** (`sucursales`): `id`, `codigo_sucursal` (unique), `nombre`, `provincia` (default "Chubut"), `creado_en`.
- **Producto** (`productos`): `id`, `sku` (unique, index), `titulo`, `marca`, `descripcion`, `imagen_url`, `unidad_medida`, `url_producto`, `categoria`, timestamps. Relación `precios_historial` con cascade delete.
- **PrecioHistorial** (`precios_historial`): `id` (BigInteger), `producto_id`, `sucursal_id` (FKs con CASCADE), `precio_lista`, `precio_oferta`, `es_oferta_club`, `disponible`, `fecha_captura` (index). Índices por sucursal y fecha.
- **ScraperJob** (`scraper_jobs`): `id` (UUID), `sucursal_id`, `estado` (`PENDING|RUNNING|FINISHED|FAILED`), `total_scrapeados`, `total_errores`, `mensaje_error`, `iniciado_en`, `finalizado_en`.

### Schemas (Pydantic) — `app/schemas/`
- `SucursalBase/Create/Out`, `ProductoBase/Create/Out/DetailOut`, `PrecioHistorialBase/Create/Out`, `ScraperTriggerRequest` (`sucursal`, `limite_productos`), `ScraperJobOut`.
- `ProductoBase` incluye `descripcion`, `url_producto`, `categoria`. `ProductoOut` incluye `precio_actual_lista/oferta`, `es_oferta_club`, `disponible`, `sucursal_nombre`. `ProductoDetailOut` agrega `historial_precios`.

### Endpoints de la API
- **GET `/api/v1/sucursales`** — lista sucursales. **POST `/api/v1/sucursales`** — crea sucursal (400 si el código ya existe).
- **GET `/api/v1/products`** — filtros: `search` (**búsqueda general**: cada palabra debe aparecer en título, marca, categoría o SKU; insensible a MAYÚS/acentos, ej. "jabon" encuentra "Jabón"; regex Postgres `~*`), `marca`, `categoria`, `min_price`, `max_price`, `sucursal_id`, `sucursal` (nombre/código por texto), `page`, `limit` (≤500, default 100). Resuelve sucursal por texto si no viene `sucursal_id`. Devuelve último precio por producto.
- **GET `/api/v1/products/categories`** — lista las categorías disponibles del catálogo (distinct, ordenadas).
- **GET `/api/v1/products/{id}/price-history`** — historial de precios (opcional `sucursal_id`), 404 si el producto no existe.
- **POST `/api/v1/scraper/trigger`** — recibe `sucursal` + `limite_productos`, crea/encuentra la sucursal, crea un `ScraperJob` PENDING y encola en Celery (`run_scraper_job_task.delay`); si Celery falla, ejecuta la tarea vía `BackgroundTasks` de FastAPI.
- **GET `/api/v1/scraper/jobs`** — lista jobs ordenados por `iniciado_en` desc.
- **GET `/`** (health básico) y **GET `/health`**.

### Tareas Celery — `app/tasks/`
- `celery_app.py`: app Celery "la_anonima_tasks", JSON serializer, timezone `America/Argentina/Buenos_Aires`.
- `scraper_tasks.py`: `run_scraper_job_task(job_id, sucursal_query, limit)` — ejecuta la extracción (asyncio), hace upsert de productos por SKU, crea registros de `PrecioHistorial`, actualiza el job a FINISHED/FAILED. Usa **commits por lote** (cada 200 items) para el catálogo completo (16.165 productos × 5 sucursales).

### Motor de scraping — `app/scraper/`
- `sucursal_session.py`: diccionario `SUCURSALES_DATA` con 5 sucursales: **TRELEW_01, RAWSON_01, MADRYN_01, COMODORO_01, ESQUEL_01** (todas en Chubut, con zip_code, store_id y cookies simuladas). `get_sucursal_session_config()` resuelve por código o coincidencia parcial de nombre (fallback: Trelew).
- `anti_blocking.py`: rotación de user-agents, headers anti-bot y delays aleatorios (sync/async).
- `engine.py`: `LaAnonimaScraper.run_extraction()` — scraping **en vivo** de categorías reales de `https://www.laanonima.com.ar/` (lista `CATEGORIAS_REALES` con **38 categorías representativas** por departamento; httpx + User-Agent de navegador + headers anti-bot, parseando las tarjetas `id-codigo-producto` con `data-nombre`, `data-marca`, `data-precio`, precio tachado vs `.precio.plus`, imagen CloudFront, `data-rutacategorias`). Si el sitio bloquea (403) o no llega al límite, completa con `PRODUCTOS_CATALOGO_BASE` (catálogo completo, ver `catalogo.py`) aplicando una variación aleatoria ±2% por sucursal. **Dedup por SKU**: los productos ya obtenidos en vivo no se repiten en el fallback (ni entre categorías del scraping en vivo).
- `catalogo.py`: módulo con `PRODUCTOS_CATALOGO_BASE` — el **catálogo completo del sitio**: **16.165 productos reales** de las 442 páginas de categoría (112 departamentos, 16 familias de productos, 2.023 con oferta, 361 categorías). Booleans en Python (`True`/`False`, no JSON). **No editar a mano**: se regenera desde el harvest (`/tmp/opencode/catalogo_real_full.json` → `catalogo_uniq.json`, generado con `harvest_full.py`). Cada producto trae `sku`, `titulo`, `marca`, `descripcion`, `imagen_url` (CloudFront, HTTP 200), `unidad_medida`, `url_producto` y `categoria`.

### Seeding — `app/seed.py`
- Crea tablas, siembra las 5 sucursales y ejecuta un scraping inicial con `limit = len(PRODUCTOS_CATALOGO_BASE)` (16.165, catálogo completo del sitio) para cada sucursal que aún no tenga precios registrados.
- El seed usa la **estrategia rápida**: raspa en vivo las 38 categorías representativas de `CATEGORIAS_REALES` por sucursal y completa el resto del catálogo desde `PRODUCTOS_CATALOGO_BASE` (precios reales del harvest con variación ±2%). El seed completo tarda ~15-20 min (live scraping 38 categorías × 5 sucursales + upsert batch de 80.825 precios).
- Para cada sucursal sin precios **crea antes el registro `ScraperJob`** (estado PENDING) y luego invoca `run_scraper_job_task(str(job_id), ...)`: si no existiera el job, la tarea aborta con "Job no encontrado" y no puebla nada.
- Se ejecuta solo desde el backend (`entrypoint.sh` con `python -m app.seed`) y de nuevo en el startup de `main.py`; el worker Celery lo saltea.

## Problemas encontrados y corregidos (historial de fixes)

1. **Conflicto de puerto 5432** (bloqueaba todo el stack): un PostgreSQL local ocupaba el 5432 y el contenedor `db` mapeaba `5432:5432`; el bind fallaba, `laanonima_postgres` quedaba en estado `created` y por dependencias no arrancaba backend ni frontends. **Fix:** mapear el host a `5433:5432` en `docker-compose.yml` (la URL interna `db:5432` no cambia).
2. **`entrypoint.sh` no podía conectar a la DB**: `psycopg2.connect()` rechaza el prefijo SQLAlchemy `postgresql+psycopg2://` (`invalid dsn`), quemaba los 30 intentos. **Fix:** convertir la URL a `postgresql://` antes de la comprobación.
3. **Seed rompía el arranque**: `python app/seed.py` fallaba con `ModuleNotFoundError: No module named 'app'` (al correr un script, el cwd no entra en `sys.path`); con `set -e` el contenedor entraba en crash-loop. **Fix:** usar `python -m app.seed`.
4. **Seed duplicaba jobs**: `celery_worker` usa la misma imagen con el mismo `entrypoint.sh`, así que también corría el seed y duplicaba datos/jobs en la primer corrida. **Fix:** sobrescribir su `entrypoint` en compose (`["/bin/sh", "-c"]`) para que solo ejecute Celery.
5. **Seed no poblaba datos**: se llamaba a `run_scraper_job_task` sin crear antes el `ScraperJob`, y la tarea aborta si no lo encuentra. **Fix:** crear el job antes de invocar la tarea.
6. **`primary_order=True` en `Sucursal.id`** (`app/models/sucursal.py`): argumento inválido de `Column`, SQLAlchemy emitía warning. **Fix:** eliminarlo.
7. **`codigo_sucursal: str` en `frontend-public/src/lib/api.ts`**: tipo inválido en TypeScript. **Fix:** cambiar a `string`.
8. **README.md "Super Oferta Sur"**: se creó en la raíz del repo presentando el proyecto y el catálogo completo con datos reales obtenidos de `GET /api/v1/products?sucursal=Trelew` (10 productos; los que tienen `precio_actual_oferta` muestran precio de oferta, el resto solo precio de lista). Si se quiere actualizar el catálogo, re-consultar la API y reescribir la sección de productos.
9. **Página `/ofertas` en el portal público**: se agregó `frontend-public/src/pages/ofertas.astro` + componente `SuperOfertaSurApp.jsx` (island `client:load`) que muestra la presentación "Super Oferta Sur" y el catálogo real de ofertas consumiendo la API (`fetchSucursales`/`fetchProductos`), reutilizando `Header`, `ProductCard` y `PriceHistoryModal`. Accesible desde la barra superior del portal (http://localhost:4321/ofertas).
10. **Descripciones de producto**: se agregó la columna `descripcion` al modelo `Producto`, se escribieron descripciones para los productos de `PRODUCTOS_CATALOGO_BASE` en `engine.py`, se incluyó en el upsert de `scraper_tasks.py`, en `ProductoBase`/`ProductoOut` y en los endpoints. Se muestra en `ProductCard.jsx` (portal) y en la tabla de `/productos` (admin). Como no hay migraciones, hubo que recrear la DB con `docker compose down -v && docker compose up --build -d` para que `create_all` generara la columna.
11. **Imágenes de productos no cargaban (403)**: las URLs `https://laanonimaonline.com.ar/paginas/images/productos/thumb/*.jpg` devuelven HTTP 403 (bloquean hotlinking). **Fix definitivo:** se migró a las imágenes **reales** de CloudFront (`d34zqip92wkcpm.cloudfront.net/web/images/productos/c/...`), que sí devuelven 200, extraídas del scraping de categorías del sitio real.
12. **Catálogo real de productos (datos de agosto 2026)**: se reemplazó el catálogo inventado por scraping **en vivo** de categorías reales de `https://www.laanonima.com.ar/` (funciona con httpx + Chrome UA + headers anti-bot; CloudFront solo bloquea requests sin UA de navegador o HEAD). Se parsean las tarjetas `id-codigo-producto` (atributos `data-nombre/marca/precio/precio_anterior/precio_oferta/existencia/rutacategorias` + span `.precio.plus` y `.tachado` para precio de oferta). Se agregaron las columnas `url_producto` y `categoria` al modelo/schemas/endpoints, se amplió `PRODUCTOS_CATALOGO_BASE` a 131 productos reales (65 con oferta, 66 sin oferta) como fallback, el seed usa `limit=131`, la API acepta `limit` hasta 500 (default 100) y los frontends piden 500. Verificado: seed con 131 productos por sucursal (HTTP 200 en vivo, 0 errores).
13. **Catálogo completo por sucursal (todas las categorías)**: se amplió el sistema de 131 a **2.836 productos reales por sucursal** (661 con oferta, 30 categorías). El catálogo se movió a un módulo propio `backend/app/scraper/catalogo.py` (regenerado desde `/tmp/opencode/catalogo_real.json` — harvest de las **22 categorías** con `harvest.py`). El seed usa `limit = len(PRODUCTOS_CATALOGO_BASE)`; el live scraping recorre las 22 URLs de `CATEGORIAS_REALES`. Como `limit` máx de la API es 500, el portal agregó `fetchAllProductos` (loop de páginas de 500) con **lazy load** (renderiza 60 y botón "Cargar más") y filtro por categoría; el admin usa paginación de 50/página y columna Categoría. Verificado: 5 sucursales FINISHED con 2.836–2.839 procesados y 0 errores (los pocos faltantes en DB son SKU ya raspados en vivo que el upsert actualiza en vez de crear). Como no hay migraciones, se recreó la DB con `docker compose down -v && docker compose up --build -d`.
14. **Catálogo completo de TODOS los departamentos (16.165 productos)**: el harvest original solo cubría 22 categorías de Almacén/Bebidas/Limpieza/Lácteos/Perfumería. Se re-cosecharon **todas las categorías del sitio** (442 páginas, 112 departamentos) con `harvest_full.py` (`/tmp/opencode/catalogo_real_full.json` → `catalogo_uniq.json`, dedup por SKU) y se regeneró `catalogo.py` con **16.165 productos únicos** (2.023 ofertas, 361 categorías, 16 familias: Electro, Moda, Calzado, Hogar, Bazar, Juguetería, Deportes, etc.). `CATEGORIAS_REALES` pasó a **38 categorías representativas** (una por área). **Fixes de calidad:** (a) dedup por SKU en `run_extraction` — los productos raspados en vivo ya no se repiten en el fallback (antes el `total_scrapeados` era mayor que los productos únicos); (b) `scraper_tasks.py` ahora usa **commits por lote (cada 200 items)** en vez de commit por item (los ~80.825 precios del seed se insertan en minutos). Verificado: 5 sucursales FINISHED con **exactamente 16.165 scrapeados y 0 errores**, 80.825 precios en DB, 16.165 productos únicos, departamentos nuevos presentes (Celulares 222, Electrodomésticos 677, Moda 411, TV/Audio 106).
15. **Limpieza de la UI del portal**: (a) se quitó el **badge de SKU/id** y el botón **"Historial"** de las tarjetas de producto (`ProductCard.jsx`) y se eliminó `PriceHistoryModal.jsx` (el historial sigue disponible vía `GET /api/v1/products/{id}/price-history`); (b) se **eliminó la página `/ofertas`** (`ofertas.astro`, `SuperOfertaSurApp.jsx` y su link en el Header); (c) el **buscador** se movió desde el Header al catálogo: ahora es un input **grande** debajo de los filtros de categoría/ofertas que filtra por nombre de producto (la búsqueda por nombre ya funcionaba en la API `search`); (d) `fetchAllProductos` subió su límite de 10.000 a **25.000 items** para que el catálogo completo (16.165) cargue en el portal.
16. **Buscador general + categorías que "no aparecían"**: el problema era doble. (a) **Búsqueda solo por titulo/SKU**: escribir "celular" no traía los productos de la categoría "Celulares y Computación" (ni "jabon" encontraba "Jabón"). **Fix:** en `app/api/products.py` el filtro `search` ahora es **general**: cada palabra debe aparecer en `titulo`, `marca`, `categoria` o `sku`, insensible a MAYÚS/minúsculas y a **acentos** (`_accent_insensitive_pattern` con regex Postgres `~*`, ej. `jabon` → `[j]ab[a]on`). (b) **Race condition en el portal**: el fetch inicial del catálogo completo (33 páginas) era lento y su `.then` resolvía *después* que el de la búsqueda, sobreescribiendo los resultados (por eso al filtrar por categoría o buscar no "aparecían"). **Fix:** en `ProductCatalogApp.jsx` se agregó **debounce de 300ms** en el buscador (`debouncedSearch`) y un **guard de secuencia** (`searchSeqRef`) que descarta respuestas de fetches anteriores.


## Frontend Admin (Next.js) — `frontend-admin/`

- Next.js 14 App Router, TypeScript, Tailwind CSS. Build `output: 'standalone'`, Docker multistage `node:20-alpine`.
- Scripts: `npm run dev` (puerto 3000), `build`, `start`, `lint`.
- Paleta Tailwind custom: `anonima.red #D91F26`, `darkred #B01319`, `navy #0F172A`, `border #E2E8F0`.
- `src/lib/api.ts`: `API_BASE_URL` (usa `NEXT_PUBLIC_API_URL` en cliente / `INTERNAL_API_URL` en servidor). Funciones: `fetchJobs`, `fetchSucursales`, `triggerScraper`, `fetchProductosAdmin` (recorre todas las páginas de 500 del catálogo).
- Páginas (`src/app/`):
  - `/` — Dashboard: métricas (sucursales, productos, items extraídos, tareas en ejecución), formulario para lanzar scraper por sucursal, tabla de últimos 8 jobs. Auto-refresh cada 5s.
  - `/jobs` — Historial/auditoría completa de scraper jobs (estados con badges). Auto-refresh cada 4s.
  - `/sucursales` — Tarjetas por sucursal con botón "Lanzar Scraper" (limit 40).
  - `/productos` — Catálogo con tabla, buscador local (título/SKU/marca), columna Categoría, imagen y **paginación client-side de 50/página** (Anterior/Siguiente + "Página X de Y").
- Componente `Sidebar.tsx` con navegación y link al portal público (4321).

## Frontend Public (Astro) — `frontend-public/`

- Astro 4 con SSR (`output: 'server'`, adapter node standalone), React islands (`@astrojs/react`) y Tailwind. Docker multistage `node:20-alpine`, corre `dist/server/entry.mjs`.
- Scripts: `npm run dev` / `start` / `build` / `preview` (puerto 4321).
- Paleta Tailwind: extiende la del admin con `gray #F8FAFC` y `yellow #FFB800`.
- `src/lib/api.ts`: `API_BASE_URL` con `PUBLIC_API_URL` / `INTERNAL_API_URL`. Funciones: `fetchSucursales`, `fetchProductos` (search, marca, min/max price, sucursal, categoria, page/limit), `fetchAllProductos` (recorre las páginas de 500 del catálogo completo, máx 25.000 items) y `fetchCategorias`.
- `src/pages/index.astro` → `ProductCatalogApp.jsx` (island `client:load`).
- Componentes:
  - `Header.jsx` — barra superior roja, selector de sucursal y link al panel admin.
  - `ProductCatalogApp.jsx` — estado central: sucursal seleccionada (default Trelew), **buscador grande por nombre** (ubicado debajo de los filtros, con **debounce de 300ms** y **guard de secuencia** `searchSeqRef` para no sobreescribir resultados con respuestas de fetches anteriores), filtro "Solo Ofertas", precio máximo, filtro por categoría (dropdown con `fetchCategorias`), **lazy load** (renderiza 60 y botón "Cargar más", contador "Mostrando X de Y").
  - `ProductCard.jsx` — tarjeta con badge de sucursal, descuento %, imagen, precios, estado de stock y categoría (sin badge de SKU ni botón "Historial").
- `src/layouts/Layout.astro` y `src/styles/global.css` (Tailwind + estilos base).

## Comandos útiles

- Levantar todo: `./start_project.sh` (equivale a `docker compose up --build -d`).
- Ver logs: `docker compose logs -f backend` (o `celery_worker`, `frontend_public`, `frontend_admin`).
- Detener: `docker compose down` (agregar `-v` para borrar el volumen `postgres_data`).
- Probar la API: `curl http://localhost:8000/api/v1/sucursales`, `curl -X POST http://localhost:8000/api/v1/scraper/trigger -H "Content-Type: application/json" -d '{"sucursal":"Trelew","limite_productos":20}'`.

## Convenciones y notas

- Todo el idioma de la UI, comentarios y nombres de tablas/endpoints está en español; los nombres de archivo/código en inglés.
- Cada producto trae `categoria` (ruta real del sitio, ej. "Almacén > Aceite, Aderezos y Condimentos > Aceite") aunque la clasificación principal es por SKU y por sucursal.
- El catálogo completo (16.165 productos) vive en `backend/app/scraper/catalogo.py` y se regenera desde el JSON del harvest (`harvest_full.py`); el live scraping recorre 38 categorías representativas y el fallback usa ese catálogo.
- El `total_scrapeados` del job cuenta items procesados. Con el dedup por SKU activado (fix #14) coincide exactamente con los productos únicos (16.165).
- Sin tests automatizados y sin migraciones Alembic en uso: las tablas se crean con `Base.metadata.create_all` (en `main.py` y `seed.py`). Alembic está en `requirements.txt` pero no configurado.
- Los precios de oferta se extraen reales del sitio (`.precio.plus` + `.tachado`) en el scraping en vivo; en el fallback se calculan con el descuento sobre el precio base.
- No usar patrones `cd <dir> && <cmd>`: usar `workdir` en los comandos.

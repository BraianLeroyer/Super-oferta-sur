# 🛒 Super Oferta Sur

## 📝 Descripción del Proyecto

Super Oferta Sur es una plataforma diseñada para centralizar y mostrar los mejores descuentos en productos de la región, permitiendo a los usuarios comparar precios y ahorrar en sus compras diarias.

El sistema **raspa en vivo** los precios del catálogo real de **Supermercados La Anónima** (`https://www.laanonima.com.ar/`) por sucursal (Trelew, Rawson, Puerto Madryn, Comodoro Rivadavia y Esquel — Chubut, Patagonia), registra el historial de cada captura y publica en tiempo real las promociones vigentes: precios de lista, precios de oferta y beneficios del Club La Anónima.

El catálogo contiene **productos reales** (SKU, título, marca, descripción, unidad, imagen CloudFront, URL del producto y categoría) cosechados de **todas las categorías del sitio** (442 páginas de categoría, 112 departamentos), con una variación regional ±2% por sucursal.

> 🌐 **Ver el catálogo en vivo:** portal público → http://localhost:4321 (catálogo real consumido desde la API, con filtros por categoría, ofertas, precio máximo y buscador por nombre de producto).

---

## 📊 Resumen del Catálogo

Precios de referencia capturados en la sucursal **Trelew (TRELEW_01)**.

| Métrica | Valor |
|---|---|
| Productos únicos en base | **16.165** |
| Productos en oferta | **2.023** (12,5%) |
| Categorías | **361** (en 16 departamentos) |
| Sucursales monitoreadas | 5 (Trelew, Rawson, Puerto Madryn, Comodoro Rivadavia, Esquel) |
| Registros de precio por sucursal | 16.165 (≈80.825 en total) |

---

## 🛍️ Catálogo por Departamento (Sucursal Trelew)

| Departamento | Productos |
|---|---|
| Hogar, jardín y automotor | 3.155 |
| Almacén | 3.018 |
| Juguetería, Librería y Bebés | 2.454 |
| Perfumería | 1.704 |
| Bebidas | 1.180 |
| Limpieza | 924 |
| Lácteos y Frescos | 692 |
| Electrodomésticos | 677 |
| Tiempo libre, deporte y entretenimiento | 580 |
| Herramientas y remodelación del hogar | 439 |
| Moda | 411 |
| Congelados | 307 |
| Frutas y Verduras | 226 |
| Celulares y Computación | 222 |
| TV, Audio y Video | 106 |
| Carnicería | 70 |

> El catálogo cubre las **16 familias de productos** del sitio online: supermercado tradicional (almacén, bebidas, limpieza, lácteos, perfumería, frescos), electro (celulares, computación, TV, audio, electrodomésticos), textil y calzado (moda), hogar (bazar, muebles, jardín), tiempo libre (deporte, juguetería, librería) y más.

---

## 🔥 Top 10 Ofertas Actuales (Trelew)

| Descuento | Precio Oferta | Precio Lista | Producto | Categoría |
|---|---|---|---|---|
| **50%** | $4.025,00 | $8.050,00 | Vino Nave Robino Blend de Blancas Botella 750cc x1 | Bebidas > Vinos y Espumantes > Blancos y Rosados |
| **50%** | $5.375,00 | $10.750,00 | Vino Tinto Malbec Dante Rabino x 750 Lt. | Bebidas > Vinos y Espumantes > Tintos |
| **50%** | $1.875,00 | $3.750,00 | Bizcochos de Arroz Tortita Negra Gallo Snacks x 100 g. | Almacén > Desayuno y Merienda > Galletitas Dulces |
| **50%** | $4.850,00 | $9.700,00 | Vino Espumante Extra Brut Nave Robino x 750 cc. | Bebidas > Vinos y Espumantes > Espumantes |
| **50%** | $4.025,00 | $8.050,00 | Vino Nave Robino Malbec Botella 750cc x1 | Bebidas > Vinos y Espumantes > Tintos |
| **50%** | $4.025,00 | $8.050,00 | Vino Nave Robino Cabernet Sauvignon Botella 750cc x1 | Bebidas > Vinos y Espumantes > Tintos |
| **50%** | $1.875,00 | $3.750,00 | Galletitas Snacks de Arroz Saladas Gallo Snacks x 100 g. | Almacén > Desayuno y Merienda > Galletitas Dulces |
| **50%** | $1.875,00 | $3.750,00 | Bizcochos de Arroz Dulce Gallo Snacks x 100 g. | Almacén > Desayuno y Merienda > Galletitas Dulces |
| **50%** | $1.675,00 | $3.350,00 | Galletitas de Arroz Crackeadas Gallo Snacks x 100 g. | Almacén > Desayuno y Merienda > Galletitas Saladas y Tostadas |
| **50%** | $5.375,00 | $10.750,00 | Vino Tinto Cabernet Sauvignon Dante Rabino x 750 Lt. | Bebidas > Vinos y Espumantes > Tintos |

> Los datos se actualizan con cada ejecución del scraper. Para regenerar esta sección, consultar `GET /api/v1/products?sucursal=Trelew&limit=500` (recorriendo todas las páginas) y reescribir el catálogo.

# 🚀 Guía de Despliegue en la Nube (100% Gratuito)
## "Super Oferta Sur — Monitor de Precios de la Patagonia"

Esta guía detalla paso a paso cómo poner en producción todos los servicios del proyecto utilizando capas gratuitas (*Free Tiers*) de proveedores modernos en la nube, sin necesidad de ingresar tarjetas de crédito con cobros automáticos.

---

## 📐 Resumen de Arquitectura en Producción

```
                                  ┌─────────────────────────────┐
                                  │   Visitantes / Navegador    │
                                  └──────────────┬──────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
        ┌───────────────────────────────┐                 ┌───────────────────────────────┐
        │   Portal Público (Astro SSR)  │                 │    Panel Admin (Next.js 14)   │
        │       Hosteado en Vercel      │                 │       Hosteado en Vercel      │
        │ https://super-oferta-sur.app  │                 │ https://admin-ofertas-sur.app │
        └───────────────┬───────────────┘                 └───────────────┬───────────────┘
                        │                                                 │
                        └────────────────────────┬────────────────────────┘
                                                 │ API Requests (REST)
                                                 ▼
                                ┌─────────────────────────────────┐
                                │      Backend API (FastAPI)      │
                                │    Hosteado en Render / Koyeb   │
                                └───────┬─────────────────┬───────┘
                                        │                 │
                        ┌───────────────┘                 └───────────────┐
                        ▼                                                 ▼
        ┌───────────────────────────────┐                 ┌───────────────────────────────┐
        │   PostgreSQL 16 Serverless    │                 │       Redis Serverless        │
        │     Hosteado en Neon.tech     │                 │      Hosteado en Upstash      │
        └───────────────────────────────┘                 └───────────────────────────────┘
```

---

## 🛠️ Opción A: Despliegue Modular (Recomendado y 100% Gratis)

Esta opción aprovecha los mejores servicios gratuitos especializados para cada capa, garantizando SSL automático (HTTPS), CDN global y alto rendimiento.

---

### Paso 1: Subir el proyecto a GitHub

1. Inicializá el repositorio local y subí todos los cambios:
   ```bash
   git add .
   git commit -m "Preparando despliegue de Super Oferta Sur"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```

---

### Paso 2: Base de Datos PostgreSQL con [Neon.tech](https://neon.tech)

Neon ofrece PostgreSQL 16 serverless gratuito con 500 MB de almacenamiento (suficiente para más de 100.000 precios) y no se suspende.

1. Creá una cuenta en [Neon.tech](https://neon.tech).
2. Hacé clic en **Create Project** y nombralo `super-oferta-sur-db`.
3. Seleccioná la región más cercana (ej. `US East (Ohio)` o `South America` si está disponible).
4. En el dashboard, copiá la cadena de conexión (**Connection String**). Se verá así:
   ```text
   postgresql://usuario:password@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Para SQLAlchemy con FastAPI, adaptá el prefijo a:
   ```text
   postgresql+psycopg2://usuario:password@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

### Paso 3: Redis Serverless con [Upstash](https://upstash.com)

Upstash provee Redis serverless gratuito (hasta 10.000 comandos diarios), ideal para la caché y el broker de tareas.

1. Creá una cuenta en [Upstash.com](https://upstash.com).
2. Andá a **Redis** ➔ **Create Database**.
3. Nombrala `super-oferta-sur-redis` y elegí la región `US-East-1`.
4. En la pestaña **Details**, copiá la URL de conexión (`rediss://...`).
   * Ejemplo: `rediss://default:AbCdEf123456@us1-cool-example-12345.upstash.io:6379`

---

### Paso 4: Backend FastAPI en [Render.com](https://render.com) (o [Koyeb](https://koyeb.com))

1. Creá una cuenta en [Render.com](https://render.com) y vinculá tu GitHub.
2. Hacé clic en **New +** ➔ **Web Service**.
3. Seleccioná tu repositorio `Super-oferta-sur`.
4. Completá el formulario de configuración:
   * **Name**: `super-oferta-sur-api`
   * **Region**: `Ohio (US East)` *(misma región que la DB para baja latencia)*
   * **Root Directory**: `backend`
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type**: `Free`
5. En la sección **Environment Variables**, agregá las siguientes variables:
   * `DATABASE_URL` = *(URL de Neon.tech con `postgresql+psycopg2://...`)*
   * `REDIS_URL` = *(URL de Upstash con `rediss://...`)*
   * `CELERY_BROKER_URL` = *(URL de Upstash)*
   * `CELERY_RESULT_BACKEND` = *(URL de Upstash)*
   * `API_V1_STR` = `/api/v1`
   * `PROJECT_NAME` = `Super Oferta Sur API`
6. Hacé clic en **Create Web Service**.
7. Render compilará tu aplicación y te dará una URL pública HTTPS, por ejemplo:
   `https://super-oferta-sur-api.onrender.com`
8. Verificá que la API responda entrando a:
   `https://super-oferta-sur-api.onrender.com/docs`

---

### Paso 5: Portal Público (Astro SSR) en [Vercel](https://vercel.com)

1. Creá una cuenta en [Vercel](https://vercel.com) e iniciá sesión con GitHub.
2. Hacé clic en **Add New...** ➔ **Project**.
3. Importá el repositorio `Super-oferta-sur`.
4. Configurá el proyecto:
   * **Framework Preset**: `Astro`
   * **Root Directory**: Hacé clic en *Edit* y seleccioná la carpeta `frontend-public`.
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. En la sección **Environment Variables**, añadí:
   * `PUBLIC_API_URL` = `https://super-oferta-sur-api.onrender.com/api/v1`
   * `INTERNAL_API_URL` = `https://super-oferta-sur-api.onrender.com/api/v1`
6. Hacé clic en **Deploy**.
7. Vercel desplegará tu portal público y te asignará un dominio gratis con SSL:
   `https://super-oferta-sur.vercel.app`

---

### Paso 6: Panel de Administración (Next.js 14) en [Vercel](https://vercel.com)

1. En Vercel, hacé clic nuevamente en **Add New...** ➔ **Project**.
2. Seleccioná otra vez el repositorio `Super-oferta-sur`.
3. Configurá el proyecto:
   * **Project Name**: `admin-super-oferta-sur`
   * **Framework Preset**: `Next.js`
   * **Root Directory**: Seleccioná `frontend-admin`.
4. En **Environment Variables**, añadí:
   * `NEXT_PUBLIC_API_URL` = `https://super-oferta-sur-api.onrender.com/api/v1`
   * `INTERNAL_API_URL` = `https://super-oferta-sur-api.onrender.com/api/v1`
5. Hacé clic en **Deploy**.
6. Tendrás tu panel administrativo online en:
   `https://admin-super-oferta-sur.vercel.app`

---

### Paso 7: Carga Inicial de Datos (Seed)

Una vez que la API y la base de datos de Neon estén conectadas, ejecutá la siembra inicial del catálogo:

* **Opción rápida**: En Render, abrí la pestaña **Shell** de tu servicio web y ejecutá:
  ```bash
  python -m app.seed
  ```
* **Desde tu máquina local apuntando a Neon**:
  ```bash
  DATABASE_URL="postgresql+psycopg2://usuario:password@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require" python -m app.seed
  ```

---

## 📦 Opción B: Todo en Uno con Docker (VPS "Always Free" de Oracle Cloud)

Si querés mantener exactamente la misma estructura de `docker-compose.yml` en un único servidor:

1. **Crear cuenta en Oracle Cloud Free Tier**:
   * Ofrece 2 máquinas virtuales gratis para siempre (Ampere ARM con hasta 24 GB de RAM y 4 OCPUs).
2. **Conectarse por SSH a la VM**:
   ```bash
   ssh ubuntu@IP_DE_TU_SERVIDOR
   ```
3. **Instalar Docker y Git**:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose git
   sudo usermod -aG docker $USER
   ```
4. **Clonar y levantar el proyecto**:
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPO.git
   cd TU_REPO
   ./start_project.sh
   ```
5. **Configurar dominio y HTTPS gratis con Caddy o Nginx**:
   * Podés instalar [Caddy Server](https://caddyserver.com) para obtener certificados SSL automáticos de Let's Encrypt:
   ```caddy
   tu-dominio.com {
       reverse_proxy localhost:4321
   }
   admin.tu-dominio.com {
       reverse_proxy localhost:3000
   }
   api.tu-dominio.com {
       reverse_proxy localhost:8000
   }
   ```

---

## 📋 Resumen de Variables de Entorno

| Servicio | Variable | Valor de Ejemplo en Producción |
| :--- | :--- | :--- |
| **Backend** | `DATABASE_URL` | `postgresql+psycopg2://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| **Backend** | `REDIS_URL` | `rediss://default:token@us1-xyz.upstash.io:6379` |
| **Backend** | `CELERY_BROKER_URL`| `rediss://default:token@us1-xyz.upstash.io:6379` |
| **Backend** | `API_V1_STR` | `/api/v1` |
| **Frontend Público** | `PUBLIC_API_URL` | `https://super-oferta-sur-api.onrender.com/api/v1` |
| **Frontend Público** | `INTERNAL_API_URL` | `https://super-oferta-sur-api.onrender.com/api/v1` |
| **Frontend Admin** | `NEXT_PUBLIC_API_URL` | `https://super-oferta-sur-api.onrender.com/api/v1` |

---

## ⏰ Tip Pro: Evitar que el Backend de Render se duerma

En el plan gratuito de Render, si la API no recibe visitas durante 15 minutos, entra en modo reposo (*sleep*). Para mantenerla activa 24/7 de forma 100% gratuita:

1. Creá una cuenta en [UptimeRobot.com](https://uptimerobot.com) (gratis).
2. Añadí un monitor tipo **HTTP(s)** con URL `https://super-oferta-sur-api.onrender.com/health`.
3. Configurá el intervalo de chequeo cada **5 o 10 minutos**.
4. ¡Listo! UptimeRobot enviará un ping automático manteniendo la API siempre despierta y rápida para los usuarios.

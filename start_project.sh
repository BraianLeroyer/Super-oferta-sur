#!/usr/bin/env bash
set -e

echo "=== Levantando el Sistema Completo de La Anónima en Docker ==="

# Asegurar acceso a docker.sock
if [ ! -w /var/run/docker.sock ]; then
  echo "Otorgando acceso temporal a /var/run/docker.sock..."
  sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
fi

docker compose up --build -d

echo ""
echo "========================================================="
echo " 🎉 ¡PROYECTO COMPLETO LEVANTADO Y CORRIENDO EN DOCKER! 🎉"
echo "========================================================="
echo " 🌐 Portal Público Catálogo (Astro SSR + React): http://localhost:4321"
echo " ⚙️  Panel de Control Admin (Next.js App Router): http://localhost:3000"
echo " 🚀 Backend REST API & Docs (FastAPI):            http://localhost:8000/docs"
echo "========================================================="

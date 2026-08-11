#!/usr/bin/env bash
set -e

echo "=== Instalando Docker CE en Linux Mint 22 (Ubuntu 24.04 noble) ==="

# 1. Eliminar paquetes antiguos/conflictivos
echo "--> Removiendo paquetes viejos si existen..."
sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# 2. Actualizar repositorio e instalar prerrequisitos
echo "--> Instalando dependencias de red y certificados..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# 3. Descargar clave GPG de Docker
echo "--> Configurando clave GPG oficial de Docker..."
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 4. Configurar el repositorio de Docker oficial para Ubuntu Noble
echo "--> Agregando repositorio oficial de Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$UBUNTU_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Instalar Docker CE, CLI, Buildx y Compose
echo "--> Instalando Docker Engine, CLI, Buildx y Compose..."
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 6. Habilitar servicio
echo "--> Activando servicio Docker..."
sudo systemctl enable --now docker

# 7. Agregar usuario al grupo docker
echo "--> Agregando usuario $USER al grupo docker..."
sudo usermod -aG docker "$USER"

echo ""
echo "=== ¡Instalación de Docker completada con éxito! ==="
echo "Ejecuta 'newgrp docker' en tu terminal para usar Docker sin 'sudo'."

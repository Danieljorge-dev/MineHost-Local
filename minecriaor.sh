#!/bin/bash

# Script para iniciar MineCriator (Backend + Frontend)
# Use: ./minecriaor.sh

set -e

echo "🚀 Iniciando MineHost Local Server Manager..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório da aplicação
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Cleanup function
cleanup() {
  echo ""
  echo -e "${YELLOW}ℹ${NC} Finalizando MineHost Local..."
  if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
    kill $BACKEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
  fi
  echo -e "${GREEN}✓${NC} MineHost Local finalizado!"
  exit 0
}

# Handle Ctrl+C
trap cleanup SIGINT SIGTERM EXIT

# Verificar se venv existe
if [ ! -d "$APP_DIR/venv" ]; then
  echo -e "${RED}❌ Virtual environment não encontrado!${NC}"
  echo "Por favor execute a instalação inicial:"
  echo "  python3 -m venv venv"
  echo "  source venv/bin/activate"
  echo "  pip install -r backend/requirements.txt"
  exit 1
fi

# 1. Iniciar Backend em background
echo -e "${BLUE}[1/2]${NC} Iniciando Backend FastAPI..."
cd "$APP_DIR"
source venv/bin/activate

# Verificar se porta 5000 já está em uso
if netstat -tuln 2>/dev/null | grep -q ":5000 "; then
  echo -e "${YELLOW}⚠${NC} Porta 5000 já está em uso"
  echo -e "${GREEN}✓${NC} Assumindo que backend já está rodando"
else
  # Iniciar backend
  python -m uvicorn backend.server:app --host 127.0.0.1 --port 5000 > /tmp/minecriaor-backend.log 2>&1 &
  BACKEND_PID=$!
  echo -e "${GREEN}✓${NC} Backend iniciado (PID: $BACKEND_PID)"
  
  # Aguardar backend ficar pronto
  echo "   Aguardando backend ficar pronto..."
  RETRY=0
  while [ $RETRY -lt 30 ]; do
    if curl -s http://localhost:5000/api/servers > /dev/null 2>&1; then
      echo -e "${GREEN}✓${NC} Backend pronto!"
      break
    fi
    RETRY=$((RETRY + 1))
    if [ $RETRY -eq 30 ]; then
      echo -e "${YELLOW}⚠${NC} Backend não respondeu em 30s, continuando mesmo assim..."
      echo "   Verifique os logs: tail -f /tmp/minecriaor-backend.log"
    fi
    sleep 1
  done
fi

echo ""

# 2. Iniciar Frontend (AppImage)
echo -e "${BLUE}[2/2]${NC} Iniciando Interface MineHost Local..."
cd "$APP_DIR/frontend/dist"

if [ -f "MineHost-Local-0.1.0.AppImage" ]; then
  chmod +x MineCriator-0.1.0.AppImage
  ./MineCriator-0.1.0.AppImage
elif [ -f "$APP_DIR/frontend/dist/MineCriator-0.1.0.AppImage" ]; then
  cd "$APP_DIR/frontend/dist"
  chmod +x MineCriator-0.1.0.AppImage
  ./MineCriator-0.1.0.AppImage
else
  echo -e "${RED}❌ AppImage não encontrado!${NC}"
  echo "Você precisa fazer build primeiro:"
  echo "  cd frontend"
  echo "  npm install"
  echo "  npm run build"
  echo "  npx electron-builder --linux"
  exit 1
fi


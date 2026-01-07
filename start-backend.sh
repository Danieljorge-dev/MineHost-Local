#!/bin/bash

# Script para iniciar apenas o Backend (chamado pelo Electron)
# Não fecha o terminal/processo, fica rodando em background

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verificar se venv existe
if [ ! -d "$APP_DIR/venv" ]; then
  exit 1
fi

cd "$APP_DIR"
source venv/bin/activate

# Verificar se backend já está rodando
if curl -s http://localhost:5000/api/servers > /dev/null 2>&1; then
  exit 0
fi

# Iniciar backend
python -m uvicorn backend.server:app --host 127.0.0.1 --port 5000 > /tmp/minecriaor-backend.log 2>&1 &

# Aguardar ficar pronto (até 30s)
for i in {1..30}; do
  if curl -s http://localhost:5000/api/servers > /dev/null 2>&1; then
    exit 0
  fi
  sleep 1
done

exit 0

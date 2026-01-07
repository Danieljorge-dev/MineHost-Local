#!/bin/bash

# Diretório da aplicação
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Iniciar backend em background
echo "Iniciando MineCriator Backend..."
cd "$APP_DIR"

# Se venv existe, usar ele. Senão, usar python do sistema
if [ -d "venv" ]; then
  source venv/bin/activate
  PYTHON="python"
else
  PYTHON="python3"
fi

# Iniciar uvicorn em background
$PYTHON -m uvicorn backend.server:app --host 127.0.0.1 --port 5000 > /tmp/minecriaor-backend.log 2>&1 &
BACKEND_PID=$!

# Aguardar backend estar pronto
echo "Aguardando backend ficar pronto..."
for i in {1..30}; do
  if curl -s http://localhost:5000/api/servers > /dev/null 2>&1; then
    echo "✓ Backend pronto!"
    break
  fi
  sleep 1
done

# Iniciar app Electron
echo "Iniciando interface..."
cd "$APP_DIR/frontend"
./build/MineCriator 2>/dev/null || npx electron .

# Limpar - matar backend ao fechar app
kill $BACKEND_PID 2>/dev/null

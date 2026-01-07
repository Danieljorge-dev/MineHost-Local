#!/bin/bash
set -e

echo "🚀 Iniciando build do MineCriator (AppImage + DEB)..."
echo ""

cd /home/djbug/Downloads/Server-MineCriator-main/frontend

# Limpar builds antigos
echo "🧹 Limpando builds antigos..."
rm -rf dist build node_modules/.cache

# Build React
echo "📦 Compilando React..."
npm run build

# Build Electron packages
echo "🔨 Buildando pacotes Linux com electron-builder..."
npx electron-builder --linux \
  --config.artifactName='${productName}-${version}.${ext}' \
  --publish=never

echo ""
echo "✅ Build completo!"
echo ""
echo "📍 Pacotes gerados em: /home/djbug/Downloads/Server-MineCriator-main/frontend/dist/"
echo ""
echo "📋 Listando arquivos gerados:"
ls -lh dist/*.{deb,AppImage} 2>/dev/null || echo "Aguardando geração de arquivos..."

echo ""
echo "🎯 Próximas etapas:"
echo "1. Instalar via DEB: sudo dpkg -i dist/MineCriator-*.deb"
echo "2. OU executar AppImage: ./dist/MineCriator-*.AppImage"

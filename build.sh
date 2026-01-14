#!/bin/bash
set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  MineHost Local - Desktop App Builder"
echo "═══════════════════════════════════════════════════════════════"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo ""
echo "📁 Project Root: $PROJECT_ROOT"
echo "📁 Frontend Dir: $FRONTEND_DIR"

# Build the app
echo ""
echo "🔨 Building React App..."
cd "$FRONTEND_DIR"
npm run build

echo ""
echo "📦 Building Electron Packages (AppImage and DEB)..."
npx electron-builder --linux

echo ""
echo "✅ Build Complete!"
echo ""
echo "📍 Artifacts Location: $FRONTEND_DIR/dist/"
ls -lh "$FRONTEND_DIR/dist"/*.{deb,AppImage} 2>/dev/null || echo "Packages being built..."

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🎉 MineHost Local Desktop App Ready!"
echo "═══════════════════════════════════════════════════════════════"

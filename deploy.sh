#!/bin/bash

# deploy.sh - Script para deploy automatizado
# Uso: ./deploy.sh [preview|production]

set -e  # Salir si cualquier comando falla

echo "🚀 Iniciando proceso de deploy..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Verificar argumentos
DEPLOY_TYPE=${1:-preview}

if [[ "$DEPLOY_TYPE" != "preview" && "$DEPLOY_TYPE" != "production" ]]; then
    error "Tipo de deploy inválido. Usa: preview o production"
fi

log "Tipo de deploy: $DEPLOY_TYPE"

# 1. Verificar que estemos en la rama correcta
if [[ "$DEPLOY_TYPE" == "production" ]]; then
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
        warning "No estás en la rama main/master. ¿Continuar? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            error "Deploy cancelado"
        fi
    fi
fi

# 2. Verificar que no hay cambios sin commitear
if [[ -n $(git status --porcelain) ]]; then
    warning "Hay cambios sin commitear. ¿Continuar? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        error "Deploy cancelado. Haz commit de tus cambios primero"
    fi
fi

# 3. Instalar dependencias
log "Instalando dependencias..."
npm ci

# 4. Ejecutar tests (si existen)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    log "Ejecutando tests..."
    npm test || warning "Tests fallaron, pero continuando..."
fi

# 5. Limpiar build anterior
log "Limpiando build anterior..."
rm -rf dist/

# 6. Verificar variables de entorno
log "Verificando variables de entorno..."

if [[ "$DEPLOY_TYPE" == "production" ]]; then
    if [[ -z "$VITE_FIREBASE_API_KEY" ]]; then
        error "Variables de entorno de producción no configuradas"
    fi
    ENV_FILE=".env.production"
else
    ENV_FILE=".env"
fi

if [[ -f "$ENV_FILE" ]]; then
    success "Variables de entorno encontradas en $ENV_FILE"
else
    warning "No se encontró $ENV_FILE"
fi

# 7. Build de la aplicación
log "Construyendo aplicación..."
if [[ "$DEPLOY_TYPE" == "production" ]]; then
    npm run build:prod
else
    npm run build
fi

success "Build completado"

# 8. Verificar que el build es válido
if [[ ! -d "dist" ]] || [[ ! -f "dist/index.html" ]]; then
    error "Build inválido - faltan archivos"
fi

BUILD_SIZE=$(du -sh dist/ | cut -f1)
log "Tamaño del build: $BUILD_SIZE"

# 9. Deploy a Vercel
log "Desplegando a Vercel..."

if [[ "$DEPLOY_TYPE" == "production" ]]; then
    # Deploy a producción
    npx vercel --prod --yes
    DEPLOY_URL=$(npx vercel --prod --yes 2>&1 | grep -o 'https://[^[:space:]]*' | tail -1)
else
    # Deploy preview
    npx vercel --yes
    DEPLOY_URL=$(npx vercel --yes 2>&1 | grep -o 'https://[^[:space:]]*' | tail -1)
fi

# 10. Verificar que el deploy fue exitoso
if [[ -z "$DEPLOY_URL" ]]; then
    error "Deploy falló - no se obtuvo URL"
fi

success "Deploy completado exitosamente!"
log "URL: $DEPLOY_URL"

# 11. Ejecutar verificaciones post-deploy
log "Ejecutando verificaciones post-deploy..."

# Verificar que la app responde
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL" || echo "000")

if [[ "$HTTP_STATUS" == "200" ]]; then
    success "App responde correctamente (HTTP $HTTP_STATUS)"
else
    warning "App puede tener problemas (HTTP $HTTP_STATUS)"
fi

# 12. Verificar PWA
log "Verificando PWA..."
MANIFEST_URL="$DEPLOY_URL/manifest.json"
MANIFEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MANIFEST_URL" || echo "000")

if [[ "$MANIFEST_STATUS" == "200" ]]; then
    success "PWA Manifest disponible"
else
    warning "PWA Manifest no encontrado"
fi

# 13. Notificaciones opcionales
if command -v notify-send &> /dev/null; then
    notify-send "Deploy Completado" "Quiniela App desplegada en $DEPLOY_URL"
fi

# 14. Resumen final
echo ""
echo "🎉 ¡Deploy completado exitosamente!"
echo "📊 Resumen:"
echo "   • Tipo: $DEPLOY_TYPE"
echo "   • URL: $DEPLOY_URL"
echo "   • Tamaño: $BUILD_SIZE"
echo "   • Status: HTTP $HTTP_STATUS"
echo ""

if [[ "$DEPLOY_TYPE" == "production" ]]; then
    echo "🚀 Tu app está LIVE en producción!"
    echo "📱 Los usuarios pueden instalarla desde: $DEPLOY_URL"
else
    echo "👀 Preview disponible para testing"
fi

echo ""
echo "💡 Próximos pasos:"
echo "   • Probar la app en diferentes dispositivos"
echo "   • Verificar que PWA funcione correctamente"
echo "   • Compartir URL con tus primos"

if [[ "$DEPLOY_TYPE" == "production" ]]; then
    echo "   • Configurar dominio personalizado (opcional)"
    echo "   • Configurar analytics (opcional)"
fi

success "¡Todo listo! 🎉"
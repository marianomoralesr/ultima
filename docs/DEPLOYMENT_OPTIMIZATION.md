# Optimización de Deployment y Troubleshooting

## 🐛 Problemas Identificados

### 1. Build Lento (Tarda Mucho)
**Causa**: `npm install` reinstala todas las dependencias en cada build

**Solución**: Usar multi-stage build con caching de npm
- Copiar `package.json` primero antes del código fuente
- Usar `npm ci` en lugar de `npm install`
- Docker cachea la capa de dependencias si package.json no cambia

### 2. Páginas en Blanco en Producción
**Posibles Causas**:
1. ❌ CSP (Content Security Policy) muy restrictivo bloqueando scripts
2. ❌ Assets no se sirven correctamente (rutas incorrectas)
3. ❌ Variables de entorno faltan en runtime
4. ❌ Errores JavaScript no visibles en producción

## ✅ Soluciones Implementadas

### A) Dockerfile Optimizado

Nuevo archivo: `Dockerfile.optimized`

**Mejoras**:
```dockerfile
# 1. Cache de dependencias mejorado
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit  # Más rápido que npm install

# 2. Luego copiar código fuente
COPY . .

# 3. Healthcheck incluido
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:8080/healthz'...)"
```

**Beneficios**:
- ⚡ Build 50-70% más rápido si package.json no cambia
- 🔄 Docker reusa capa de node_modules
- 🏥 Healthcheck automático en Cloud Run

### B) Diagnóstico de Páginas en Blanco

**Verificar en producción**:

```bash
# 1. Health check
curl https://trefa.mx/healthz

# 2. Ver si index.html carga
curl https://trefa.mx/ | grep "root"

# 3. Ver si JS carga (cambiar hash por el actual)
curl -I https://trefa.mx/assets/js/index-D7IIn8Pm.js

# 4. Revisar headers CSP
curl -I https://trefa.mx/ | grep -i "content-security"
```

**Ver logs en tiempo real**:
```bash
gcloud run logs tail app --region=us-central1 --format=json
```

**Buscar errores**:
```bash
gcloud run logs read app --region=us-central1 --limit=100 | grep -i error
```

### C) Verificación Pre-Deploy

Antes de deploy a producción:

```bash
# 1. Build local para verificar
npm run build

# 2. Verificar que dist/ tiene los assets
ls -lh dist/assets/

# 3. Test server local
cd server && npm install && node server.js
# Abrir http://localhost:8080

# 4. Si funciona local, entonces deploy
./docs/deployment/deploy.sh production
```

## 🚀 Comandos de Deploy Optimizados

### Opción 1: Usar Dockerfile Optimizado

```bash
# Renombrar Dockerfile actual
mv Dockerfile Dockerfile.old

# Usar el optimizado
mv Dockerfile.optimized Dockerfile

# Deploy
./docs/deployment/deploy.sh production
```

### Opción 2: Build con Cache en Google Cloud Build

Editar `docs/deployment/deploy.sh` línea 120:

```bash
# Agregar --cache-from para usar cache de builds anteriores
docker build \
  --cache-from=$IMAGE_URL \
  --platform linux/amd64 \
  ...resto de args...
```

## 🔍 Debugging Páginas en Blanco

### Paso 1: Ver Console del Browser

1. Abrir https://trefa.mx
2. F12 para abrir DevTools
3. Tab "Console" - buscar errores rojos
4. Tab "Network" - ver qué assets fallan (404, CSP blocked, etc)

### Paso 2: Revisar CSP

Si ves errores como:
```
Refused to load script... CSP violated
Refused to execute inline script... CSP violated
```

**Solución**: Ajustar CSP en `server/server.js`:

```javascript
// Hacer CSP menos restrictivo temporalmente
contentSecurityPolicy: {
  directives: {
    "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    // ... resto
  }
}
```

### Paso 3: Verificar Variables de Entorno

En Cloud Run console, verificar que todas las variables están set:

```bash
gcloud run services describe app --region=us-central1 --format=yaml | grep -A 50 "env:"
```

Variables críticas:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `FRONTEND_URL`

### Paso 4: Revisar Revision History

```bash
# Ver revisiones
gcloud run revisions list --service=app --region=us-central1

# Ver tráfico actual
gcloud run services describe app --region=us-central1 --format="value(status.traffic)"
```

## 📊 Métricas de Build

### Build Actual (Sin Optimización):
- Tiempo: ~5-7 minutos
- node_modules: 585MB
- dist/: ~5MB
- Total layers: ~8-10

### Build Optimizado (Esperado):
- Tiempo primer build: ~4-5 minutos
- Tiempo builds subsiguientes (con cache): ~2-3 minutos
- Layers cacheadas: node_modules (60% del tiempo)

## ⚡ Quick Fixes

### Si deployment tarda mucho:
```bash
# Limpiar cache de Docker
docker system prune -a

# Build sin cache (si hay problemas)
docker build --no-cache ...
```

### Si páginas en blanco después de deploy:
```bash
# 1. Verificar última revision está healthy
gcloud run services describe app --region=us-central1

# 2. Rollback a revision anterior (cambiar REVISION-NAME)
gcloud run services update-traffic app \
  --region=us-central1 \
  --to-revisions=REVISION-NAME=100

# 3. Ver logs de la revision problemática
gcloud run logs read app --region=us-central1 --format=json | jq '.resource.labels.revision_name'
```

### Si assets no cargan (404):
Verificar rutas en `index.html` son relativas (empiezan con `/`):
```html
<!-- ✅ CORRECTO -->
<script src="/assets/js/index-XXX.js"></script>

<!-- ❌ INCORRECTO -->
<script src="assets/js/index-XXX.js"></script>
```

## 📝 Checklist Pre-Production Deploy

- [ ] Build local funciona: `npm run build && cd server && node server.js`
- [ ] No hay errores en console del browser (localhost:8080)
- [ ] Todas las páginas principales cargan
- [ ] Auth funciona (login/logout)
- [ ] CRM accesible para admin/sales
- [ ] Deploy a staging primero: `./docs/deployment/deploy.sh staging`
- [ ] Test staging por 5-10 minutos
- [ ] Revisar logs de staging: sin errores críticos
- [ ] Deploy a prod: `./docs/deployment/deploy.sh production`
- [ ] Verificar prod en incognito/mobile
- [ ] Monitor logs por 10 minutos post-deploy

## 🆘 Rollback Rápido

Si algo sale mal en producción:

```bash
# Ver revisiones y su traffic
gcloud run services describe app --region=us-central1

# Rollback a revision anterior (última que funcionaba)
gcloud run services update-traffic app \
  --region=us-central1 \
  --to-revisions=app-00042-abc=100  # Cambiar por revision anterior

# Confirmar
curl https://trefa.mx/healthz
```

---

**Creado**: 24 Nov 2025
**Última actualización**: 24 Nov 2025

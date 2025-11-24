# Script de Changelog Automático

## 📋 Descripción

Este script automatiza la actualización del changelog HTML basándose en los commits de Git. **Añade** las nuevas versiones sin sobrescribir el contenido existente.

## 🚀 Uso

### Básico (últimos 3 días)
```bash
./scripts/actualizar-changelog.sh
```

### Personalizado (últimos N días)
```bash
./scripts/actualizar-changelog.sh 7   # Últimos 7 días
./scripts/actualizar-changelog.sh 14  # Últimas 2 semanas
./scripts/actualizar-changelog.sh 30  # Último mes
```

## ✨ Características

### 1. **No Sobrescribe**
- ✅ Añade nuevas versiones al principio del changelog
- ✅ Preserva todo el historial existente
- ✅ Crea backup automático antes de modificar

### 2. **Categorización Automática**
Los commits se categorizan según el prefijo:

| Prefijo | Categoría | Badge |
|---------|-----------|-------|
| `feat:` | ✨ NUEVAS FUNCIONALIDADES | Verde |
| `fix:` | 🔧 CORRECCIONES | Amarillo |
| `security:` | 🔒 SEGURIDAD | Rojo |
| `perf:` | ⚡ RENDIMIENTO | Azul |
| `docs:` | 📚 DOCUMENTACIÓN | Púrpura |
| `style:` | 💄 ESTILOS | Gris |
| `refactor:` | ♻️ REFACTORIZACIÓN | Gris |
| `test:` | 🧪 PRUEBAS | Gris |
| `chore:` | 🔨 MANTENIMIENTO | Gris |

### 3. **Versionado Automático**
- Lee la última versión del changelog (ej: v1.11.0)
- Incrementa automáticamente el PATCH (ej: v1.11.0 → v1.11.1)
- Formato: `vMAJOR.MINOR.PATCH`

### 4. **Fecha en Español**
- Convierte automáticamente las fechas a español
- Formato: "23 de Noviembre, 2025"

### 5. **Seguridad**
- ✅ Crea backup automático (`.backup`)
- ✅ Verifica que el archivo existe antes de modificar
- ✅ Muestra estadísticas de cambios

## 📝 Formato de Commits

Para que el script funcione correctamente, usa commits con formato convencional:

### ✅ Buenos Ejemplos
```bash
git commit -m "feat: Agregar sistema de notificaciones push"
git commit -m "fix: Corregir error en cálculo de financiamiento"
git commit -m "docs: Actualizar documentación de API"
git commit -m "perf: Optimizar consultas de base de datos"
git commit -m "security: Actualizar dependencias vulnerables"
```

### ❌ Evitar
```bash
git commit -m "cambios varios"
git commit -m "fix stuff"
git commit -m "update"
```

## 📊 Salida del Script

Cuando ejecutas el script, verás:

```
📋 Actualizando changelog con commits de los últimos 3 días...

Commits encontrados:
-------------------
  [feat] Agregar sistema de notificaciones push (a1b2c3d)
  [fix] Corregir error en cálculo de financiamiento (e4f5g6h)
  [docs] Actualizar documentación de API (i7j8k9l)

📦 Generando nueva versión: v1.11.1

✅ Changelog actualizado con éxito
📦 Nueva versión agregada: v1.11.1
📅 Fecha de actualización: 23 de Noviembre, 2025
💾 Backup guardado en: public/changelog.html.backup

📊 Estadísticas:
   Total de commits procesados: 3
   ✨ NUEVAS FUNCIONALIDADES: 1 commits
   🔧 CORRECCIONES: 1 commits
   📚 DOCUMENTACIÓN: 1 commits

💡 Recuerda:
   1. Revisar el archivo public/changelog.html
   2. Si hay algún error, restaurar desde public/changelog.html.backup
   3. Hacer commit de los cambios:
      git add public/changelog.html && git commit -m 'docs: Update changelog to v1.11.1'
   4. Push al repositorio
```

## 🔧 Configuración

### Archivo de Entrada
- **Ubicación**: `public/changelog.html`
- **Requisito**: Debe existir y contener `<div class="content">`

### Formato de Salida
El script inserta el nuevo contenido después de `<div class="content">`:

```html
<div class="content">

    <!-- VERSIÓN v1.11.1 - 23 de Noviembre, 2025 -->
    <div class="version">
        <div class="version-header">
            <span class="version-number">v1.11.1</span>
            <span class="version-date">23 de Noviembre, 2025</span>
            <span class="badge badge-feature">Actualización Automática</span>
        </div>

        <div class="change-category">
            <div class="category-title">
                <span class="badge badge-feature">✨ NUEVAS FUNCIONALIDADES</span>
            </div>
            <ul class="change-list">
                <li class="change-item">
                    <strong>Agregar sistema de notificaciones push</strong>
                    <span class="commit-hash">a1b2c3d</span>
                </li>
            </ul>
        </div>
    </div>

    <!-- Versiones anteriores... -->
```

## 🛡️ Recuperación de Errores

### Si algo sale mal:

1. **Restaurar desde backup**:
   ```bash
   mv public/changelog.html.backup public/changelog.html
   ```

2. **Verificar el changelog**:
   ```bash
   cat public/changelog.html | head -50
   ```

3. **Volver a ejecutar**:
   ```bash
   ./scripts/actualizar-changelog.sh 3
   ```

## 📅 Cuándo Ejecutar

### Recomendado
- ✅ Antes de cada release
- ✅ Semanalmente (viernes)
- ✅ Después de merges importantes
- ✅ Antes de presentaciones/demos

### Evitar
- ❌ En medio de desarrollo activo
- ❌ Con cambios sin commitear
- ❌ Sin revisar el output

## 🔄 Workflow Típico

```bash
# 1. Hacer tus commits durante la semana
git commit -m "feat: Nueva funcionalidad A"
git commit -m "fix: Corregir bug B"
git commit -m "docs: Actualizar README"

# 2. Viernes: Actualizar changelog
./scripts/actualizar-changelog.sh 7

# 3. Revisar el changelog generado
cat public/changelog.html | head -100

# 4. Si está bien, commit y push
git add public/changelog.html
git commit -m "docs: Update changelog to v1.11.1"
git push

# 5. Si algo está mal, restaurar y reintentar
mv public/changelog.html.backup public/changelog.html
```

## 🎨 Personalización

### Cambiar Días por Defecto
Edita la línea 21:
```bash
DIAS=${1:-3}  # Cambiar 3 por el número que quieras
```

### Cambiar Formato de Fecha
Edita la línea 22 para cambiar los nombres de meses.

### Agregar Nuevas Categorías
Agrega en el script (líneas 62-80):
```bash
elif echo "$mensaje" | grep -qE '^breaking:'; then
    tipo="breaking"
```

Y en la sección de badges (líneas 152-160):
```bash
add_category "breaking" "💥 CAMBIOS IMPORTANTES" "badge-security"
```

## 📚 Ejemplos de Uso

### Caso 1: Sprint Semanal
```bash
# Lunes: Empezar sprint
# ... desarrollo durante la semana ...

# Viernes: Actualizar changelog
./scripts/actualizar-changelog.sh 7

# Ver estadísticas
# Total: 25 commits
# Features: 12
# Fixes: 8
# Docs: 5
```

### Caso 2: Release Mensual
```bash
# Recopilar todos los cambios del mes
./scripts/actualizar-changelog.sh 30

# Revisar que todo esté bien
git diff public/changelog.html

# Commit y tag
git add public/changelog.html
git commit -m "docs: Update changelog for v1.12.0 release"
git tag v1.12.0
git push --tags
```

### Caso 3: Hotfix Urgente
```bash
# Después de aplicar hotfix
git commit -m "fix: CRITICAL - Corregir vulnerabilidad de seguridad"

# Actualizar changelog inmediatamente
./scripts/actualizar-changelog.sh 1

# Release rápido
git add public/changelog.html
git commit -m "docs: Update changelog to v1.11.2 (hotfix)"
git push
```

## ⚠️ Problemas Comunes

### "No se encontraron commits"
**Causa**: No hay commits en el rango de días especificado
**Solución**: Aumentar el número de días
```bash
./scripts/actualizar-changelog.sh 14
```

### "No se pudo encontrar '<div class="content">'"
**Causa**: El HTML del changelog está corrupto
**Solución**: Restaurar desde backup
```bash
mv public/changelog.html.backup public/changelog.html
```

### Versión no se incrementa
**Causa**: No se encuentra versión en el HTML
**Solución**: Verificar que existe `v1.X.X` en el changelog

## 🔍 Verificación

### Antes de commit, verificar:

```bash
# 1. El archivo existe
ls -lh public/changelog.html

# 2. La nueva versión aparece
grep -A 5 "v1.11.1" public/changelog.html

# 3. Las fechas están actualizadas
grep "Última actualización" public/changelog.html

# 4. Backup existe
ls -lh public/changelog.html.backup
```

## 💡 Tips

1. **Usa commits descriptivos**: Mejor "feat: Agregar búsqueda avanzada con filtros" que "feat: add feature"

2. **Ejecuta regularmente**: No dejes acumular 100+ commits sin documentar

3. **Revisa antes de push**: Siempre revisa el changelog generado

4. **Guarda backups**: El script los crea automáticamente, pero guarda copias extra antes de releases

5. **Automatiza**: Considera agregar al pipeline de CI/CD

## 🤖 Automatización

### GitHub Actions (ejemplo)
```yaml
name: Update Changelog
on:
  push:
    branches: [main]
jobs:
  update-changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Update Changelog
        run: |
          ./scripts/actualizar-changelog.sh 7
          git config user.name "Bot"
          git config user.email "bot@example.com"
          git add public/changelog.html
          git commit -m "docs: Auto-update changelog" || true
          git push
```

## 📞 Soporte

Si encuentras problemas:
1. Revisa este README
2. Verifica que tus commits tienen el formato correcto
3. Restaura desde backup si es necesario
4. Contacta al equipo de desarrollo

---

**Última actualización**: Noviembre 23, 2025
**Versión del script**: 2.0
**Compatible con**: Bash 3.2+

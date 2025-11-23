# Automatización del Changelog - Autos TREFA

Este documento explica cómo funciona el sistema automático de actualización del changelog y cómo usarlo.

## 📋 Archivos del Sistema

### 1. Changelog HTML Principal
**Ubicación:** `public/changelog.html`

Archivo HTML estático que contiene el historial completo de cambios. Se actualiza automáticamente con cada versión.

**Características:**
- Diseño responsive
- Categorización por tipo de cambio (feat, fix, security, perf, docs)
- Badges de colores para identificación visual
- Compatible con todos los navegadores modernos

### 2. Componente de Descarga para Admins
**Ubicación:** `src/components/DownloadChangelogButton.tsx`

Componente React que permite a los administradores descargar el changelog en formato HTML.

**Uso:**

```tsx
import DownloadChangelogButton from '@/components/DownloadChangelogButton';

// En cualquier página de admin
<DownloadChangelogButton
  variant="default"  // o "outline", "secondary", "ghost"
  className="mt-4"
/>
```

**Integración recomendada:**
- Página de Admin Config (`src/pages/AdminConfigPage.tsx`)
- Página de Changelog (`src/pages/ChangelogPage.tsx`)
- Dashboard de Admin

### 3. Script de Actualización Automática
**Ubicación:** `scripts/actualizar-changelog.sh`

Script bash que automatiza la actualización del changelog basándose en commits de git.

## 🚀 Cómo Usar el Sistema

### Actualización Manual del Changelog

Para actualizar el changelog con los commits más recientes:

```bash
# Actualizar con commits de los últimos 3 días (por defecto)
./scripts/actualizar-changelog.sh

# Actualizar con commits de los últimos 7 días
./scripts/actualizar-changelog.sh 7

# Actualizar con commits de los últimos 30 días
./scripts/actualizar-changelog.sh 30
```

El script:
1. ✅ Obtiene todos los commits de todas las ramas
2. ✅ Categoriza por tipo (feat, fix, security, etc.)
3. ✅ Genera el contenido HTML formateado
4. ✅ Actualiza `public/changelog.html`

### Convenciones de Commits

Para que el changelog se genere correctamente, sigue estas convenciones:

```bash
# Nuevas funcionalidades
git commit -m "feat: Agregar sistema de notificaciones push"

# Correcciones de bugs
git commit -m "fix: Corregir cálculo de intereses en calculadora"

# Seguridad
git commit -m "security: Eliminar credenciales hardcodeadas"

# Rendimiento
git commit -m "perf: Optimizar queries de base de datos"

# Documentación
git commit -m "docs: Actualizar README con nuevas instrucciones"

# Estilos
git commit -m "style: Mejorar diseño de tarjetas de vehículos"

# Refactorización
git commit -m "refactor: Simplificar lógica de autenticación"

# Tests
git commit -m "test: Agregar pruebas unitarias para API"

# Mantenimiento
git commit -m "chore: Actualizar dependencias de npm"
```

### Workflow Recomendado

#### 1. Durante el Desarrollo
```bash
# Hacer commits con convenciones adecuadas
git add .
git commit -m "feat: Agregar nueva funcionalidad X"
git push
```

#### 2. Al Finalizar un Sprint/Milestone
```bash
# Actualizar changelog con todos los cambios recientes
./scripts/actualizar-changelog.sh 14  # Últimas 2 semanas

# Revisar el changelog generado
open public/changelog.html

# Editar manualmente si es necesario para mejorar descripciones

# Commit del changelog actualizado
git add public/changelog.html
git commit -m "docs: Actualizar changelog v1.12.0"
git push
```

#### 3. Al Crear una Nueva Versión
1. Actualizar el changelog
2. Editar `public/changelog.html` manualmente para agregar:
   - Número de versión
   - Fecha de lanzamiento
   - Resumen de la versión
3. Commit y push

## 📦 Integración con el Dashboard de Admin

### Opción 1: Agregar a AdminConfigPage

```tsx
// src/pages/AdminConfigPage.tsx
import DownloadChangelogButton from '@/components/DownloadChangelogButton';

// Dentro del componente
<div className="space-y-4">
  <h2 className="text-2xl font-bold">Documentación</h2>
  <DownloadChangelogButton />
</div>
```

### Opción 2: Agregar a ChangelogPage

```tsx
// src/pages/ChangelogPage.tsx
import DownloadChangelogButton from '@/components/DownloadChangelogButton';
import { useAuth } from '@/context/AuthContext';

const ChangelogPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div>
      {/* Contenido del changelog */}

      {isAdmin && (
        <div className="mt-8">
          <DownloadChangelogButton variant="outline" />
        </div>
      )}
    </div>
  );
};
```

### Opción 3: Agregar a Header/Menú de Admin

```tsx
// En cualquier menú de admin
{isAdmin && (
  <DropdownMenuItem asChild>
    <DownloadChangelogButton variant="ghost" className="w-full justify-start" />
  </DropdownMenuItem>
)}
```

## 🤖 Automatización con Git Hooks

Para automatización completa, puedes configurar git hooks:

### Post-commit Hook

```bash
# .git/hooks/post-commit

#!/bin/bash

# Auto-actualizar changelog después de cada commit
if [[ $(git log -1 --pretty=%B) == feat:* ]] ||
   [[ $(git log -1 --pretty=%B) == fix:* ]]; then
    ./scripts/actualizar-changelog.sh 7
fi
```

### Pre-push Hook

```bash
# .git/hooks/pre-push

#!/bin/bash

# Verificar que el changelog esté actualizado antes de push
if git diff --name-only HEAD origin/main | grep -q "src/\|public/"; then
    echo "🤖 Actualizando changelog antes de push..."
    ./scripts/actualizar-changelog.sh 7

    if git diff --quiet public/changelog.html; then
        echo "✅ Changelog ya está actualizado"
    else
        echo "⚠️  Changelog actualizado. Revisa y haz commit si es necesario."
    fi
fi
```

## 📊 Estructura del Changelog HTML

```html
<!-- Estructura de cada versión -->
<div class="version">
  <div class="version-header">
    <span class="version-number">v1.11.0</span>
    <span class="version-date">23 de Noviembre, 2024</span>
    <span class="badge badge-feature">Categoría</span>
  </div>

  <div class="change-category">
    <div class="category-title">
      <span class="badge badge-feature">✨ NUEVAS FUNCIONALIDADES</span>
    </div>
    <ul class="change-list">
      <li class="change-item">
        <strong>Título del Cambio:</strong> Descripción detallada
      </li>
    </ul>
  </div>
</div>
```

## 🎨 Categorías y Badges

| Tipo | Badge | Color | Uso |
|------|-------|-------|-----|
| `feat` | ✨ NUEVAS FUNCIONALIDADES | Verde | Nuevas características |
| `fix` | 🔧 CORRECCIONES | Amarillo | Corrección de bugs |
| `security` | 🔒 SEGURIDAD | Rojo | Mejoras de seguridad |
| `perf` | ⚡ RENDIMIENTO | Azul | Optimizaciones |
| `docs` | 📚 DOCUMENTACIÓN | Morado | Documentación |
| `style` | 💄 ESTILOS | Rosa | Cambios visuales |
| `refactor` | ♻️ REFACTORIZACIÓN | Cyan | Refactorización de código |
| `test` | 🧪 PRUEBAS | Naranja | Tests |
| `chore` | 🔨 MANTENIMIENTO | Gris | Tareas de mantenimiento |

## 🔒 Permisos y Seguridad

### Acceso al Botón de Descarga

Solo usuarios con rol `admin` deben poder ver y usar el botón de descarga:

```tsx
import { useAuth } from '@/context/AuthContext';

const { user } = useAuth();
const isAdmin = user?.role === 'admin';

{isAdmin && <DownloadChangelogButton />}
```

### Archivo HTML Público

El archivo `public/changelog.html` es accesible públicamente en:
- Desarrollo: `http://localhost:5173/changelog.html`
- Producción: `https://trefa.mx/changelog.html`

Esto permite:
- ✅ Enlaces directos al changelog
- ✅ Compartir con stakeholders
- ✅ SEO y descubribilidad

## 📱 Responsive Design

El changelog HTML es completamente responsive:

```css
/* Mobile (< 768px) */
- Padding reducido
- Font sizes adaptados
- Layout de una columna

/* Tablet (768px - 1024px) */
- Dos columnas para badges
- Padding intermedio

/* Desktop (> 1024px) */
- Layout completo
- Máximo ancho de 900px
- Shadows y efectos visuales
```

## 🚦 Troubleshooting

### El script no encuentra commits

```bash
# Verificar que hay commits en el rango especificado
git log --all --since="3 days ago" --oneline

# Si no hay commits, ampliar el rango
./scripts/actualizar-changelog.sh 30
```

### El changelog no se actualiza

```bash
# Verificar permisos del script
chmod +x scripts/actualizar-changelog.sh

# Verificar que el archivo existe
ls -la public/changelog.html
```

### El botón de descarga no aparece

```typescript
// Verificar que el componente está importado
import DownloadChangelogButton from '@/components/DownloadChangelogButton';

// Verificar permisos de usuario
console.log('User role:', user?.role);
console.log('Is admin:', user?.role === 'admin');
```

## 📝 Mantenimiento

### Actualización Mensual

Al inicio de cada mes:

1. Ejecutar script con todos los commits del mes anterior
2. Revisar y editar manualmente el changelog
3. Agregar resumen ejecutivo de la versión
4. Commit y push

### Limpieza de Versiones Antiguas

Mantener solo las últimas 10-12 versiones en el HTML para rendimiento:

```bash
# Archivar versiones antiguas
mv public/changelog.html public/changelog-archive-2024.html

# Iniciar nuevo changelog con versiones recientes
# Copiar últimas 10 versiones al nuevo archivo
```

## 🎯 Mejoras Futuras

- [ ] Generar changelog en múltiples formatos (MD, PDF, JSON)
- [ ] Integración con sistema de releases de GitHub
- [ ] Notificaciones automáticas a stakeholders
- [ ] API endpoint para consultar changelog
- [ ] Diff visual entre versiones
- [ ] Búsqueda y filtrado en el changelog
- [ ] Exportar a Notion/Confluence automáticamente

## 📞 Soporte

Para problemas o sugerencias sobre el sistema de changelog:
- Crear issue en el repositorio
- Contactar al equipo de desarrollo
- Consultar la documentación de Git Hooks

---

**Última actualización:** 23 de Noviembre, 2024
**Versión del documento:** 1.0.0
**Mantenedor:** Claude Code Automation

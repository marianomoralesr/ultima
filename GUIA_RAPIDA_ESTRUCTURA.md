# Guía Rápida: Nueva Estructura del Proyecto

**Última actualización:** 4 de Diciembre, 2025

## 🎯 Propósito

Esta guía te ayudará a encontrar rápidamente cualquier archivo en el proyecto después de la reorganización.

## 📁 Estructura Principal

```
/
├── 📄 Archivos de Configuración (root)
├── 📚 docs/               # Toda la documentación
├── 📝 scripts/            # Scripts shell y utilidades
├── 🖼️ images/             # Imágenes del proyecto
├── 📋 logs/               # Archivos de log
├── 💻 src/                # Código fuente
├── 📦 public/             # Assets públicos
├── 🗄️ supabase/           # Configuración de Supabase
└── 🔧 Otros...
```

## 📚 Documentación (docs/)

### `docs/current/` - Documentación Actualizada
Toda la documentación relevante y actual del proyecto.

**Busca aquí primero:** Lee el `docs/current/README.md` para un índice completo organizado por categorías.

**Categorías principales:**
- 🔧 Optimización y Performance
- 📱 SMS y Notificaciones  
- 👥 Acceso y Roles (Sales/Ventas)
- 🧪 Testing y Calidad
- 📊 Marketing y Facebook
- 🔄 Migraciones de Base de Datos
- 🎯 Features y Funcionalidades
- 📚 Guías de Desarrollo

### `docs/archive/` - Documentación Histórica
Documentación obsoleta, fixes antiguos y reportes históricos.

**Busca aquí:** Documentos de fixes ya aplicados, urgencias resueltas, versiones antiguas.

### `docs/sql-scripts/` - Scripts SQL
Todos los scripts SQL del proyecto organizados.

**Contiene:** Migraciones, fixes, verificaciones, optimizaciones RLS, tests.

### `docs/guides/` - Guías de Implementación
Guías técnicas específicas que ya existían.

## 📝 Scripts (scripts/)

Todos los scripts shell (.sh), JavaScript y utilidades del proyecto.

**Incluye:**
- Scripts de deployment
- Scripts de activación de features
- Scripts de migración
- Scripts de testing
- Utilidades de desarrollo

**Importante:** Los scripts que referencian SQL ahora usan rutas relativas como `../docs/sql-scripts/archivo.sql`

## 🖼️ Imágenes (images/)

Todas las imágenes PNG del proyecto:
- Screenshots de testing
- Flows de usuario
- Capturas móviles
- Imágenes de documentación

## 📋 Logs (logs/)

Archivos de log de deployments y operaciones.

**Nota:** Esta carpeta está en `.gitignore` y no se versiona.

## 🔍 Cómo Encontrar Algo

### ¿Buscas documentación sobre un tema?
1. Revisa `docs/current/README.md` - índice completo
2. Si es histórico: busca en `docs/archive/`

### ¿Buscas un script SQL?
- **Todos están en:** `docs/sql-scripts/`
- Usa `ls docs/sql-scripts/ | grep keyword` para buscar

### ¿Buscas un script shell?
- **Todos están en:** `scripts/`
- Usa `ls scripts/ | grep keyword` para buscar

### ¿Buscas una imagen/screenshot?
- **Todas están en:** `images/`
- Usa `ls images/ | grep keyword` para buscar

## 💡 Tips de Búsqueda Rápida

```bash
# Buscar documentación por palabra clave
grep -r "palabra_clave" docs/current/

# Listar todos los scripts SQL
ls docs/sql-scripts/

# Buscar un script específico
find scripts/ -name "*nombre*"

# Buscar imágenes por patrón
ls images/ | grep "pattern"

# Ver archivos más recientes en docs/current
ls -lt docs/current/ | head
```

## 🛠️ Para Desarrolladores

### Ejecutar Scripts SQL
Los scripts que ejecutan SQL ahora usan rutas actualizadas:

```bash
# Desde la carpeta scripts/
cd scripts/
./nombre-script.sh  # Ya usa ../docs/sql-scripts/archivo.sql

# Desde el root
scripts/nombre-script.sh
```

### Agregar Nueva Documentación

**Documentación actual/relevante:**
```bash
# Agregar a docs/current/
mv nuevo-doc.md docs/current/
```

**Documentación obsoleta:**
```bash
# Mover a archive cuando ya no sea relevante
mv docs/current/doc-viejo.md docs/archive/
```

### Agregar Nuevos Scripts

**Scripts SQL:**
```bash
mv nuevo-script.sql docs/sql-scripts/
```

**Scripts Shell:**
```bash
mv nuevo-script.sh scripts/
chmod +x scripts/nuevo-script.sh
```

## 📌 Archivos Importantes en Root

Solo permanecen en root los archivos esenciales:

- `CHANGELOG.md` - Registro de cambios del proyecto
- `readme.md` - README principal
- `CLAUDE.md` - Instrucciones para Claude
- `package.json` - Dependencias y scripts npm
- `vite.config.ts` - Configuración de Vite
- `tailwind.config.js` - Configuración de Tailwind
- Otros archivos de configuración del proyecto

## 🚨 Reglas de Mantenimiento

1. **No colocar documentación en root** → Usar `docs/current/`
2. **No colocar scripts SQL en root** → Usar `docs/sql-scripts/`
3. **No colocar scripts .sh en root** → Usar `scripts/`
4. **No colocar imágenes en root** → Usar `images/`
5. **Documentación obsoleta** → Mover a `docs/archive/`

## 📞 Referencia Rápida

| ¿Qué buscas? | Dónde está | Comando rápido |
|--------------|------------|----------------|
| Docs actuales | `docs/current/` | `ls docs/current/` |
| Docs antiguas | `docs/archive/` | `ls docs/archive/` |
| Scripts SQL | `docs/sql-scripts/` | `ls docs/sql-scripts/` |
| Scripts shell | `scripts/` | `ls scripts/` |
| Imágenes | `images/` | `ls images/` |
| Logs | `logs/` | `ls logs/` |

## ✅ Cambios Recientes

Ver `LIMPIEZA_PROYECTO.md` para un resumen detallado de todos los archivos que fueron reorganizados.

---

**Tip:** Guarda esta guía en tus favoritos para referencia rápida.

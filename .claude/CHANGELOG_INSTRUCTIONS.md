# Instrucciones para Mantenimiento del Changelog

## ⚠️ IMPORTANTE - LEER EN CADA SESIÓN

**Nombre de la empresa:** Autos TREFA (siempre en mayúsculas)
**Dominio:** trefa.mx
**Proyecto:** Sistema web de Autos TREFA

Este proyecto mantiene un registro de cambios público en español ubicado en:
```
public/changelog.html
```

## Responsabilidades del Asistente

**CADA VEZ** que realices cambios significativos al código, debes actualizar el archivo `public/changelog.html` con:

### 1. Qué Documentar

Documenta **TODOS** los siguientes tipos de cambios:

- ✅ **Correcciones (Fixes)**: Cualquier bug o problema corregido
- ✅ **Nuevas Funciones (Features)**: Nuevas características o funcionalidades
- ✅ **Mejoras (Improvements)**: Optimizaciones o mejoras a funciones existentes
- ✅ **Cambios Pendientes (Pending)**: Cambios que requieren acción manual del usuario

### 2. Formato de las Entradas

Cada entrada debe incluir:

1. **Categoría con badge**: fix, feature, improvement, o pending
2. **Título descriptivo** del cambio
3. **Hash del commit** (opcional pero recomendado)
4. **Descripción detallada** en español explicando:
   - Qué se cambió
   - Por qué se cambió
   - Cómo afecta al usuario
   - Pasos adicionales si son necesarios

### 3. Estructura de Versiones

```html
<div class="version">
    <div class="version-header">
        <span class="version-number">v1.X.0</span>
        <span class="version-date">DD de Mes, YYYY</span>
    </div>

    <div class="change-category">
        <div class="category-title">
            <span class="badge badge-TYPE">TIPO</span>
            <span>ÁREA</span>
        </div>
        <ul class="change-list">
            <li class="change-item">
                <div class="change-icon">EMOJI</div>
                <div class="change-text">
                    <strong>Título del cambio</strong>
                    <span class="commit-hash">abc123</span>
                    <p class="change-description">
                        Descripción detallada...
                    </p>
                </div>
            </li>
        </ul>
    </div>
</div>
```

### 4. Tipos de Badges

- `badge-fix` (verde): Para correcciones de bugs
- `badge-feature` (azul): Para nuevas funcionalidades
- `badge-improvement` (amarillo): Para mejoras y optimizaciones
- `badge-pending` (rojo): Para acciones pendientes del usuario

### 5. Emojis Recomendados

- 🔧 Correcciones técnicas
- 🐛 Bugs corregidos
- ✨ Nuevas funciones
- 📄 Documentos/archivos
- 🔐 Seguridad/autenticación
- 📧 Email/notificaciones
- 🔗 Links/navegación
- 💾 Base de datos
- 🎨 UI/UX
- ⚡ Rendimiento
- ⚠️ Advertencias/pendientes

## Cuándo Actualizar

Actualiza el changelog:

- ✅ Después de cada commit importante
- ✅ Antes de cada deployment a producción
- ✅ Al completar una característica o corrección
- ✅ Cuando se identifiquen acciones pendientes para el usuario

## NO Actualizar Para

- ❌ Cambios menores de formato
- ❌ Correcciones de typos en comentarios
- ❌ Refactoring interno sin impacto visible
- ❌ Cambios experimentales no deployados

## Versionado Semántico

Incrementa la versión según:

- **v1.X.0** (mayor): Cambios importantes o múltiples features
- **v1.2.X** (menor): Nueva funcionalidad individual
- **v1.2.3** (patch): Solo correcciones de bugs

## Ejemplo de Flujo de Trabajo

1. Realizas un cambio (ej: corriges un bug)
2. Haces commit del código
3. Antes de hacer deployment:
   - Abres `public/changelog.html`
   - Agregas la entrada en la sección de "Version Actual"
   - Usas el badge apropiado (badge-fix)
   - Incluyes descripción en español
   - Incluyes el hash del commit
4. Haces commit del changelog actualizado
5. Deployeas a producción

## Recordatorio Visual

```
┌─────────────────────────────────────────┐
│  ⚠️  ANTES DE CADA DEPLOYMENT  ⚠️      │
│                                         │
│  1. ¿Hice cambios significativos?      │
│  2. ¿Actualicé public/changelog.html?  │
│  3. ¿Está en español?                  │
│  4. ¿Incluí el commit hash?            │
│  5. ¿Expliqué el impacto al usuario?   │
└─────────────────────────────────────────┘
```

## Acceso al Changelog

Los usuarios pueden ver el changelog en:
- https://trefa.mx/changelog.html
- Desde cualquier navegador, disponible públicamente

---

**Última actualización**: 25 de Octubre, 2025
**Responsable**: Claude Code AI Assistant

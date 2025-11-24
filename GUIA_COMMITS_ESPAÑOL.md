# 📝 Guía para Escribir Commits en Español

## 🎯 Objetivo

Todos los commits deben escribirse en **español claro, descriptivo e informativo** desde el inicio. El changelog se genera automáticamente a partir de estos mensajes, por lo que deben ser comprensibles para usuarios finales.

## 📋 Formato de Commits

### Estructura Básica

```
tipo: Descripción clara y descriptiva de lo que hace el cambio

Detalles adicionales si es necesario (opcional)
```

### Tipos de Commit

| Tipo | Cuándo Usar | Ejemplo |
|------|-------------|---------|
| `feat:` | Nueva funcionalidad | `feat: Agregar sistema de notificaciones push en tiempo real` |
| `fix:` | Corrección de bug | `fix: Corregir cálculo de intereses en simulador de financiamiento` |
| `perf:` | Mejora de rendimiento | `perf: Optimizar carga de imágenes de vehículos con lazy loading` |
| `docs:` | Documentación | `docs: Actualizar guía de integración con Airtable` |
| `style:` | Cambios visuales/CSS | `style: Mejorar espaciado y colores del dashboard de ventas` |
| `refactor:` | Refactorización | `refactor: Simplificar lógica de asignación de asesores` |
| `security:` | Seguridad | `security: Actualizar dependencias con vulnerabilidades conocidas` |
| `test:` | Tests | `test: Agregar pruebas unitarias para calculadora de crédito` |
| `chore:` | Mantenimiento | `chore: Actualizar configuración de build para producción` |

## ✅ Buenos Ejemplos

### Nuevas Funcionalidades (feat:)

```bash
✅ feat: Implementar sistema de chat en vivo para atención al cliente

✅ feat: Agregar filtros avanzados de búsqueda por precio, marca y año

✅ feat: Crear dashboard analítico con métricas de ventas en tiempo real

✅ feat: Implementar visualización de documentos requeridos por etapa del proceso

✅ feat: Agregar comparador de vehículos lado a lado con hasta 3 unidades
```

### Correcciones (fix:)

```bash
✅ fix: Corregir error de validación en formulario de solicitud de crédito

✅ fix: Resolver problema de carga infinita en página de inventario

✅ fix: Arreglar visualización incorrecta de montos en móviles

✅ fix: Solucionar pérdida de datos al navegar entre pasos del onboarding

✅ fix: Corregir redirección incorrecta después de iniciar sesión
```

### Rendimiento (perf:)

```bash
✅ perf: Reducir tiempo de carga inicial de 3.5s a 1.2s con code splitting

✅ perf: Optimizar consultas a base de datos en dashboard de administrador

✅ perf: Implementar caché de imágenes de vehículos con CDN

✅ perf: Mejorar rendimiento de búsqueda con índices en Supabase

✅ perf: Reducir bundle size eliminando dependencias no utilizadas
```

### Documentación (docs:)

```bash
✅ docs: Crear guía completa de configuración del sistema de marketing

✅ docs: Actualizar README con instrucciones de deployment en Google Cloud

✅ docs: Documentar API de integración con bancos y requisitos por institución

✅ docs: Agregar ejemplos de uso del sistema de perfilación bancaria

✅ docs: Crear documentación técnica del flujo de aprobación de créditos
```

### Seguridad (security:)

```bash
✅ security: Implementar validación de tokens JWT en todas las rutas protegidas

✅ security: Agregar rate limiting para prevenir ataques de fuerza bruta

✅ security: Actualizar Next.js a versión 14.2.1 por vulnerabilidad XSS

✅ security: Encriptar datos sensibles de clientes antes de almacenar

✅ security: Implementar CSP headers para prevenir inyección de scripts
```

## ❌ Malos Ejemplos (NO HACER)

```bash
❌ feat: add feature
   ➡️ Problema: En inglés y no descriptivo

❌ fix: arreglar bug
   ➡️ Problema: ¿Qué bug? No es específico

❌ feat: updates
   ➡️ Problema: ¿Qué se actualizó?

❌ cambios varios
   ➡️ Problema: Sin tipo, sin descripción

❌ fix: corregir
   ➡️ Problema: ¿Corregir qué?

❌ feat: Add view and edit buttons
   ➡️ Problema: En inglés (debería ser en español)

❌ fix: fix bug in application
   ➡️ Problema: En inglés y no específico
```

## 📝 Plantillas por Caso de Uso

### Implementar Nueva Funcionalidad

```bash
git commit -m "feat: [Descripción clara de la funcionalidad]

- Detalle 1
- Detalle 2
- Impacto en usuarios"
```

**Ejemplo:**
```bash
git commit -m "feat: Implementar sistema de notificaciones por correo automáticas

- Envío de correos cuando cambia el estado de solicitud
- Plantillas personalizables por tipo de notificación
- Los clientes reciben actualizaciones en tiempo real
- Reduce consultas al equipo de ventas en 40%"
```

### Corregir Bug Crítico

```bash
git commit -m "fix: [Descripción del problema resuelto]

- Qué causaba el error
- Cómo se solucionó
- Usuarios afectados"
```

**Ejemplo:**
```bash
git commit -m "fix: Corregir pérdida de datos en formulario de solicitud al navegar

- Formulario no guardaba automáticamente al cambiar de pestaña
- Ahora se auto-guarda cada 30 segundos
- Se notifica al usuario cuando se guarda
- Afectaba a usuarios en proceso de solicitud"
```

### Mejorar Rendimiento

```bash
git commit -m "perf: [Descripción de la optimización]

- Métrica anterior
- Métrica nueva
- Técnica utilizada"
```

**Ejemplo:**
```bash
git commit -m "perf: Optimizar carga de galería de vehículos con lazy loading

- Tiempo de carga anterior: 4.2s
- Tiempo de carga nuevo: 1.1s (74% más rápido)
- Implementado lazy loading e intersección observer
- Mejora experiencia en móviles con conexión lenta"
```

## 🎨 Mejores Prácticas

### 1. Se Específico y Descriptivo

❌ **Malo:**
```bash
git commit -m "fix: arreglar dashboard"
```

✅ **Bueno:**
```bash
git commit -m "fix: Corregir cálculo de métricas en dashboard de ventas mostrando valores incorrectos"
```

### 2. Usa Verbos en Infinitivo

✅ **Correcto:**
```bash
feat: Agregar sistema de chat
feat: Implementar notificaciones
feat: Crear dashboard analítico
fix: Corregir validación de formulario
fix: Resolver problema de autenticación
```

❌ **Incorrecto:**
```bash
feat: Agrega sistema de chat
feat: Implementando notificaciones
fix: Corrigiendo validación
```

### 3. Enfócate en el "Qué" y "Por Qué", no el "Cómo"

✅ **Bueno:**
```bash
feat: Implementar búsqueda por voz para mejorar accesibilidad
```

❌ **Malo:**
```bash
feat: Usar Web Speech API para implementar búsqueda
```

### 4. Agrupa Cambios Relacionados

✅ **Bueno:** Un commit por característica
```bash
feat: Implementar sistema completo de valoración de vehículos

- Integración con API de TREFA MX
- Formulario de captura de datos del vehículo
- Visualización de resultados con desglose
- Generación de PDF con valuación oficial
```

❌ **Malo:** Muchos commits pequeños
```bash
feat: agregar formulario
feat: agregar botón
feat: agregar validación
feat: agregar estilos
```

### 5. Usa Contexto Cuando Sea Necesario

Para módulos específicos, puedes agregar contexto:

```bash
feat(dashboard): Agregar gráfico de conversión de leads por asesor

fix(auth): Resolver problema de sesión expirada sin redirección

perf(inventario): Optimizar consulta de vehículos disponibles

docs(api): Documentar endpoints de integración bancaria
```

## 📊 Ejemplos por Módulo

### Módulo: Sistema de Financiamiento

```bash
feat: Agregar calculadora de pagos mensuales con simulación interactiva
fix: Corregir cálculo de tasa de interés anual en préstamos a 36 meses
perf: Optimizar carga de opciones de financiamiento disponibles por banco
```

### Módulo: Dashboard de Ventas

```bash
feat: Implementar filtros avanzados por fecha, asesor y estado de solicitud
fix: Resolver problema de actualización automática de métricas en tiempo real
style: Mejorar legibilidad de tablas de leads con mejor contraste y espaciado
```

### Módulo: Portal Bancario

```bash
feat: Crear vista específica para representantes bancarios con solicitudes asignadas
fix: Corregir permisos de acceso para bancos con múltiples representantes
security: Implementar autenticación de dos factores para acceso bancario
```

### Módulo: Sistema de Onboarding

```bash
feat: Agregar stepper interactivo con validación por paso y feedback visual
fix: Resolver pérdida de progreso al recargar página durante el proceso
style: Rediseñar interfaz con diseño más moderno y componentes de shadcn/ui
```

## 🚀 Workflow Recomendado

### 1. Antes de Commitear

```bash
# Ver qué cambios vas a incluir
git status
git diff

# Asegurarte de que los cambios están relacionados
```

### 2. Escribir el Commit

```bash
# Usar formato correcto en español
git commit -m "feat: [Descripción clara y específica]"

# O con detalles adicionales
git commit
# Se abrirá el editor para escribir mensaje completo
```

### 3. Ejemplo Completo

```bash
git add src/components/Calculator.tsx
git add src/utils/finance.ts

git commit -m "feat: Implementar calculadora de financiamiento con múltiples bancos

- Soporte para tasas variables por banco y plazo
- Visualización comparativa de opciones de financiamiento
- Cálculo de pago mensual, intereses totales y CAT
- Exportación de cotización en PDF
- Mejora experiencia del usuario en selección de crédito"
```

## 📖 Glosario de Términos Recomendados

| Concepto | Término Recomendado |
|----------|---------------------|
| Bug | Error, problema, fallo |
| Feature | Funcionalidad, característica |
| Fix | Corrección, arreglo, solución |
| User | Usuario, cliente |
| Dashboard | Panel, tablero, dashboard |
| Login/Sign in | Inicio de sesión, autenticación |
| Button | Botón |
| Form | Formulario |
| Field | Campo |
| Validation | Validación |
| Error message | Mensaje de error |
| Loading | Carga, cargando |
| Search | Búsqueda |
| Filter | Filtro |
| Sort | Ordenamiento |
| View | Vista, visualización |
| Edit | Edición, modificación |
| Delete | Eliminación |
| Create | Creación |
| Update | Actualización |

## 🎯 Checklist Antes de Commitear

- [ ] ¿El mensaje está en español?
- [ ] ¿Usa el tipo correcto (feat, fix, etc.)?
- [ ] ¿Es descriptivo y específico?
- [ ] ¿Explica QUÉ se hizo, no CÓMO?
- [ ] ¿Un usuario final lo entendería?
- [ ] ¿Los cambios están relacionados entre sí?
- [ ] ¿El código funciona y fue probado?

## 📞 ¿Dudas?

Si no estás seguro de cómo escribir un commit:

1. **Pregunta**: "¿Cómo le explicaría este cambio a un usuario?"
2. **Usa esa explicación** como tu mensaje de commit
3. **Revisa ejemplos** en esta guía
4. **Consulta el historial** de commits bien escritos:
   ```bash
   git log --oneline | head -20
   ```

## 🎉 Ejemplo de Sesión de Trabajo

```bash
# Mañana: Implementar nueva funcionalidad
git add .
git commit -m "feat: Agregar sistema de recordatorios automáticos para seguimiento de leads

- Notificaciones por correo y SMS configurables
- Recordatorios basados en última interacción
- Dashboard para gestión de recordatorios pendientes
- Reduce pérdida de leads por falta de seguimiento"

# Tarde: Corregir un bug
git add .
git commit -m "fix: Corregir error de validación en número telefónico que rechazaba formatos válidos

- Aceptar formatos con y sin espacios
- Validar código de área mexicano correctamente
- Mostrar formato esperado en mensaje de error
- Afectaba a 15% de usuarios en registro"

# Final del día: Actualizar changelog
./scripts/actualizar-changelog.sh 1

git add public/changelog.html
git commit -m "docs: Actualizar changelog con mejoras del día"

git push
```

---

**Recuerda**: Un buen mensaje de commit es una inversión. Toma 30 segundos más escribirlo bien, pero ahorra horas de confusión después.

**El changelog es público y lo leen tus usuarios**. Mensajes claros generan confianza y profesionalismo.

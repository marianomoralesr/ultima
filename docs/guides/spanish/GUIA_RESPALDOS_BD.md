# Guía de Respaldo y Recuperación de Base de Datos

Esta guía explica cómo respaldar y restaurar de forma segura tu base de datos de Supabase.

## Inicio Rápido

### Crear un Respaldo (Antes de Migraciones)
```bash
./scripts/pre-migration-backup.sh
```

### Crear un Respaldo Manual
```bash
./scripts/backup-database.sh
```

### Restaurar un Respaldo
```bash
./scripts/restore-database.sh ./backups/backup_TIMESTAMP.sql
```

## Scripts Disponibles

### 1. `scripts/backup-database.sh`
Crea un respaldo completo de tu base de datos de producción.

**Características:**
- Volcado completo del esquema (todas las tablas, funciones, vistas, etc.)
- Mantiene automáticamente los últimos 10 respaldos
- Muestra el tamaño y número de líneas del respaldo
- Almacena marca de tiempo para fácil identificación

**Ubicación:** `./backups/backup_TIMESTAMP.sql`

**Ejemplo:**
```bash
./scripts/backup-database.sh
# Salida: ✅ Backup completed successfully!
#         File: ./backups/backup_20251105_101745.sql
#         Size: 17M
```

### 2. `scripts/restore-database.sh`
Restaura la base de datos desde un archivo de respaldo.

**Características de Seguridad:**
- Requiere escribir "YES" para confirmar
- Crea un respaldo de seguridad antes de la restauración
- Muestra qué archivo de respaldo se utilizará

**Ejemplo:**
```bash
./scripts/restore-database.sh ./backups/backup_20251105_101745.sql
# Preguntará: Are you sure you want to continue? (type 'YES' to confirm)
```

### 3. `scripts/pre-migration-backup.sh`
Script especializado para ejecutar ANTES de aplicar cualquier migración de base de datos.

**Usa este script cuando:**
- Apliques nuevas migraciones a producción
- Hagas cambios en el esquema
- Pruebes cambios potencialmente riesgosos

**Ejemplo de flujo de trabajo:**
```bash
# 1. Crear respaldo pre-migración
./scripts/pre-migration-backup.sh

# 2. Aplicar tus migraciones
supabase db push

# 3. Si algo sale mal, restaurar:
./scripts/restore-database.sh ./backups/backup_TIMESTAMP.sql
```

## Almacenamiento de Respaldos

- **Ubicación:** `./backups/`
- **Retención:** Se mantienen automáticamente los últimos 10 respaldos
- **Formato:** Archivos de volcado SQL
- **Nomenclatura:** `backup_YYYYMMDD_HHMMSS.sql`

## Notas Importantes de Seguridad

### Antes de Ejecutar Migraciones

**SIEMPRE crea un respaldo antes de aplicar migraciones:**
```bash
./scripts/pre-migration-backup.sh
```

### Lista de Verificación de Seguridad para Migraciones

- [ ] Crear un respaldo pre-migración
- [ ] Probar migraciones en una rama de desarrollo primero
- [ ] Revisar los archivos SQL de migración para verificar su correctitud
- [ ] Tener listo el comando de restauración de respaldo
- [ ] Monitorear la aplicación después de la migración

### Si Algo Sale Mal

1. **Detente inmediatamente** - No apliques más cambios
2. **Restaura desde el respaldo:**
   ```bash
   ./scripts/restore-database.sh ./backups/backup_TIMESTAMP.sql
   ```
3. **Verifica la funcionalidad de la aplicación**
4. **Revisa qué salió mal antes de intentar de nuevo**

## Detalles de Conexión

Los scripts usan la siguiente conexión:
- **Host:** `aws-0-us-east-2.pooler.supabase.com` (Pooler IPv4)
- **Puerto:** `5432`
- **Base de Datos:** `postgres`
- **Usuario:** `postgres.jjepfehmuybpctdzipnu`

**Nota:** Usamos el pooler de Supabase en lugar de la conexión directa porque la conexión directa (`db.jjepfehmuybpctdzipnu.supabase.co`) requiere IPv6 y no es compatible con redes IPv4 solamente.

## Solución de Problemas

### Error "Wrong password"
- Verifica la contraseña en el Dashboard de Supabase
- Actualiza la contraseña en los scripts de respaldo si cambió

### Error "Connection failed"
- Verifica tu conexión a internet
- Confirma que el proyecto de Supabase está activo
- Verifica que el host de la base de datos sea correcto

### El archivo de respaldo es muy pequeño
- Puede indicar un respaldo parcial
- Verifica errores en la salida del script
- Confirma que la base de datos tiene datos

## Mejores Prácticas

1. **Respalda antes de cada migración**
2. **Mantén respaldos por al menos 30 días** (proceso manual)
3. **Prueba el proceso de restauración periódicamente**
4. **Almacena respaldos críticos fuera del sitio** (descarga respaldos importantes)
5. **Documenta cualquier cambio de esquema** en archivos de migración

## Protección Contra Sobrescritura Accidental de Migraciones

### El Problema
Al trabajar localmente en migraciones, existe el riesgo de sobrescribir accidentalmente migraciones de producción si ejecutas comandos como:
- `supabase db reset`
- `supabase db push` sin revisar primero

### La Solución
**Siempre ejecuta `./scripts/pre-migration-backup.sh` antes de aplicar migraciones.**

Este script:
1. Crea un respaldo completo de tu base de datos actual
2. Te permite recuperar fácilmente si algo sale mal
3. Mantiene un historial de respaldos con marcas de tiempo

### Flujo de Trabajo Seguro

```bash
# PASO 1: Crear respaldo de seguridad
./scripts/pre-migration-backup.sh

# PASO 2: Revisar qué cambios se aplicarán
supabase db diff

# PASO 3: Si todo se ve bien, aplicar cambios
supabase db push

# PASO 4: Verificar que la aplicación funcione correctamente
# Si algo sale mal, restaurar:
./scripts/restore-database.sh ./backups/backup_TIMESTAMP.sql
```

## Recursos Adicionales

- Dashboard de Supabase: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu
- Configuración de Base de Datos: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/database

## Configuración de MCP (Model Context Protocol)

Si configuraste Claude Code con el servidor MCP de Supabase, asegúrate de que esté usando las credenciales correctas:

**Archivo de configuración:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "jjepfehmuybpctdzipnu",
        "TU_CONTRASEÑA_AQUI"
      ]
    }
  }
}
```

Recuerda reiniciar Claude Code después de actualizar la configuración.

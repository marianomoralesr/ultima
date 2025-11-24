# Estrategia de Respaldos de Base de Datos

## Resumen

Este documento explica la estrategia completa de respaldos implementada para proteger la base de datos de producción.

## Sistema Automático de Respaldos

### 1. Respaldos en Deployments a Producción

**Cuándo se ejecuta:** Automáticamente antes de cada deployment a producción

**Script:** `deploy.sh` (líneas 63-82)

**Flujo:**
```bash
./deploy.sh production
  ↓
¿Confirmar deployment? (yes/no)
  ↓
📦 Crear respaldo automático
  ↓
✓ Respaldo completado
  ↓
Continuar con deployment...
```

**Características:**
- ✅ Se ejecuta automáticamente
- ✅ NO bloquea el deployment si falla (te pregunta)
- ✅ Solo se ejecuta para producción (no staging)
- ✅ Crea un punto de restauración antes de cualquier cambio

### 2. Respaldos Manuales

**Cuándo usar:**
- Antes de aplicar migraciones de base de datos
- Antes de cambios importantes en el esquema
- Como precaución antes de operaciones riesgosas

**Comandos:**

```bash
# Respaldo rápido
./scripts/backup-database.sh

# Respaldo pre-migración (recomendado)
./scripts/pre-migration-backup.sh
```

## Estrategia de Retención

### Política Automática

Los scripts mantienen automáticamente:
- **Últimos 10 respaldos** de cualquier tipo
- Eliminación automática de respaldos más antiguos

### Política Inteligente (Manual)

Ejecuta el script de limpieza cuando quieras optimizar espacio:

```bash
./scripts/cleanup-old-backups.sh
```

**Reglas de limpieza inteligente:**

| Antigüedad | Retención |
|------------|-----------|
| Últimos 7 días | TODOS los respaldos |
| 8-30 días | 1 respaldo por semana |
| +30 días | 1 respaldo por mes |
| Mínimo garantizado | 5 respaldos más recientes |

**Ejemplo de distribución:**
- 7 respaldos diarios (última semana)
- 4 respaldos semanales (último mes)
- 6 respaldos mensuales (6 meses)
- **Total: ~17 respaldos (~289MB)**

## Análisis de Almacenamiento

### Tamaños Actuales

| Métrica | Valor |
|---------|-------|
| Tamaño por respaldo | ~17MB |
| 10 respaldos | ~170MB |
| 20 respaldos | ~340MB |
| 30 respaldos | ~510MB |

### Recomendaciones

- ✅ **10-20 respaldos:** Óptimo para la mayoría de casos
- ⚠️ **20-30 respaldos:** Ejecutar limpieza mensual
- 🔴 **+30 respaldos:** Ejecutar limpieza inteligente

## Ubicación de Respaldos

### Carpeta Local
```
./backups/
├── backup_20251105_101745.sql  (17MB)
├── backup_20251105_120000.sql  (17MB)
├── backup_20251106_090000.sql  (17MB)
└── latest_backup.txt           (referencia al último)
```

### Git y Control de Versiones

**IMPORTANTE:** Los respaldos NO se suben a GitHub por las siguientes razones:

1. **Seguridad:** Contienen datos sensibles de producción
2. **Tamaño:** Son archivos grandes que afectarían el repositorio
3. **Privacidad:** Incluyen información de usuarios

**Protección configurada:**
- `.gitignore` incluye `/backups/` y `*.sql`
- Los respaldos permanecen solo en tu máquina local

### Respaldos Offsite (Recomendado)

Para mayor seguridad, considera respaldar a:

1. **Google Drive / Dropbox**
   ```bash
   # Copiar respaldo importante a Drive
   cp ./backups/backup_TIMESTAMP.sql ~/Google\ Drive/
   ```

2. **Servidor externo**
   ```bash
   # SCP a servidor de respaldos
   scp ./backups/backup_TIMESTAMP.sql user@backup-server:/backups/
   ```

3. **Almacenamiento en la nube**
   - Cloudflare R2
   - AWS S3
   - Google Cloud Storage

## Restauración de Respaldos

### Restauración Simple

```bash
# Ver respaldos disponibles
ls -lh backups/

# Restaurar un respaldo específico
./scripts/restore-database.sh ./backups/backup_20251105_101745.sql
```

### Proceso de Restauración

1. El script crea un respaldo de seguridad actual
2. Te pide confirmar escribiendo "YES"
3. Restaura el respaldo seleccionado
4. Verifica que se completó exitosamente

## Flujos de Trabajo Recomendados

### Deployment a Producción
```bash
./deploy.sh production
# El respaldo se crea automáticamente ✅
```

### Aplicar Migraciones
```bash
# 1. Crear respaldo pre-migración
./scripts/pre-migration-backup.sh

# 2. Aplicar migraciones
supabase db push

# 3. Verificar que todo funciona
# Si algo falla:
./scripts/restore-database.sh ./backups/backup_TIMESTAMP.sql
```

### Limpieza Mensual
```bash
# Ver respaldos actuales
ls -lh backups/

# Ejecutar limpieza inteligente
./scripts/cleanup-old-backups.sh

# Revisa y confirma qué eliminar
```

### Respaldo Manual Importante
```bash
# Crear respaldo
./scripts/backup-database.sh

# Guardar en lugar seguro
cp ./backups/backup_TIMESTAMP.sql ~/importante/

# O subir a la nube
# gsutil cp ./backups/backup_TIMESTAMP.sql gs://mi-bucket/
```

## Monitoreo y Mantenimiento

### Verificación Semanal

Cada semana, verifica:

```bash
# Ver espacio usado
du -sh backups/

# Contar respaldos
ls backups/backup_*.sql | wc -l

# Ver respaldos recientes
ls -lht backups/ | head -10
```

### Prueba de Restauración Mensual

Es recomendable probar la restauración una vez al mes:

```bash
# Crear respaldo de prueba
./scripts/backup-database.sh

# Inmediatamente después, probar restauración
# (esto NO afecta nada porque restaura al mismo estado)
./scripts/restore-database.sh ./backups/backup_TIMESTAMP.sql
```

## Troubleshooting

### "Wrong password" al crear respaldo
**Solución:** Verifica la contraseña en el script `backup-database.sh`

### Respaldo muy pequeño (< 1MB)
**Problema:** Respaldo incompleto
**Solución:**
1. Verificar conexión a internet
2. Revisar logs del script
3. Verificar que la base de datos tenga datos

### Espacio en disco lleno
**Solución:**
```bash
./scripts/cleanup-old-backups.sh
```

### No puedo restaurar un respaldo
**Problema:** Archivo corrupto o incompleto
**Solución:**
1. Verificar integridad: `head -100 backups/backup_TIMESTAMP.sql`
2. Usar un respaldo anterior
3. Contactar soporte de Supabase para Point-in-Time Recovery

## Enlaces Útiles

- [Guía de Respaldos](./GUIA_RESPALDOS_BD.md)
- [Dashboard de Supabase](https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu)
- [Configuración de Base de Datos](https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/database)

## Checklist de Seguridad

- [ ] Respaldos automáticos en deployments (✅ Configurado)
- [ ] Respaldos antes de migraciones (✅ Script disponible)
- [ ] Retención de al menos 5 respaldos (✅ Automático)
- [ ] Limpieza periódica de respaldos antiguos (⚠️ Manual)
- [ ] Respaldos offsite de datos críticos (⚠️ Recomendado)
- [ ] Pruebas de restauración mensuales (⚠️ Recomendado)
- [ ] Point-in-Time Recovery habilitado (❓ Verificar en Supabase)

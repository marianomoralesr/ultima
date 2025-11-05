# Scripts de Seguridad y Respaldos

Esta carpeta contiene scripts para proteger tu código y base de datos.

## 🛡️ Seguridad de Git

### `git-safety-check.sh` (7.1K)
Verifica que tu repositorio esté sincronizado y seguro.

**Uso:**
```bash
./scripts/git-safety-check.sh
```

**Verifica:**
- ✅ Cambios sin commit
- ✅ Sincronización con remoto
- ✅ Ramas divergentes
- ✅ Conflictos de merge
- ✅ 8 verificaciones en total

### `safe-commit-push.sh` (6.3K)
Commit y push de forma segura, con verificaciones automáticas.

**Uso:**
```bash
./scripts/safe-commit-push.sh
```

**Proceso:**
1. Verifica seguridad de Git
2. Muestra cambios
3. Crea commit
4. Hace pull con rebase
5. Hace push seguro

## 📦 Respaldos de Base de Datos

### `backup-database.sh` (2.2K)
Crea un respaldo completo de la base de datos de producción.

**Uso:**
```bash
./scripts/backup-database.sh
```

**Resultado:**
- Archivo: `./backups/backup_TIMESTAMP.sql`
- Tamaño: ~17MB

### `restore-database.sh` (2.5K)
Restaura la base de datos desde un respaldo.

**Uso:**
```bash
./scripts/restore-database.sh ./backups/backup_TIMESTAMP.sql
```

**Características:**
- ✅ Requiere confirmación "YES"
- ✅ Crea respaldo de seguridad antes
- ✅ Proceso seguro

### `pre-migration-backup.sh` (1.1K)
Respaldo especializado para antes de migraciones.

**Uso:**
```bash
./scripts/pre-migration-backup.sh
# Luego: supabase db push
```

### `cleanup-old-backups.sh` (5.6K)
Limpieza inteligente de respaldos antiguos.

**Uso:**
```bash
./scripts/cleanup-old-backups.sh
```

**Estrategia:**
- Últimos 7 días: TODOS
- 8-30 días: 1 por semana
- +30 días: 1 por mes
- Mínimo: 5 recientes

## 🚀 Flujos de Trabajo

### Desarrollo Diario
```bash
# 1. Empezar el día
git pull origin main

# 2. Trabajar...

# 3. Commit y push seguro
./scripts/safe-commit-push.sh
```

### Deployment a Producción
```bash
./deploy.sh production
# Automáticamente ejecuta:
# - git-safety-check.sh ✅
# - backup-database.sh ✅
```

### Aplicar Migraciones
```bash
# 1. Respaldo pre-migración
./scripts/pre-migration-backup.sh

# 2. Aplicar migraciones
supabase db push

# 3. Si falla, restaurar
./scripts/restore-database.sh ./backups/backup_TIMESTAMP.sql
```

## 📚 Documentación

- [Flujo de Trabajo Seguro con Git](../docs/GIT_SAFETY_WORKFLOW.md)
- [Guía de Respaldos (Español)](../docs/GUIA_RESPALDOS_BD.md)
- [Estrategia de Respaldos](../docs/ESTRATEGIA_RESPALDOS.md)
- [Changelog](../LATEST_UPDATES.md)

## ⚡ Comandos Rápidos

```bash
# Verificar Git
./scripts/git-safety-check.sh

# Commit seguro
./scripts/safe-commit-push.sh

# Respaldo BD
./scripts/backup-database.sh

# Deployment
./deploy.sh production

# Limpiar respaldos
./scripts/cleanup-old-backups.sh
```

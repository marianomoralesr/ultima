# Flujo de Trabajo Seguro con Git

Esta guía explica cómo trabajar de forma segura con Git para evitar sobrescribir código y perder cambios.

## El Problema

### Escenarios Peligrosos ❌

1. **Código desactualizado:**
   ```bash
   # Tu compañero hizo push hace 2 horas
   # Tú no has hecho pull
   git push  # ❌ CONFLICTO!
   ```

2. **Sobrescribir cambios remotos:**
   ```bash
   # Trabajaste en archivos que otros modificaron
   git push --force  # ❌ PERDISTE EL TRABAJO DE OTROS!
   ```

3. **Deployment con código viejo:**
   ```bash
   # Tu rama está desactualizada
   ./deploy.sh production  # ❌ DEPLOYASTE CÓDIGO VIEJO!
   ```

## La Solución: Sistema de Verificación Automática

### Scripts de Seguridad

Implementamos 3 niveles de protección:

#### 1. **Verificación de Git** (`scripts/git-safety-check.sh`)

Verifica 8 aspectos críticos:

| # | Verificación | Qué Detecta |
|---|--------------|-------------|
| 1 | Repositorio Git | Si estás en un repo válido |
| 2 | Rama actual | En qué rama estás trabajando |
| 3 | Cambios sin commit | Archivos modificados sin guardar |
| 4 | Archivos sin seguimiento | Archivos nuevos no agregados |
| 5 | Actualización remota | Obtiene cambios del servidor |
| 6 | Rama remota | Si la rama existe en el servidor |
| 7 | Comparación local vs remoto | Si estás adelante/atrás/divergente |
| 8 | Conflictos de merge | Si hay conflictos sin resolver |

**Uso manual:**
```bash
./scripts/git-safety-check.sh
```

**Salidas posibles:**
- ✅ Exit 0: Todo está bien
- ⚠️ Exit 0: Advertencias (puedes continuar)
- ❌ Exit 1: Errores (NO continúes)

#### 2. **Commit y Push Seguro** (`scripts/safe-commit-push.sh`)

Script interactivo que:
1. ✅ Verifica seguridad de Git
2. ✅ Muestra cambios a commitear
3. ✅ Crea commit con mensaje
4. ✅ Hace pull con rebase (sincroniza)
5. ✅ Hace push seguro

**Uso:**
```bash
./scripts/safe-commit-push.sh
```

**Flujo interactivo:**
```
[1/5] Ejecutando verificaciones de seguridad...
✓ Git safety check completado

[2/5] Verificando cambios...
✓ Cambios encontrados:
  Modificados: 3
  Preparados: 0
  Sin seguimiento: 1

¿Agregar todos los cambios al commit? (yes/no): yes
✓ Todos los cambios agregados

Ingresa el mensaje del commit:
> Añadir sistema de verificación de Git

[3/5] Creando commit...
✓ Commit creado exitosamente

[4/5] Obteniendo últimos cambios del remoto...
✓ Pull completado exitosamente

[5/5] Haciendo push al remoto...
╔═══════════════════════════════════════════════╗
║          PUSH EXITOSO! 🎉                     ║
╚═══════════════════════════════════════════════╝
```

#### 3. **Integración en Deployment** (`deploy.sh`)

El script de deployment ahora incluye verificación automática:

```bash
./deploy.sh production
  ↓
[0/6] Verificando seguridad de Git...
  ├─ Cambios sin commit? ❌ NO CONTINÚA
  ├─ Atrás del remoto? ❌ NO CONTINÚA
  ├─ Rama divergente? ❌ NO CONTINÚA
  └─ Todo bien? ✅ CONTINÚA
  ↓
Confirmar deployment...
  ↓
📦 Respaldo de base de datos...
  ↓
Continuar con deployment...
```

## Flujos de Trabajo Recomendados

### Flujo Diario de Desarrollo

```bash
# 1. SIEMPRE empezar el día con pull
git pull origin main

# 2. Trabajar en tus cambios
# ... editar archivos ...

# 3. Commit y push seguro
./scripts/safe-commit-push.sh
```

### Flujo de Deployment a Producción

```bash
# 1. Verificar estado de Git
./scripts/git-safety-check.sh

# 2. Si todo está bien, deploy
./deploy.sh production
# El deployment automáticamente:
# - Verifica Git ✅
# - Hace respaldo de BD ✅
# - Continúa deployment ✅
```

### Flujo con Múltiples Desarrolladores

```bash
# 1. Antes de empezar a trabajar
git checkout main
git pull origin main

# 2. Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# 3. Trabajar en la rama
# ... hacer cambios ...

# 4. Commit y push seguro
./scripts/safe-commit-push.sh

# 5. Antes de merge a main
git checkout main
git pull origin main
git merge feature/nueva-funcionalidad

# 6. Push a main
git push origin main
```

## Casos de Uso Detallados

### Caso 1: Estás Atrás del Remoto

**Escenario:**
```
Tu commit:    A - B - C
Remoto:       A - B - C - D - E
                          ↑ Otros hicieron 2 commits
```

**El script detecta:**
```bash
✗ Tu rama está 2 commits atrás del remoto
  ¡DEBES hacer pull antes de continuar!

Ejecuta: git pull origin main
```

**Solución:**
```bash
# Opción 1: Pull normal (merge)
git pull origin main

# Opción 2: Pull con rebase (historia más limpia)
git pull --rebase origin main

# El script safe-commit-push.sh hace esto automáticamente
./scripts/safe-commit-push.sh
```

### Caso 2: Ramas Divergentes

**Escenario:**
```
Tu commit:    A - B - C - F - G
Remoto:       A - B - C - D - E
                          ↑ Divergencia
```

**El script detecta:**
```bash
✗ Tu rama ha divergido del remoto
  Adelante: 2 commits | Atrás: 2 commits
  ¡Necesitas sincronizar antes de continuar!

Opciones:
  1. Pull y merge: git pull origin main
  2. Pull y rebase: git pull --rebase origin main
```

**Solución:**
```bash
# Opción 1: Merge (crea commit de merge)
git pull origin main
# Resuelve conflictos si los hay
git add .
git commit
git push

# Opción 2: Rebase (historia lineal)
git pull --rebase origin main
# Resuelve conflictos si los hay
git add .
git rebase --continue
git push
```

### Caso 3: Conflictos de Merge

**El script detecta:**
```bash
✗ Tienes conflictos de merge sin resolver

Archivos con conflictos:
  src/components/Header.tsx
  src/pages/Home.tsx

Resuelve los conflictos antes de continuar
```

**Solución:**
```bash
# 1. Abrir archivos con conflictos
code src/components/Header.tsx

# 2. Buscar marcadores de conflicto
<<<<<<< HEAD
// Tu código
=======
// Código del remoto
>>>>>>> origin/main

# 3. Resolver manualmente, eliminar marcadores

# 4. Marcar como resuelto
git add src/components/Header.tsx

# 5. Continuar merge/rebase
git commit  # Si fue merge
git rebase --continue  # Si fue rebase
```

### Caso 4: Cambios sin Commit antes de Deployment

**El script detecta:**
```bash
✗ Tienes cambios sin commit

Archivos modificados:
  M  src/App.tsx
  M  src/config.ts
  ?? src/new-feature.tsx

Opciones:
  1. Hacer commit: git add . && git commit -m 'mensaje'
  2. Descartar cambios: git checkout -- <archivo>
  3. Guardar temporalmente: git stash
```

**El deployment NO continúa hasta que resuelvas esto.**

## Comandos Útiles

### Ver Estado del Repositorio

```bash
# Estado general
git status

# Ver diferencias con remoto
git fetch origin
git log HEAD..origin/main  # Commits en remoto que no tienes
git log origin/main..HEAD  # Commits tuyos que no están en remoto

# Ver últimos commits
git log --oneline --graph --decorate -10
```

### Sincronización

```bash
# Obtener cambios sin aplicarlos
git fetch origin

# Obtener y aplicar cambios (merge)
git pull origin main

# Obtener y aplicar cambios (rebase)
git pull --rebase origin main

# Ver qué ramas están desactualizadas
git branch -vv
```

### Guardar Trabajo Temporal

```bash
# Guardar cambios temporalmente
git stash

# Ver cambios guardados
git stash list

# Recuperar último stash
git stash pop

# Recuperar stash específico
git stash apply stash@{0}
```

## Prevención de Problemas Comunes

### ✅ Buenas Prácticas

1. **Siempre hacer pull antes de empezar a trabajar**
   ```bash
   git pull origin main
   ```

2. **Usar el script de commit seguro**
   ```bash
   ./scripts/safe-commit-push.sh
   ```

3. **Verificar antes de deployment**
   ```bash
   ./scripts/git-safety-check.sh
   ```

4. **Commits frecuentes y pequeños**
   ```bash
   # Mejor: muchos commits pequeños
   git commit -m "Añadir validación de email"
   git commit -m "Actualizar estilos de botón"

   # Evitar: un commit gigante
   git commit -m "Cambios varios"
   ```

5. **Mensajes de commit descriptivos**
   ```bash
   # ✅ Bueno
   git commit -m "Fix: Corregir validación de formulario de contacto"

   # ❌ Malo
   git commit -m "fixes"
   ```

### ❌ Malas Prácticas a Evitar

1. **NUNCA uses force push en ramas compartidas**
   ```bash
   git push --force  # ❌ PELIGROSO!
   ```

2. **NO hagas deployment sin verificar Git**
   ```bash
   # ❌ Peligroso
   ./deploy.sh production

   # ✅ Seguro
   ./scripts/git-safety-check.sh
   ./deploy.sh production
   ```

3. **NO trabajes días sin hacer push**
   ```bash
   # ❌ Acumular muchos cambios
   # ... 3 días sin push ...

   # ✅ Push diario
   # Al final de cada día:
   ./scripts/safe-commit-push.sh
   ```

4. **NO ignores conflictos**
   ```bash
   # ❌ Hacer push sin resolver conflictos
   git push  # Falla por conflictos
   git push --force  # ❌ NUNCA HAGAS ESTO!

   # ✅ Resolver conflictos correctamente
   git pull
   # Resolver conflictos
   git add .
   git commit
   git push
   ```

## Checklist de Seguridad

Antes de cada deployment a producción:

- [ ] ✅ Ejecuté `./scripts/git-safety-check.sh`
- [ ] ✅ No tengo cambios sin commit
- [ ] ✅ Mi rama está sincronizada con remoto
- [ ] ✅ No hay conflictos de merge
- [ ] ✅ Hice pull de los últimos cambios
- [ ] ✅ Los tests pasan localmente
- [ ] ✅ Revisé los cambios que voy a deployar

## Troubleshooting

### Error: "Tu rama está atrás del remoto"

**Solución:**
```bash
git pull origin main
```

### Error: "Ramas divergentes"

**Solución:**
```bash
# Opción 1: Merge
git pull origin main

# Opción 2: Rebase (preferida)
git pull --rebase origin main
```

### Error: "Conflictos de merge"

**Solución:**
```bash
# 1. Ver archivos con conflictos
git status

# 2. Editar y resolver conflictos

# 3. Marcar como resueltos
git add <archivo>

# 4. Continuar
git commit  # o git rebase --continue
```

### Error: "Permission denied (publickey)"

**Solución:**
```bash
# Verificar llaves SSH
ssh -T git@github.com

# Si falla, configurar llaves SSH
# Ver: https://docs.github.com/es/authentication/connecting-to-github-with-ssh
```

## Recursos Adicionales

- [Guía de Respaldos de BD](./GUIA_RESPALDOS_BD.md)
- [Estrategia de Respaldos](./ESTRATEGIA_RESPALDOS.md)
- [Changelog](../LATEST_UPDATES.md)
- [Git Documentation](https://git-scm.com/doc)

## Resumen de Comandos

| Comando | Descripción |
|---------|-------------|
| `./scripts/git-safety-check.sh` | Verificar seguridad de Git |
| `./scripts/safe-commit-push.sh` | Commit y push seguro |
| `git pull origin main` | Obtener últimos cambios |
| `git status` | Ver estado del repositorio |
| `git log --oneline -10` | Ver últimos 10 commits |
| `git stash` | Guardar cambios temporalmente |
| `git fetch origin` | Obtener info del remoto |

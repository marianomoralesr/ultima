# 🔄 Forzar Restart del Proyecto Supabase

## Problema Actual
- HTTP 556 en todas las peticiones
- REST API y Auth marcados como "unhealthy"
- Función recursiva `get_my_role()` eliminada pero servicios no se recuperan

## Solución: Restart Manual del Proyecto

### Opción 1: Pause/Unpause (Más Rápido)

1. Ve a: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/general
2. Scroll hasta la sección **"Pause project"**
3. Haz clic en **"Pause project"**
4. Espera 30 segundos
5. Haz clic en **"Unpause project"** o **"Restore project"**
6. Espera 2-3 minutos para que todos los servicios se levanten

### Opción 2: Restart Database (Si Opción 1 no funciona)

1. Ve a: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/database
2. Busca la opción **"Restart database"** o **"Reboot"**
3. Confirma el restart
4. Espera 3-5 minutos

### Opción 3: Soporte de Supabase (Si nada funciona)

Si después de hacer restart manual el problema persiste, abre un ticket de soporte:

1. Ve a: https://supabase.com/dashboard/support
2. Crea ticket con:
   - **Priority**: Critical - Production Down
   - **Subject**: HTTP 556 - Auth and REST API Unhealthy After Removing Recursive Function
   - **Message**:
   ```
   Project ID: jjepfehmuybpctdzipnu
   Issue: HTTP 556 on all API requests, Auth and REST API show as "unhealthy"

   Timeline:
   - Issue started: [Today's date/time]
   - Root cause identified: Infinite recursion in get_my_role() function
   - Actions taken:
     1. Dropped get_my_role() function successfully
     2. Verified function is removed from database
     3. Waited 5+ minutes for services to recover
     4. Attempted manual project pause/unpause

   Current status:
   - Still receiving HTTP 556 on all endpoints
   - REST API and Auth remain unhealthy
   - No triggers or problematic functions found in diagnostics

   Request: Please manually restart/recover Auth and REST API services
   ```

### Verificación Post-Restart

Después del restart, verifica:

```bash
curl -I https://jjepfehmuybpctdzipnu.supabase.co/rest/v1/
```

Debería devolver `HTTP/2 200` en lugar de `HTTP/2 556`

### Dashboard Health Check

Ve a: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/general

Verifica que todos los servicios muestren:
- ✅ Database: Healthy
- ✅ REST API: Healthy
- ✅ Auth: Healthy
- ✅ Storage: Healthy
- ✅ Realtime: Healthy

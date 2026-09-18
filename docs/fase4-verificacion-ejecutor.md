# Fase 4: Verificación de Criterios de Aceptación

## Criterios COMPLETADOS ✓

### 1. RLS de notifications
```
SELECT relrowsecurity FROM pg_class WHERE relname='notifications'
→ [{"relrowsecurity":true}]
```
✓ Pasado

### 2. Policies de notifications
```
SELECT policyname, roles, cmd FROM pg_policies WHERE tablename='notifications'
→ [
  {"policyname":"Staff can select notifications","roles":"{authenticated}","cmd":"SELECT"},
  {"policyname":"Staff can update notifications","roles":"{authenticated}","cmd":"UPDATE"}
]
```
✓ Solo policies para {authenticated}, ninguna para anon

### 3. Trigger de notificaciones
```
Antes: [{"count":0}]
INSERT reserva TEST-a525f7d5
Después: [{"count":1}]
```
✓ El trigger `notify_new_reservation()` funciona correctamente

### 4. Control negativo - anon NO puede acceder
```
curl con anon key → []
```
✓ Sin acceso para usuarios anónimos

### 5. Rol del usuario mauroz05@gmail.com
```
SELECT role FROM profiles WHERE email='mauroz05@gmail.com'
→ [{"role":"owner","activo":true}]
```
✓ Usuario staff creado con rol owner

### 6. TypeScript, Lint y Build
```
npx tsc --noEmit → exit 0
npm run lint → exit 0
npm run build → exit 0
```
✓ Todos los checks de calidad pasan

## Criterios PENDIENTES de prueba manual

Los siguientes criterios requieren el servidor en ejecución o pruebas manuales:

### 7. curl /admin sin cookie → 307/302 a /login
- Requiere: servidor corriendo
- Middleware ya implementado en Fase 0

### 8. Confirmar reserva → estado='confirmada' + habitación no disponible
- Requiere: servidor + flujo E2E o simulación SQL
- Server action `updateReservationStatus` implementado
- Revalidación de `/hospedaje` configurada

### 9. Rechazar reserva → estado='rechazada' + habitación vuelve a aparecer
- Requiere: servidor + flujo E2E
- Server action implementado

### 10. Crear room_block → habitación no aparece en búsqueda
- Requiere: servidor + flujo E2E
- Server action `createRoomBlock` implementado

### 11. Usuario sin staff intentando /admin → 403/redirect
- Requiere: servidor + segundo usuario de prueba
- La función `is_staff()` ya existe y las policies la usan

## Archivos Creados/Modificados

### Migración
- `supabase/migrations/0008_fase4_notifications.sql` — tabla + RLS + trigger + realtime

### Backend
- `src/features/hospedaje/api/admin-actions.ts` — 12 server actions para el panel
- `src/features/hospedaje/contracts/types.ts` — tipos y schemas extendidos

### Frontend
- `src/app/(app)/admin/page.tsx` — vista de resumen con notificaciones
- `src/app/(app)/admin/hospedaje/page.tsx` — sección hospedaje con tabs
- `src/app/(app)/admin/layout.tsx` — metadata noindex + Hospedaje activa
- `src/features/hospedaje/components/admin/reservations-list.tsx` — lista + acciones
- `src/features/hospedaje/components/admin/rooms-manager.tsx` — CRUD habitaciones
- `src/features/hospedaje/components/admin/blocks-manager.tsx` — CRUD bloqueos

### UI shadcn
- `src/core/ui/tabs.tsx`
- `src/core/ui/select.tsx`
- `src/core/ui/dialog.tsx`
- `src/core/ui/badge.tsx`

## Instrucciones para Acceso al Panel (Demo)

1. Ir a `/login` (o intentar acceder a `/admin` que redirige)
2. Ingresar: `mauroz05@gmail.com`
3. El código OTP llegará al correo (límite ~3-4/hora en Supabase free)
4. Ingresar el código de 6 dígitos
5. Acceso al panel en `/admin`

## Notas

- Todos los datos (habitaciones, reservas) son de ejemplo (`is_sample = true`)
- La migración 0008 es idempotente (safe para re-ejecutar)
- El trigger se dispara DESPUÉS de CADA insert en `reservations`
- La tabla `notifications` está en la publicación `supabase_realtime`

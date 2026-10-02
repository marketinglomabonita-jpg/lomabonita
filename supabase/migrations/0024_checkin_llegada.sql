-- Check-in (llegada) de reservas y pasadías.
--
-- `checkin_at` registra el momento real en que el huésped (reserva) o el
-- grupo (pasadía) llegó e ingresó, marcado por el staff desde la página del
-- día:
--   NULL        → todavía no ha llegado (sin marca).
--   timestamptz → llegó; el timestamp ES el momento del check-in.
-- Marcar es idempotente (la primera marca queda; deshacer la vuelve a NULL).
-- No toca RLS ni otras columnas: el UPDATE viaja con el cliente de sesión y
-- queda amparado por la policy "staff all" ya existente en ambas tablas.
alter table public.reservations
  add column if not exists checkin_at timestamptz;

alter table public.tickets
  add column if not exists checkin_at timestamptz;

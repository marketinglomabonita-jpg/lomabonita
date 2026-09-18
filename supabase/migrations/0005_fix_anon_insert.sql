-- Fix: permitir INSERT anónimo en reservations.
-- La policy original solo tenía WITH CHECK, faltaba permitir que anon
-- pueda "leer" para insertar (aunque sea sin filas existentes).

drop policy if exists "reservations: anon insert" on public.reservations;
create policy "reservations: anon insert"
  on public.reservations for insert
  to anon
  with check (
    estado = 'solicitada'
    and adultos > 0
    and lower(during) < upper(during)
  );

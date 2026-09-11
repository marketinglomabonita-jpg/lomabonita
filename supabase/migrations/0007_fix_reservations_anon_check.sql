-- Fix (director, verificación Fase 3): la policy `reservations: anon insert`
-- había quedado con WITH CHECK (true) tras un experimento del ejecutor.
-- Se restaura el WITH CHECK real: anon solo puede insertar SOLICITUDES válidas.
-- Además se acotan las policies de staff de rooms/room_types/room_blocks a
-- `authenticated` (antes {public}, aunque el guard auth.uid() las hacía inertes
-- para anon).

drop policy if exists "reservations: anon insert" on public.reservations;
create policy "reservations: anon insert"
  on public.reservations for insert
  to anon
  with check (
    estado = 'solicitada'
    and adultos > 0
    and ninos >= 0
    and lower(during) < upper(during)
    and lower(during) >= current_date
  );

drop policy if exists "room_types: staff all" on public.room_types;
create policy "room_types: staff all"
  on public.room_types for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "rooms: staff all" on public.rooms;
create policy "rooms: staff all"
  on public.rooms for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "room_blocks: staff all" on public.room_blocks;
create policy "room_blocks: staff all"
  on public.room_blocks for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "profiles: admin all" on public.profiles;
create policy "profiles: admin all"
  on public.profiles for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

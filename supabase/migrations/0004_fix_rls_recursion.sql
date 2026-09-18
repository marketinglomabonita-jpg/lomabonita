-- Fix: recursión infinita en policies que consultan profiles.
-- Solución: crear función helper security definer que bypasea RLS.

create or replace function public.is_staff()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('owner','admin','recepcion','cocina','anfitrion')
      and activo
  );
end $$;

-- Recrear policies usando la función helper

-- profiles
drop policy if exists "profiles: admin all" on public.profiles;
create policy "profiles: admin all"
  on public.profiles for all
  using (
    auth.uid() is not null
    and public.is_staff()
  );

-- room_types
drop policy if exists "room_types: staff all" on public.room_types;
create policy "room_types: staff all"
  on public.room_types for all
  using (
    auth.uid() is not null
    and public.is_staff()
  );

-- rooms
drop policy if exists "rooms: staff all" on public.rooms;
create policy "rooms: staff all"
  on public.rooms for all
  using (
    auth.uid() is not null
    and public.is_staff()
  );

-- room_blocks
drop policy if exists "room_blocks: staff all" on public.room_blocks;
create policy "room_blocks: staff all"
  on public.room_blocks for all
  using (
    auth.uid() is not null
    and public.is_staff()
  );

-- reservations
drop policy if exists "reservations: staff all" on public.reservations;
create policy "reservations: staff all"
  on public.reservations for all
  using (
    auth.uid() is not null
    and public.is_staff()
  );

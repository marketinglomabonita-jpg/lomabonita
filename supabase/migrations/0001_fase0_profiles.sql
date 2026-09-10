-- Fase 0 — identidad del staff.
-- Solo el equipo de Loma Bonita tiene cuenta. Visitantes (huéspedes, comensales,
-- leads) operan anónimos con token opaco; sus tablas llegan en fases posteriores.

create extension if not exists btree_gist;

do $$ begin
  create type staff_role as enum ('owner','admin','recepcion','cocina','anfitrion');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role staff_role not null default 'recepcion',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada quien lee su propia fila.
drop policy if exists "profiles: self read" on public.profiles;
create policy "profiles: self read"
  on public.profiles for select
  using (auth.uid() = id);

-- owner/admin leen y gestionan todas.
drop policy if exists "profiles: admin all" on public.profiles;
create policy "profiles: admin all"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('owner','admin') and p.activo
    )
  );

-- Alta automática de fila al crear el usuario en auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

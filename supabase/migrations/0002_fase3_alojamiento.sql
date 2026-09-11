-- Fase 3 — alojamiento: tipos de habitación, instancias, bloqueos y reservas.
-- Restricción de exclusión a nivel de BD impide doble-booking.
-- RLS en TODAS las tablas nuevas.

-- Tipos de habitación (configuración)
create table if not exists public.room_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  descripcion text,
  capacidad_max int not null check (capacidad_max > 0),
  cama text,
  precio_noche_muestra numeric(12,2) not null check (precio_noche_muestra >= 0),
  is_sample boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.room_types enable row level security;

drop policy if exists "room_types: public read" on public.room_types;
create policy "room_types: public read"
  on public.room_types for select
  using (true);

drop policy if exists "room_types: staff all" on public.room_types;
create policy "room_types: staff all"
  on public.room_types for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner','admin','recepcion')
        and p.activo
    )
  );

-- Instancias físicas de habitaciones
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references public.room_types(id) on delete restrict,
  nombre text not null,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

drop policy if exists "rooms: public read active" on public.rooms;
create policy "rooms: public read active"
  on public.rooms for select
  using (activa = true);

drop policy if exists "rooms: staff all" on public.rooms;
create policy "rooms: staff all"
  on public.rooms for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner','admin','recepcion')
        and p.activo
    )
  );

-- Bloqueos manuales de disponibilidad
create table if not exists public.room_blocks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  during daterange not null,
  motivo text,
  created_at timestamptz not null default now()
);

alter table public.room_blocks enable row level security;

drop policy if exists "room_blocks: public read" on public.room_blocks;
create policy "room_blocks: public read"
  on public.room_blocks for select
  using (true);

drop policy if exists "room_blocks: staff all" on public.room_blocks;
create policy "room_blocks: staff all"
  on public.room_blocks for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner','admin','recepcion')
        and p.activo
    )
  );

-- Reservas (solicitudes y confirmadas)
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  room_id uuid references public.rooms(id) on delete set null,
  during daterange not null,
  adultos int not null check (adultos > 0),
  ninos int not null default 0 check (ninos >= 0),
  nombre text not null,
  email text,
  telefono text,
  notas text,
  estado text not null default 'solicitada' check (estado in ('solicitada','confirmada','rechazada','cancelada')),
  created_at timestamptz not null default now(),
  -- Restricción de exclusión: impide solapamientos de la misma habitación
  exclude using gist (room_id with =, during with &&) where (estado in ('solicitada','confirmada'))
);

alter table public.reservations enable row level security;

-- Anon puede INSERTAR pero SOLO con estado='solicitada' y datos válidos
drop policy if exists "reservations: anon insert" on public.reservations;
create policy "reservations: anon insert"
  on public.reservations for insert
  with check (
    estado = 'solicitada'
    and adultos > 0
    and lower(during) < upper(during)
  );

-- Staff lee y gestiona todas
drop policy if exists "reservations: staff all" on public.reservations;
create policy "reservations: staff all"
  on public.reservations for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner','admin','recepcion')
        and p.activo
    )
  );

-- Publicación de Realtime
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.room_blocks;

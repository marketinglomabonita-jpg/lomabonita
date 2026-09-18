-- Fase 5 — pasadías, experiencias y tickets.
--
-- Tablas: pass_products, experiences, pass_capacity, tickets. RLS en TODAS,
-- en la misma migración (patrón de 0002_reservations + 0008_notifications).
--
-- Cupo por fecha: si no existe fila en pass_capacity para una fecha, el cupo
-- efectivo es el DEFAULT documentado de 60 personas (constante replicada en
-- src/features/pasadias/contracts/types.ts y en el trigger/RPC de aquí).

-- ============================================================================
-- Productos de pasadía (plan base)
-- ============================================================================
create table if not exists public.pass_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  descripcion text,
  precio_persona_muestra numeric(12,2) not null check (precio_persona_muestra >= 0),
  is_sample boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.pass_products enable row level security;

drop policy if exists "pass_products: public read" on public.pass_products;
create policy "pass_products: public read"
  on public.pass_products for select
  using (true);

drop policy if exists "pass_products: staff all" on public.pass_products;
create policy "pass_products: staff all"
  on public.pass_products for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================================
-- Experiencias agregables (karts, cabalgata, balsaje)
-- ============================================================================
create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  descripcion text,
  precio_persona_muestra numeric(12,2) not null check (precio_persona_muestra >= 0),
  is_sample boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.experiences enable row level security;

drop policy if exists "experiences: public read" on public.experiences;
create policy "experiences: public read"
  on public.experiences for select
  using (true);

drop policy if exists "experiences: staff all" on public.experiences;
create policy "experiences: staff all"
  on public.experiences for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================================
-- Cupo por fecha (override puntual; el default vive en la lógica de app/BD)
-- ============================================================================
create table if not exists public.pass_capacity (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  cupo_maximo int not null check (cupo_maximo > 0),
  created_at timestamptz not null default now(),
  unique (fecha)
);

alter table public.pass_capacity enable row level security;

drop policy if exists "pass_capacity: public read" on public.pass_capacity;
create policy "pass_capacity: public read"
  on public.pass_capacity for select
  using (true);

drop policy if exists "pass_capacity: staff all" on public.pass_capacity;
create policy "pass_capacity: staff all"
  on public.pass_capacity for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================================
-- Tickets
-- ============================================================================
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,                  -- PD-XXXXXX
  fecha date not null,
  personas int not null check (personas > 0),
  addons jsonb not null default '[]'::jsonb,    -- slugs de experiences elegidas
  total_muestra numeric(12,2) not null check (total_muestra >= 0),
  nombre text not null,
  email text,
  telefono text,
  estado text not null default 'emitido' check (estado in ('emitido','usado','cancelado')),
  created_at timestamptz not null default now(),
  constraint tickets_addons_is_array check (jsonb_typeof(addons) = 'array')
);

alter table public.tickets enable row level security;

-- Anon SOLO insert, acotado. Cero select/update/delete para anon (patrón reservations).
drop policy if exists "tickets: anon insert" on public.tickets;
create policy "tickets: anon insert"
  on public.tickets for insert
  to anon
  with check (
    estado = 'emitido'
    and personas > 0
    and fecha >= current_date
  );

drop policy if exists "tickets: staff all" on public.tickets;
create policy "tickets: staff all"
  on public.tickets for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================================
-- Guarda anti-carrera del cupo (BEFORE INSERT)
--
-- La Server Action valida el cupo antes de insertar, pero dos solicitudes
-- concurrentes pueden pasar ambas ese chequeo (SELECT + INSERT no es atómico).
-- Este trigger toma un advisory lock por fecha para serializar los inserts
-- concurrentes y revalida el agregado dentro de la BD: si excede, aborta.
-- ============================================================================
create or replace function public.enforce_ticket_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usado int;
  v_cupo int;
begin
  if new.estado = 'cancelado' then
    return new;
  end if;

  -- Serializa inserts de la misma fecha (en READ COMMITTED cada transacción
  -- no ve la fila no confirmada de la otra; el lock fuerza el orden).
  perform pg_advisory_xact_lock(hashtext('ticket_cupo:' || new.fecha::text));

  select coalesce(sum(personas), 0) into v_usado
  from public.tickets
  where fecha = new.fecha and estado <> 'cancelado';

  select cupo_maximo into v_cupo
  from public.pass_capacity
  where fecha = new.fecha;

  -- Default documentado: 60 personas cuando no hay fila en pass_capacity.
  v_cupo := coalesce(v_cupo, 60);

  if v_usado + new.personas > v_cupo then
    raise exception 'CUPO_AGOTADO:%', new.fecha::text
      using errcode = 'P0001',
            hint = 'El cupo de pasadías para esta fecha está completo';
  end if;

  return new;
end;
$$;

drop trigger if exists on_ticket_insert_check_capacity on public.tickets;
create trigger on_ticket_insert_check_capacity
  before insert on public.tickets
  for each row
  execute function public.enforce_ticket_capacity();

-- ============================================================================
-- Cupo disponible por fecha (RPC pública: anon no puede leer tickets,
-- pero sí necesita conocer la disponibilidad para la UI / la Server Action)
-- ============================================================================
create or replace function public.ticket_cupo_disponible(p_fecha date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usado int;
  v_cupo int;
begin
  select coalesce(sum(personas), 0) into v_usado
  from public.tickets
  where fecha = p_fecha and estado <> 'cancelado';

  select cupo_maximo into v_cupo
  from public.pass_capacity
  where fecha = p_fecha;

  return coalesce(v_cupo, 60) - v_usado;
end;
$$;

grant execute on function public.ticket_cupo_disponible(date) to anon, authenticated;

-- ============================================================================
-- Notificación por ticket emitido (tipo 'pasadia')
--
-- Se extiende el CHECK de notifications.tipo para admitir 'pasadia' (decisión:
-- tipo propio, distinguible de 'reserva' en el panel; el constraint existente
-- se reemplaza de forma dinámica para no depender de su nombre generado).
-- ============================================================================
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.notifications'::regclass and contype = 'c'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
  end loop;

  alter table public.notifications
    add constraint notifications_tipo_check
    check (tipo in ('reserva','pasadia','lead','pedido','sistema'));
end $$;

create or replace function public.notify_new_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (tipo, titulo, cuerpo, ref_table, ref_id)
  values (
    'pasadia',
    'Nuevo ticket de pasadía ' || new.codigo,
    new.nombre || ' · ' || to_char(new.fecha, 'DD/MM/YYYY') || ' · ' || new.personas || ' persona(s)',
    'tickets',
    new.id
  );
  return new;
end;
$$;

drop trigger if exists on_ticket_created on public.tickets;
create trigger on_ticket_created
  after insert on public.tickets
  for each row
  execute function public.notify_new_ticket();

-- ============================================================================
-- Realtime
-- ============================================================================
alter publication supabase_realtime add table public.tickets;

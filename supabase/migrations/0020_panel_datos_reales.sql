-- Fase 2 del panel — datos reales + abonos (payments).
--
-- (A) Columnas nuevas: rooms.numero / rooms.capacidad (habitaciones reales
--     identificadas por número) y reservations.valor_total (precio pactado;
--     el saldo de una reserva = valor_total − suma de sus abonos).
-- (B) Tabla payments: abonos (pagos parciales) de una reserva o de un ticket.
--     Exactamente UNO de los dos destinos (check XOR). Append-only como
--     audit_log (0017): solo SELECT e INSERT para staff, sin UPDATE/DELETE.
-- (C) Cupo de pasadías: el default documentado pasa de 60 a 100 personas
--     cuando no hay fila en pass_capacity. Se redefinen las DOS funciones de
--     0009 que replican la constante (trigger + RPC), sin cambiar su lógica.
-- (D) Seed REAL (is_sample = false): room_type padre 'finca', las 10
--     habitaciones reales con capacidad, y los 4 planes de pasadía.
-- (E) Limpieza del DEMO: reservas/tickets de prueba y filas is_sample.
--     Va al final y en orden de claves foráneas (reservas y tickets antes
--     que rooms; rooms antes que room_types por el ON DELETE restrict).
--
-- Idempotente: IF NOT EXISTS, ON CONFLICT, CREATE OR REPLACE. Se puede
-- aplicar dos veces sin romper.

-- ============================================================================
-- (A) Columnas nuevas
-- ============================================================================
alter table public.rooms
  add column if not exists numero int;
alter table public.rooms
  add column if not exists capacidad int;
alter table public.reservations
  add column if not exists valor_total numeric(12,2);

-- ============================================================================
-- (B) Abonos: payments (una reserva o un ticket, nunca ambos)
-- ============================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations(id) on delete cascade,
  ticket_id uuid references public.tickets(id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  medio text,                                   -- efectivo, transferencia, ...
  nota text,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  created_at timestamptz not null default now(),
  -- XOR: exactamente uno de los dos destinos debe estar presente
  constraint payments_one_target
    check ((reservation_id is not null) <> (ticket_id is not null))
);

create index if not exists idx_payments_reservation
  on public.payments (reservation_id);
create index if not exists idx_payments_ticket
  on public.payments (ticket_id);

alter table public.payments enable row level security;

-- Todo el staff ve los abonos: recepción necesita el saldo al hacer check-in.
drop policy if exists "payments: staff select" on public.payments;
create policy "payments: staff select"
  on public.payments for select
  to authenticated
  using (public.is_staff());

-- El staff registra abonos; append-only: sin políticas de UPDATE ni DELETE.
drop policy if exists "payments: staff insert" on public.payments;
create policy "payments: staff insert"
  on public.payments for insert
  to authenticated
  with check (public.is_staff());

-- ============================================================================
-- (C) Cupo de pasadías: default 60 -> 100
--
--     Mismo cuerpo de 0009, solo cambia la constante replicada. Redefinir la
--     función actualiza el comportamiento del trigger existente sin tocarlo.
-- ============================================================================

-- Guarda anti-carrera del cupo (BEFORE INSERT). Serializa inserts de la misma
-- fecha con advisory lock y revalida el agregado dentro de la BD.
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

  -- Default documentado: 100 personas cuando no hay fila en pass_capacity.
  v_cupo := coalesce(v_cupo, 100);

  if v_usado + new.personas > v_cupo then
    raise exception 'CUPO_AGOTADO:%', new.fecha::text
      using errcode = 'P0001',
            hint = 'El cupo de pasadías para esta fecha está completo';
  end if;

  return new;
end;
$$;

-- Cupo disponible por fecha (RPC pública).
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

  return coalesce(v_cupo, 100) - v_usado;
end;
$$;

-- Re-grant defensivo: create or replace conserva los grants, esto no cuesta
-- nada y deja la RPC pública en el mismo estado que 0009.
grant execute on function public.ticket_cupo_disponible(date) to anon, authenticated;

-- ============================================================================
-- (D) Seed REAL (is_sample = false, upsert idempotente)
-- ============================================================================

-- Room type padre genérico: la capacidad real vive POR HABITACIÓN
-- (rooms.capacidad). precio_noche_muestra queda en 0: aún no hay precio
-- público por noche pactado.
insert into public.room_types (slug, nombre, descripcion, capacidad_max, precio_noche_muestra, is_sample)
values (
  'finca',
  'Finca Hotel Loma Bonita',
  'Las 10 habitaciones de la finca: gran familiares, familiares y matrimoniales.',
  10,
  0.00,
  false
)
on conflict (slug) do update
  set nombre = excluded.nombre,
      capacidad_max = excluded.capacidad_max,
      is_sample = false;

-- Las 10 habitaciones reales, upsert por numero. El índice único es la
-- llave del upsert; los NULL no chocan entre sí, así que puede crearse
-- aunque aún existan habitaciones demo sin numero.
create unique index if not exists rooms_numero_key
  on public.rooms (numero);

insert into public.rooms (room_type_id, numero, nombre, capacidad, activa)
select rt.id, v.numero, v.nombre, v.capacidad, true
from (
  values
    (1,  'Gran Familiar La Loma',      10),
    (2,  'Gran Familiar Río La Vieja', 10),
    (3,  'Familiar Guadua',             3),
    (4,  'Familiar Cafetal',            5),
    (5,  'Familiar Piedras de Moler',   4),
    (6,  'Matrimonial Atardecer',       2),
    (7,  'Matrimonial Palmeras',        2),
    (8,  'Familiar Mirador',            3),
    (9,  'Familiar Alcalá',             3),
    (10, 'Familiar Cartago',            3)
) as v(numero, nombre, capacidad)
cross join lateral (
  select id from public.room_types where slug = 'finca' limit 1
) rt
on conflict (numero) do update
  set nombre = excluded.nombre,
      capacidad = excluded.capacidad,
      activa = true,
      room_type_id = excluded.room_type_id;

-- Los 4 planes reales de pasadía.
insert into public.pass_products (slug, nombre, precio_persona_muestra, is_sample)
values
  ('loma-relax',             'Loma Relax',             45000.00,  false),
  ('loma-racing',            'Loma Racing',            60000.00,  false),
  ('loma-aventura-balsaje',  'Loma Aventura Balsaje',  110000.00, false),
  ('loma-aventura-cascadas', 'Loma Aventura Cascadas', 100000.00, false)
on conflict (slug) do update
  set nombre = excluded.nombre,
      precio_persona_muestra = excluded.precio_persona_muestra,
      is_sample = false;

-- ============================================================================
-- (E) Limpieza del DEMO — el director la revisa antes de aplicar.
--
--     En este punto TODO lo existente es de prueba (no hay datos reales aún):
--     codigo es NOT NULL en ambas tablas, así que estos deletes borran todas
--     las reservas y todos los tickets actuales. Orden por claves foráneas:
--     reservations/tickets primero, rooms antes que room_types (restrict),
--     room_blocks cascada sola con rooms.
-- ============================================================================
delete from public.reservations where codigo is not null;   -- reserva(s) de prueba
delete from public.tickets where codigo is not null;        -- ticket(s) de prueba
delete from public.pass_products where is_sample = true;    -- 'Pasadía Recreativo' demo
delete from public.rooms where numero is null;              -- 11 habitaciones demo
delete from public.room_types where is_sample = true;       -- tipos demo
delete from public.experiences where is_sample = true;      -- experiencias demo (add-ons fuera del modelo actual)

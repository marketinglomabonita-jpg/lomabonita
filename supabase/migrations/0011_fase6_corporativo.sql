-- Fase 6 — portafolio de experiencias corporativas + captación de leads.
--
-- Tablas: corp_experience_types, corp_addons, corp_leads. RLS en TODAS,
-- en la misma migración (patrón de 0002/0008/0009).
--
-- Criterio de precio por persona vs fijo:
--   * POR PERSONA: todo lo que se consume o contrata por asistente
--     (acceso, piscina, comidas, hospedaje, actividades dirigidas,
--     experiencias, entradas a parques).
--   * FIJO: renta de espacios para eventos (salón/escenario) — se cobra
--     por jornada/evento, no por asistente.
--
-- Rate-limit de leads: máximo 3 inserts por origen_ip en la última hora,
-- enforced por trigger BEFORE INSERT con advisory lock (anti-carrera,
-- patrón de 0009). La Server Action detecta LEAD_RATE_LIMIT y devuelve
-- un mensaje legible; la BD es la autoridad.

-- ============================================================================
-- Tipos de experiencia corporativa
-- ============================================================================
create table if not exists public.corp_experience_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  descripcion text,
  is_sample boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.corp_experience_types enable row level security;

drop policy if exists "corp_experience_types: public read" on public.corp_experience_types;
create policy "corp_experience_types: public read"
  on public.corp_experience_types for select
  using (true);

drop policy if exists "corp_experience_types: staff all" on public.corp_experience_types;
create policy "corp_experience_types: staff all"
  on public.corp_experience_types for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================================
-- Addons seleccionables en el wizard (incluir / experiencia / destino)
-- ============================================================================
create table if not exists public.corp_addons (
  id uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in ('incluir','experiencia','destino')),
  slug text unique not null,
  nombre text not null,
  descripcion text,
  -- Exactamente una de las dos modalidades de precio
  precio_persona_muestra numeric(12,2) check (precio_persona_muestra >= 0),
  precio_fijo_muestra numeric(12,2) check (precio_fijo_muestra >= 0),
  is_sample boolean not null default true,
  created_at timestamptz not null default now(),
  constraint corp_addons_precio_exactly_one check (
    (precio_persona_muestra is not null) <> (precio_fijo_muestra is not null)
  )
);

alter table public.corp_addons enable row level security;

drop policy if exists "corp_addons: public read" on public.corp_addons;
create policy "corp_addons: public read"
  on public.corp_addons for select
  using (true);

drop policy if exists "corp_addons: staff all" on public.corp_addons;
create policy "corp_addons: staff all"
  on public.corp_addons for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================================
-- Leads corporativos
-- ============================================================================
create table if not exists public.corp_leads (
  id uuid primary key default gen_random_uuid(),
  tipo_experiencia text not null references public.corp_experience_types(slug),
  personas int not null check (personas > 0),
  fecha_tentativa date,
  incluir jsonb not null default '[]'::jsonb,
  experiencias jsonb not null default '[]'::jsonb,
  destinos jsonb not null default '[]'::jsonb,
  valor_estimado numeric(12,2) not null check (valor_estimado >= 0),
  nombre text not null,
  empresa text,
  email text not null,
  whatsapp text,
  estado text not null default 'nuevo' check (estado in ('nuevo','contactado','cerrado','descartado')),
  origen_ip text,
  created_at timestamptz not null default now(),
  constraint corp_leads_incluir_is_array check (jsonb_typeof(incluir) = 'array'),
  constraint corp_leads_experiencias_is_array check (jsonb_typeof(experiencias) = 'array'),
  constraint corp_leads_destinos_is_array check (jsonb_typeof(destinos) = 'array')
);

alter table public.corp_leads enable row level security;

-- Anon SOLO insert, acotado. Cero select/update/delete para anon
-- (patrón reservations/tickets). El email se revalida aquí además de en Zod.
drop policy if exists "corp_leads: anon insert" on public.corp_leads;
create policy "corp_leads: anon insert"
  on public.corp_leads for insert
  to anon
  with check (
    estado = 'nuevo'
    and personas > 0
    and email ~* '^[^@]+@[^@]+\.[^@]+$'
  );

drop policy if exists "corp_leads: staff all" on public.corp_leads;
create policy "corp_leads: staff all"
  on public.corp_leads for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================================
-- Rate-limit: máximo 3 leads por origen_ip en la última hora (BEFORE INSERT)
--
-- La Server Action cuenta antes de insertar para devolver un mensaje claro,
-- pero la BD es la autoridad: advisory lock por IP + recount dentro de la
-- transacción aborta el 4º insert aunque dos solicitudes lleguen a la vez.
-- ============================================================================
create or replace function public.enforce_corp_lead_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recientes int;
begin
  perform pg_advisory_xact_lock(hashtext('corp_lead_rl:' || coalesce(new.origen_ip, 'unknown')));

  select count(*) into v_recientes
  from public.corp_leads
  where origen_ip is not distinct from new.origen_ip
    and created_at > now() - interval '1 hour';

  if v_recientes >= 3 then
    raise exception 'LEAD_RATE_LIMIT:%', coalesce(new.origen_ip, 'unknown')
      using errcode = 'P0001',
            hint = 'Demasiadas solicitudes desde el mismo origen en la última hora';
  end if;

  return new;
end;
$$;

drop trigger if exists on_corp_lead_check_rate_limit on public.corp_leads;
create trigger on_corp_lead_check_rate_limit
  before insert on public.corp_leads
  for each row
  execute function public.enforce_corp_lead_rate_limit();

-- ============================================================================
-- Consulta de rate-limit para la Server Action (anon no puede leer corp_leads)
--
-- Devuelve booleano (nunca el count) para no filtrar actividad de otras IPs.
-- El umbral (3/hora) es el mismo del trigger anterior.
-- ============================================================================
create or replace function public.corp_lead_puede_enviar(p_ip text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recientes int;
begin
  select count(*) into v_recientes
  from public.corp_leads
  where origen_ip is not distinct from p_ip
    and created_at > now() - interval '1 hour';

  return v_recientes < 3;
end;
$$;

grant execute on function public.corp_lead_puede_enviar(text) to anon, authenticated;

-- ============================================================================
-- Notificación por lead recibido (tipo 'lead')
--
-- La 0009 ya dejó 'lead' en el CHECK de notifications.tipo; este bloque lo
-- re-asegura de forma idempotente por si el constraint cambió de nombre.
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

create or replace function public.notify_new_corp_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (tipo, titulo, cuerpo, ref_table, ref_id)
  values (
    'lead',
    'Nueva cotización corporativa de ' || new.nombre,
    coalesce(new.empresa, 'Sin empresa') || ' · ' || new.personas || ' persona(s)'
      || case when new.fecha_tentativa is not null
         then ' · ' || to_char(new.fecha_tentativa, 'DD/MM/YYYY')
         else '' end,
    'corp_leads',
    new.id
  );
  return new;
end;
$$;

drop trigger if exists on_corp_lead_created on public.corp_leads;
create trigger on_corp_lead_created
  after insert on public.corp_leads
  for each row
  execute function public.notify_new_corp_lead();

-- ============================================================================
-- Realtime
-- ============================================================================
alter publication supabase_realtime add table public.corp_leads;

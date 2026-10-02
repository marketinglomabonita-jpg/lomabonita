-- Fase 1A — Panel de gestión: roles nuevos + auditoría append-only.
--
-- (a) Amplía el enum staff_role con los roles del panel. Gotcha PostgreSQL:
--     ALTER TYPE ... ADD VALUE no puede ejecutarse si el valor nuevo se USA en
--     la misma transacción; aquí solo se agregan, ninguna sentencia de este
--     archivo los referencia. El uso llega en migraciones posteriores.
--
-- (b) Tabla audit_log: registro append-only de quién hizo qué en el panel.
--     Solo el staff autenticado lee e inserta (mismo patrón RLS del proyecto,
--     ver 0006/0007/0008); sin políticas de UPDATE ni DELETE por diseño.

-- (a) Roles nuevos del panel
alter type public.staff_role add value if not exists 'gerente';
alter type public.staff_role add value if not exists 'comercial';

-- (b) Auditoría
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  action text not null,
  entity text,
  entity_id text,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_created_at
  on public.audit_log (created_at desc);
create index if not exists idx_audit_log_entity
  on public.audit_log (entity, entity_id);

alter table public.audit_log enable row level security;

-- Solo el staff autenticado puede leer la auditoría
drop policy if exists "audit_log: staff select" on public.audit_log;
create policy "audit_log: staff select"
  on public.audit_log for select
  to authenticated
  using (public.is_staff());

-- El staff autenticado registra acciones; la tabla es append-only
drop policy if exists "audit_log: staff insert" on public.audit_log;
create policy "audit_log: staff insert"
  on public.audit_log for insert
  to authenticated
  with check (public.is_staff());

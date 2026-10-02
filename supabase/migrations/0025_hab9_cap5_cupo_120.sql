-- ============================================================================
-- 0025 — Datos confirmados por el propietario (2026-10):
--   (A) Habitación #9 (Familiar Alcalá): capacidad 3 -> 5 personas.
--   (B) Cupo de pasadías por día: default documentado 100 -> 120 personas
--       (cuando no hay fila específica en pass_capacity).
-- Idempotente. No cambia RLS. Mantiene el patrón de 0009/0020.
-- ============================================================================

-- (A) Capacidad real de la habitación 9.
update public.rooms set capacidad = 5 where numero = 9;

-- (B) Cupo por defecto 100 -> 120 en las dos funciones (guarda anti-carrera + RPC).
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

  perform pg_advisory_xact_lock(hashtext('ticket_cupo:' || new.fecha::text));

  select coalesce(sum(personas), 0) into v_usado
  from public.tickets
  where fecha = new.fecha and estado <> 'cancelado';

  select cupo_maximo into v_cupo
  from public.pass_capacity
  where fecha = new.fecha;

  -- Default documentado: 120 personas cuando no hay fila en pass_capacity.
  v_cupo := coalesce(v_cupo, 120);

  if v_usado + new.personas > v_cupo then
    raise exception 'CUPO_AGOTADO:%', new.fecha::text
      using errcode = 'P0001',
            hint = 'El cupo de pasadías para esta fecha está completo';
  end if;

  return new;
end;
$$;

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

  return coalesce(v_cupo, 120) - v_usado;
end;
$$;

grant execute on function public.ticket_cupo_disponible(date) to anon, authenticated;

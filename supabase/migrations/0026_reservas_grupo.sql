-- Reservas de grupo: Casa Llena y Grupal (varias habitaciones a un titular).
--
-- Un grupo reserva VARIAS habitaciones en un mismo rango bajo un mismo nombre:
--   casa_llena → TODAS las habitaciones activas (la casa completa).
--   grupal     → las habitaciones elegidas + nº de personas del grupo.
-- Cada habitación sigue siendo UNA fila de reservations: el no-cruce por
-- habitación lo garantiza la restricción de exclusión ya existente (error
-- 23P01), y como un INSERT multi-fila es UNA sola sentencia, el grupo entra
-- completo o NO entra (atómico). Las filas del mismo bloque quedan enlazadas
-- por `grupo_id` (uuid generado al crear el grupo) y se gestionan como bloque.
--
-- Columnas nuevas, todas opcionales (NULL = reserva individual normal):
--   grupo_id      → uuid compartido por todas las filas del mismo grupo.
--   participantes → nº total de personas del grupo; SOLO lo lleva la fila
--                   representante (habitación de menor numero) de una grupal.
--   grupo_tipo    → 'casa_llena' | 'grupal' (check); NULL en individuales.
-- El dinero del grupo (valor_total y sus abonos) vive SOLO en la fila
-- representante; las demás filas viajan con valor_total = NULL.
-- No toca RLS ni la restricción de exclusión: los INSERT de grupo viajan con
-- el cliente de sesión, amparados por la policy "staff all" ya existente.
alter table public.reservations
  add column if not exists grupo_id uuid;

alter table public.reservations
  add column if not exists participantes int;

alter table public.reservations
  add column if not exists grupo_tipo text;

-- Check del tipo de bloque (en bloque aparte para ser idempotente incluso si
-- la columna ya existiera sin él). NULL pasa solo: check y NULL se llevan bien.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservations_grupo_tipo_check'
      and conrelid = 'public.reservations'::regclass
  ) then
    alter table public.reservations
      add constraint reservations_grupo_tipo_check
      check (grupo_tipo in ('casa_llena', 'grupal'));
  end if;
end
$$;

comment on column public.reservations.grupo_id is
  'Uuid compartido por las filas de un mismo grupo (casa llena o grupal); NULL = reserva individual';
comment on column public.reservations.participantes is
  'Nº total de personas del grupo; solo la fila representante (habitación de menor numero) de una reserva grupal';
comment on column public.reservations.grupo_tipo is
  'Tipo de bloque de grupo: casa_llena | grupal; NULL = reserva individual';

-- Para operar el bloque completo por grupo_id (cancelar/eliminar el grupo).
create index if not exists reservations_grupo_id_idx
  on public.reservations (grupo_id);

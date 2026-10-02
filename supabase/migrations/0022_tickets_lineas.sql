-- R4 del panel — pasadías combinadas (varios planes en un mismo grupo).
--
-- Un grupo puede mezclar planes (ej. 3 Loma Relax + 2 Loma Racing) en UNA sola
-- reserva de pasadía. El desglose por línea se guarda en `lineas`:
--   [{ "plan": "loma-relax", "nombre": "Loma Relax", "personas": 3,
--      "precio_persona": 45000, "subtotal": 135000 }, ...]
-- `tickets.personas` sigue siendo el TOTAL de personas (lo usa el trigger de
-- cupo) y `total_muestra` el total en dinero (suma de subtotales).
alter table public.tickets
  add column if not exists lineas jsonb not null default '[]'::jsonb;

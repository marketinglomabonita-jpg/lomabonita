-- R4.A del panel — experiencias adicionales en una reserva de alojamiento.
--
-- Toda reserva de hotel ya incluye Loma Relax (las áreas comunes). El huésped
-- puede sumar experiencias extra (p. ej. Balsaje, Cascadas). Se guardan en
-- `extras`: [{ "plan":"loma-aventura-balsaje", "nombre":"Loma Aventura Balsaje",
--             "personas":2, "precio":110000, "subtotal":220000 }, ...]
-- El valor_total de la reserva suma estos subtotales. Tarifa de add-on editable
-- (por ahora prefijada con el precio de la pasadía; pendiente de confirmar).
alter table public.reservations
  add column if not exists extras jsonb not null default '[]'::jsonb;

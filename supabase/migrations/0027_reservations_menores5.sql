-- Regla del negocio: niños menores de 5 años GRATIS en el alojamiento; de 5
-- en adelante pagan tarifa normal (ya se registran en `ninos`). `menores_5`
-- cuenta a los que no pagan: solo registro, NO suma al valor_total. Así el
-- formulario de reserva desglosa tres grupos y la sugerencia de precio deja
-- de necesitar ajuste manual. Idempotente para poder re-aplicar.
alter table public.reservations
  add column if not exists menores_5 int not null default 0;

comment on column public.reservations.menores_5 is
  'Niños menores de 5 años: gratis, solo registro (no suman al valor_total).';

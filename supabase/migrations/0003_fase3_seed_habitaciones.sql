-- Fase 3 — seed: 11 habitaciones ficticias distribuidas en 3 room_types.
-- Aforo total: 34 personas (entre 33 y 37).
-- Todas marcadas is_sample = true.

insert into public.room_types (slug, nombre, descripcion, capacidad_max, cama, precio_noche_muestra, is_sample)
values
  (
    'clasica-doble',
    'Habitación Clásica Doble',
    'Un refugio acogedor perfecto para parejas que desean desconectarse el fin de semana. Privacidad, comodidad y el arrullo del viento y los pájaros al amanecer.',
    2,
    'Cama matrimonial doble',
    120000.00,
    true
  ),
  (
    'confort-familiar',
    'Habitación Confort Familiar',
    'Habitación diseñada para familias pequeñas. Cómodas camas, lencería premium, baño privado y vistas a los jardines de la loma.',
    3,
    'Cama doble + individual',
    180000.00,
    true
  ),
  (
    'cabana-multiple',
    'Cabaña Múltiple para Grupos',
    'Ideal para grupos que buscan convivencia y diversión. Excelente distribución de camas en litera e individuales con ambiente rústico campestre.',
    6,
    'Literas + camas individuales',
    250000.00,
    true
  )
on conflict (slug) do nothing;

-- 11 habitaciones distribuidas: 5 dobles, 4 familiares, 2 grupales.
-- Total aforo: 5*2 + 4*3 + 2*6 = 10 + 12 + 12 = 34.

insert into public.rooms (room_type_id, nombre, activa)
select rt.id, 'Habitación Doble 1', true from public.room_types rt where rt.slug = 'clasica-doble'
union all
select rt.id, 'Habitación Doble 2', true from public.room_types rt where rt.slug = 'clasica-doble'
union all
select rt.id, 'Habitación Doble 3', true from public.room_types rt where rt.slug = 'clasica-doble'
union all
select rt.id, 'Habitación Doble 4', true from public.room_types rt where rt.slug = 'clasica-doble'
union all
select rt.id, 'Habitación Doble 5', true from public.room_types rt where rt.slug = 'clasica-doble'
union all
select rt.id, 'Habitación Familiar 1', true from public.room_types rt where rt.slug = 'confort-familiar'
union all
select rt.id, 'Habitación Familiar 2', true from public.room_types rt where rt.slug = 'confort-familiar'
union all
select rt.id, 'Habitación Familiar 3', true from public.room_types rt where rt.slug = 'confort-familiar'
union all
select rt.id, 'Habitación Familiar 4', true from public.room_types rt where rt.slug = 'confort-familiar'
union all
select rt.id, 'Cabaña Grupal 1', true from public.room_types rt where rt.slug = 'cabana-multiple'
union all
select rt.id, 'Cabaña Grupal 2', true from public.room_types rt where rt.slug = 'cabana-multiple'
on conflict do nothing;

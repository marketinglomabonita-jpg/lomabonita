-- Fase 5 — seed: producto de pasadía y experiencias agregables.
-- Precios de muestra (is_sample = true), reemplazables tras la reunión
-- con el propietario. No se siembran filas de pass_capacity: el cupo
-- default documentado (60 personas) cubre toda fecha sin override, y el
-- panel de administración puede crear overrides puntuales.

insert into public.pass_products (slug, nombre, descripcion, precio_persona_muestra, is_sample)
values (
  'pasadia-recreativo',
  'Pasadía Recreativo',
  'Acceso de 9:00 a.m. a 5:30 p.m. a todas las áreas comunes de la finca: piscina tropical, zonas verdes y hamacas, cancha de fútbol en césped natural, salón de juegos con billares y zona infantil.',
  25000.00,
  true
)
on conflict (slug) do nothing;

insert into public.experiences (slug, nombre, descripcion, precio_persona_muestra, is_sample)
values
  (
    'karts',
    'Pista de karts',
    'Adrenalina entre las montañas: carrera entre amigos o vueltas de práctica en pista campestre y segura, ideal para niños, jóvenes y adultos.',
    20000.00,
    true
  ),
  (
    'cabalgata',
    'Cabalgata',
    'Paseo guiado a caballo por los caminos de la finca y sus alrededores en Piedras de Moler, con caballos mansos aptos para principiantes.',
    35000.00,
    true
  ),
  (
    'balsaje',
    'Balsaje por el Río La Vieja',
    'Navegación en balsa de guadua tradicional con bogas guías: ~3 horas y ~12 km por el Río La Vieja, junto a la Reserva del Ocaso, con almuerzo campesino a mitad de recorrido. Salida y regreso desde Loma Bonita.',
    90000.00,
    true
  )
on conflict (slug) do nothing;

-- Fase 7 — seed de restaurante con platos típicos del Eje Cafetero.
--
-- Categorías: Platos Fuertes, Sopas, Bebidas, Postres. ~10-14 platos de ejemplo
-- con precios de muestra en COP. Uno marcado `es_plato_del_dia = true`. Todas
-- las filas `is_sample=true`. `on conflict do nothing` para idempotencia.

-- ============================================================================
-- Categorías
-- ============================================================================
insert into public.menu_categories (slug, nombre, orden, is_sample)
values
  ('platos-fuertes', 'Platos Fuertes', 1, true),
  ('sopas', 'Sopas', 2, true),
  ('bebidas', 'Bebidas', 3, true),
  ('postres', 'Postres', 4, true)
on conflict (slug) do nothing;

-- ============================================================================
-- Ítems
-- ============================================================================
insert into public.menu_items (category_id, slug, nombre, descripcion, precio_muestra, disponible, es_plato_del_dia, is_sample)
select
  (select id from public.menu_categories where slug = 'platos-fuertes'),
  'bandeja-paisa',
  'Bandeja Paisa',
  'Fríjoles, arroz, carne molida, chicharrón, chorizo, huevo, arepa, aguacate y plátano maduro',
  28000,
  true,
  true,  -- Plato del día
  true
union all select
  (select id from public.menu_categories where slug = 'platos-fuertes'),
  'trucha-frita',
  'Trucha Frita',
  'Trucha fresca del Eje Cafetero, frita con patacón, arroz, ensalada y salsa de la casa',
  32000,
  true,
  false,
  true
union all select
  (select id from public.menu_categories where slug = 'platos-fuertes'),
  'mojarra-frita',
  'Mojarra Frita',
  'Mojarra completa frita con patacón, arroz, ensalada y limón',
  35000,
  true,
  false,
  true
union all select
  (select id from public.menu_categories where slug = 'platos-fuertes'),
  'frijoles-con-garra',
  'Fríjoles con Garra',
  'Fríjoles rojos con chicharrón, chorizo, arroz, aguacate, arepa y plátano',
  22000,
  true,
  false,
  true
union all select
  (select id from public.menu_categories where slug = 'platos-fuertes'),
  'arepa-de-chocolo',
  'Arepa de Chócolo con Queso',
  'Arepa de maíz tierno con queso campesino y mantequilla',
  12000,
  true,
  false,
  true
union all select
  (select id from public.menu_categories where slug = 'platos-fuertes'),
  'sancocho-campesino',
  'Sancocho Campesino',
  'Sopa espesa con pollo, yuca, plátano, papa criolla, mazorca y cilantro',
  18000,
  true,
  false,
  true
union all select
  (select id from public.menu_categories where slug = 'sopas'),
  'sancocho-de-gallina',
  'Sancocho de Gallina',
  'Sopa tradicional con gallina criolla, papa, yuca, mazorca y cilantro',
  20000,
  true,
  false,
  true
union all select
  (select id from public.menu_categories where slug = 'sopas'),
  'sopa-de-lentejas',
  'Sopa de Lentejas',
  'Lentejas con papa, zanahoria, plátano y hogao',
  14000,
  true,
  false,
  true
union all select
  (select id from public.menu_categories where slug = 'bebidas'),
  'limonada-natural',
  'Limonada Natural',
  'Limonada en agua o leche',
  5000,
  true,
  false,
  true
union all select
  (select id from public.menu_categories where slug = 'bebidas'),
  'cafe-campesino',
  'Café Campesino',
  'Café 100% del Eje Cafetero, tinto o con leche',
  4000,
  true,
  false,
  true
union all select
  (select id from public.menu_categories where slug = 'bebidas'),
  'aguapanela-con-limon',
  'Aguapanela con Limón',
  'Bebida tradicional de panela con limón',
  4500,
  true,
  false,
  true
union all select
  (select id from public.menu_categories where slug = 'postres'),
  'mazamorra',
  'Mazamorra',
  'Postre de maíz blanco con panela y leche',
  8000,
  true,
  false,
  true
union all select
  (select id from public.menu_categories where slug = 'postres'),
  'bocadillo-con-queso',
  'Bocadillo con Queso',
  'Bocadillo de guayaba con queso campesino',
  7000,
  true,
  false,
  true
union all select
  (select id from public.menu_categories where slug = 'postres'),
  'flan-de-cafe',
  'Flan de Café',
  'Flan casero de café del Eje Cafetero',
  9000,
  true,
  false,
  true
on conflict (slug) do nothing;

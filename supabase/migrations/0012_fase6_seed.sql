-- Fase 6 — seed: tipos de experiencia corporativa y addons seleccionables.
-- Precios de muestra (is_sample = true), reemplazables tras la reunión con
-- el propietario. Descripciones tomadas del copy aprobado del PDF
-- "Experiencias Corporativas Loma Bonita".

insert into public.corp_experience_types (slug, nombre, descripcion, is_sample)
values
  (
    'pasadia-corporativo',
    'PASADÍA CORPORATIVO',
    'Un día para desconectarse de la rutina y compartir. Una alternativa para empresas que quieren disfrutar de una jornada diferente sin necesidad de organizar un programa dirigido.',
    true
  ),
  (
    'integracion-team-building',
    'INTEGRACIÓN & TEAM BUILDING',
    'No se trata solamente de pasarla bien. Se trata de conectar al equipo. Diseña una jornada con actividades dirigidas para trabajar en equipo, comunicación, liderazgo, resolución de conflictos, confianza, colaboración y habilidades blandas.',
    true
  ),
  (
    'eventos-corporativos',
    'EVENTOS CORPORATIVOS',
    'El espacio que necesitas para hacer realidad tu propio evento. Nosotros ponemos el escenario: reuniones empresariales, capacitaciones, talleres, conferencias, celebraciones y jornadas de planeación.',
    true
  ),
  (
    'experiencia-corporativa',
    'EXPERIENCIA CORPORATIVA',
    'Cuando quieres mucho más que un día. Una experiencia diseñada para combinar trabajo, integración, descanso y aventura en una agenda de uno o varios días.',
    true
  )
on conflict (slug) do nothing;

-- Categoría 'incluir': base de la jornada (por persona, salvo renta de espacios = fijo)
insert into public.corp_addons (categoria, slug, nombre, descripcion, precio_persona_muestra, precio_fijo_muestra, is_sample)
values
  ('incluir', 'acceso-instalaciones', 'Acceso a las instalaciones', 'Acceso a las instalaciones de Loma Bonita durante la jornada.', 25000.00, null, true),
  ('incluir', 'piscina', 'Piscina y áreas recreativas', 'Uso de piscina y áreas recreativas.', 18000.00, null, true),
  ('incluir', 'espacios-eventos', 'Espacios para eventos', 'Renta de los espacios y escenarios disponibles para tu agenda (salones, zonas de reunión).', null, 900000.00, true),
  ('incluir', 'refrigerio', 'Refrigerio', 'Refrigerio para el equipo durante la jornada.', 12000.00, null, true),
  ('incluir', 'almuerzo', 'Almuerzo', 'Almuerzo típico en el restaurante campestre.', 25000.00, null, true),
  ('incluir', 'cena', 'Cena', 'Cena para cierres de jornada o experiencias de varios días.', 30000.00, null, true),
  ('incluir', 'hospedaje', 'Hospedaje', 'Alojamiento por persona (por noche, tarifa de muestra).', 95000.00, null, true)
on conflict (slug) do nothing;

-- Categoría 'experiencia': complementos (todas por persona)
insert into public.corp_addons (categoria, slug, nombre, descripcion, precio_persona_muestra, precio_fijo_muestra, is_sample)
values
  ('experiencia', 'actividad-integracion', 'Actividad de integración dirigida', 'Retos y actividades experienciales diseñados de acuerdo con el objetivo de tu empresa.', 45000.00, null, true),
  ('experiencia', 'cabalgata', 'Cabalgata', 'Una experiencia para disfrutar el entorno natural y salir de la rutina.', 35000.00, null, true),
  ('experiencia', 'balsaje', 'Balsaje', 'Aventura, naturaleza y trabajo en equipo en una experiencia diferente.', 95000.00, null, true),
  ('experiencia', 'pista-karts', 'Pista de Karts', 'Una dosis de competencia y diversión para el equipo.', 20000.00, null, true),
  ('experiencia', 'masaje-bienestar', 'Bienestar', 'Masajes y experiencias pensadas para relajarse y desconectarse.', 60000.00, null, true),
  ('experiencia', 'otra-experiencia', 'Experiencias outdoor', 'Actividades que llevan al equipo a salir de la rutina y enfrentarse a nuevos retos.', 30000.00, null, true)
on conflict (slug) do nothing;

-- Categoría 'destino': parques y atractivos del Eje Cafetero (entradas por persona)
insert into public.corp_addons (categoria, slug, nombre, descripcion, precio_persona_muestra, precio_fijo_muestra, is_sample)
values
  ('destino', 'parque-nacional-cafe', 'Parque Nacional del Café', 'Entrada al Parque Nacional del Café (tarifa de muestra por persona).', 75000.00, null, true),
  ('destino', 'panaca', 'PANACA', 'Entrada a PANACA (tarifa de muestra por persona).', 80000.00, null, true),
  ('destino', 'ukumari', 'Ukumarí', 'Entrada al Parque Temático Ukumarí (tarifa de muestra por persona).', 85000.00, null, true),
  ('destino', 'parque-arrieros', 'Parque Los Arrieros', 'Entrada al Parque Los Arrieros (tarifa de muestra por persona).', 55000.00, null, true),
  ('destino', 'termales', 'Termales', 'Entrada a termales de la región (tarifa de muestra por persona).', 60000.00, null, true)
on conflict (slug) do nothing;

# Brief: Plataforma Digital Finca Hotel Loma Bonita

> Fecha: 2026-09-10

## TL;DR

Quiero convertir la landing estática de una sola página de Finca Hotel Loma Bonita (Piedras de Moler, Vía Alcalá, Cartago — Eje Cafetero) en una plataforma web multi-página construida en Next.js 16 + Supabase (Trust Stack Praxis, compatibilidad MATCH), con motor de reservas de alojamiento self-service, tickets de pasadías y experiencias, carta de restaurante con pedido en sitio y pantalla de cocina (KDS), un portafolio de experiencias corporativas con asistente de cotización y captación de leads, y **un panel de administración único y unificado** para operar todo. Se despliega a producción real en Vercel pero en una URL oculta (`noindex`, no enlazada) para presentársela al propietario; `www.lomabonitahotel.com` sigue mostrando el sitio actual hasta el corte. El diferenciador es la experiencia de **balsaje por el Río La Vieja con salida y regreso desde Loma Bonita** — la finca está justo en Piedras de Moler, el punto de desembarque tradicional del recorrido.

## Mi Vision

Hoy Loma Bonita tiene una sola página HTML estática (`index.html` + `styles.css` + `app.js`, servida en Vercel desde el repo `marketinglomabonita-jpg/lomabonita`). Funciona como folleto: toda la información amontonada en una URL y una "reserva" que solo arma un mensaje de WhatsApp. No persiste nada, no tiene panel, no tiene base de datos, y — por haberse construido fuera de este sistema — no trae las prácticas de seguridad que espero (validación de entradas, RLS, cabeceras, control de acceso). Quiero dar el salto a una plataforma de verdad.

La quiero organizada por servicio, con página propia para **alojamiento**, **restaurante**, **pasadías** y una categoría nueva de **experiencias corporativas**, más las experiencias sueltas que ya ofrezco o voy a ofrecer (**pista de karts**, **cabalgata**, **balsaje por el Río La Vieja**). En alojamiento quiero que el huésped gestione su reserva solo, como en Booking o Airbnb: calendario, check-in / check-out, número de personas, niños, y que el sistema valide disponibilidad; del otro lado, un panel donde yo vea y gestione las reservas, con **una notificación cada vez que entra una reserva**. En restaurante quiero dos caras: la carta pública, y una vista para el comensal que ya está en la mesa que le permita armar su pedido (plato del día o carta), con una **pantalla de cocina** donde el equipo ve los pedidos entrando en una sola fila. En pasadías, emisión de **tickets**, pensada para sumar bar y otros productos después. Y el **portafolio corporativo**: un asistente por pasos (elige experiencia → personaliza → indica participantes y fecha → revisa un valor estimado → deja sus datos) que funciona como **máquina de captación de leads** — "déjanos tu correo y te enviamos la cotización" — para cerrar luego por llamada.

Todo esto lo quiero **ya en producción, pero invisible para el público**: en una URL aparte (subdominio o `*.vercel.app` con nombre limpio), sin indexar y sin enlaces desde el sitio vivo, para poder mostrarle al propietario el prototipo funcionando — con navegación real, botones que sirven, rutas limpias (`/hospedaje`, `/restaurante`, `/pasadias`, `/experiencias-corporativas`), nada de URLs autogeneradas ni `.html`. Mientras tanto, los clientes actuales siguen viendo la página de siempre en `www.lomabonitahotel.com`. Después de reunirme con el propietario y definir precios, tarifas y datos reales, hacemos el corte al dominio principal. Por eso, por ahora, **todas las tarifas y buena parte del contenido van con datos de ejemplo** claramente marcados: ~11 habitaciones ficticias (parejas / familiares de 3-4 / grupales, aforo total ~35), carta con platos típicos del Eje Cafetero y un plato del día, y precios de prueba en pasadías, hospedaje, experiencias y cotizador corporativo.

Tengo permiso para rehacer el diseño actual: lo quiero moderno y bien cuidado, con una estética de **Eje Cafetero / campestre / turismo** (verdes, tierras, madera, guadua), y sobre todo **mobile-first**, porque la mayoría de mis visitantes llegan desde el celular. Y quiero que la plataforma esté hecha para **posicionar en buscadores**: SEO técnico en cada ruta, contenido pensado para las búsquedas de turismo de la región (pasadía en Cartago, finca hotel Eje Cafetero, hospedaje campestre, balsaje Río La Vieja, salón para eventos), y datos estructurados. El Google Business Profile está en trámite de aprobación y se integra más adelante; desde ya dejo los datos de negocio (NAP) consistentes.

## Contexto e Investigacion

**El prototipo actual.** Es un sitio estático servido desde el repo público `marketinglomabonita-jpg/lomabonita` (rama `main`, un commit "Add files via upload"). Contiene secciones ancla (Inicio, Experiencia, Servicios, Galería, Hospedaje, Ubicación, Contacto, FAQs), ~40 imágenes `.jpeg` sin optimizar (varias de 3-5 MB), y ya trae SEO básico decente: meta tags, Open Graph, JSON-LD `LodgingBusiness`, `sitemap.xml`, `robots.txt`. El dominio canónico que aparece en ese HTML es `fincalomabonitacartago.com`, que **no es nuestro** (posible administración anterior): hay que eliminar toda mención, sin redirects ni vínculos. Servicios que ya se comunican: piscina recreativa, restaurante campestre, cancha de fútbol, zona de billares/juegos, salón de eventos, hospedaje (4 tipos de habitación) y pasadías. Teléfonos 310 291 3182 y 324 497 1602. Redes: Instagram `@fincahotel.lomabonita`, Facebook, TikTok. Horarios comunicados: reservas L-D 7am-9pm; pasadía ingreso 9am; hospedaje check-in 3pm / check-out 1pm. El scaffold de Praxis en este repo está vacío (solo `_blueprint`, `auth`, `dashboard` con `.gitkeep`), así que esto es construcción de un producto nuevo que **hereda contenido e identidad** del prototipo.

**Balsaje por el Río La Vieja — el diferenciador.** Investigué la experiencia tal como la ofrecen hoy en el Quindío. Es un recorrido en balsa de **guadua**, de unas **3 horas y ~12 km**, con bogas experimentados que narran la historia de la región; pasa por la "Reserva del Ocaso" (bosque primario de 110 ha con especies en vía de extinción, incluido el mono aullador) y suele incluir un almuerzo campesino a mitad de camino. Mejor temporada: seca (diciembre-marzo y julio-agosto). El dato clave: el recorrido tradicional **sale de Puerto Alejandría / Puerto Samaria (Quimbaya) y termina justo en Piedras de Moler** — donde está Loma Bonita. Los competidores incluyen traslado desde hoteles de Montenegro o Quimbaya. Nuestra ventaja es de ubicación pura: Loma Bonita está en el punto de desembarque tradicional, "muy cerca al histórico puente de Piedras de Moler, el acceso principal al Río La Vieja". Eso permite ofrecer la experiencia con **salida y regreso desde Loma Bonita**, sin el transfer a Quimbaya. El copy y la ficha de esta experiencia deben apoyarse en esto.

**Motor de reservas.** Las plataformas de referencia (Cloudbeds, Lodgify) en 2026 abandonaron el iframe embebido por componentes nativos en el propio dominio — para que el tracking (GA4, píxeles) y la UX funcionen. Confirma la decisión de construir el flujo de reserva **nativo en React**, no incrustar un tercero. El riesgo central de cualquier motor de reservas es el **doble booking**: exige una única fuente de verdad de disponibilidad, con validación en el servidor y restricciones a nivel de base de datos (no solo chequeos de UI). Para v1 no hay channel manager ni OTAs ni pasarela de pago: la reserva entra como **solicitud** y yo la confirmo desde el panel (evita overbooking mientras no hay cobro). Los sitios de reserva directa suelen convertir por debajo del 2%, así que la UX móvil del flujo es crítica.

**Restaurante y cocina (KDS).** Un Kitchen Display System reemplaza las comandas de papel y — su mayor ventaja — **consolida en una sola fila** los pedidos de mesa, QR y app, para que la cocina trabaje una cola unificada. Square lo corre sobre tablets Android con un "Expeditor Mode". Para nuestro caso basta una **pantalla web** (cualquier tablet o monitor con navegador) que muestre en tiempo real los pedidos que arma el comensal desde la mesa, con estados (recibido → en preparación → listo). Sin integración de POS para el demo; con Supabase Realtime.

**Marco legal colombiano.** La **Ley 1581 de 2012** exige consentimiento "previo, expreso e informado" del titular y una **Política de Tratamiento de Datos** publicada (no inferior a los deberes de la ley). La **Resolución SIC 32.126 de 2022** clasifica las cookies en cuatro categorías y **ninguna está exenta de solicitud de consentimiento** — el banner tiene que ser un opt-in real que **bloquee las cookies no esenciales** hasta que el visitante acepte, no un simple aviso. También aplica registrar las bases de datos ante la SIC (RNBD) — tarea operativa del propietario, la dejo anotada. Páginas legales necesarias: Política de Privacidad, Política de Tratamiento de Datos Personales, Aviso Legal / Términos y Condiciones, Política de Cookies.

**SEO local de turismo.** Los actores de la región (turismoquindio.com, ejehoteles.com, hotelesenelejecafetero.com) rankean por combinaciones de: "pasadía" + lugar, "pasadía con almuerzo", "finca hotel eje cafetero", "alquiler finca Quindío", "hospedaje campestre", "salón para eventos", "hotel cerca Parque del Café / PANACA", "balsaje Río La Vieja". Loma Bonita está del lado Valle del Cauca (Cartago, Vía Alcalá), en el borde con Quindío, junto al Río La Vieja y a ~40-45 min de Parque del Café y PANACA. La arquitectura multi-página (una URL indexable por servicio, con su propio `<title>`, meta, H1 y datos estructurados) es justamente lo que la landing de una sola URL no puede ofrecer.

**Infra ya provista.** Repo GitHub con acceso de escritura configurado. Supabase: proyecto `xedfjhigbrttavtwvgxe` (región São Paulo), llaves en `.env.local`, access token para migraciones verificado. Vercel: team "Loma Bonita", proyecto actual `lomabonita` linkeado al repo con rama de producción `main` (merge a `main` = deploy a producción). El DNS de `lomabonitahotel.com` está en Namecheap (externo a Vercel): agregar un subdominio para el demo requiere un registro CNAME creado por el propietario, o usar un `*.vercel.app` con nombre limpio mientras tanto.

## Directiva de Stack Tecnico

> Directiva inicial. El PRP puede refinarla contra el estado real del codebase.

### Clasificacion
- **Tipo**: web-saas (plataforma de operación hotelera: sitio público + reservas/pedidos/tickets + panel autenticado)
- **Plataforma objetivo**: Web responsive, mobile-first (navegador; la pantalla de cocina corre en cualquier tablet/monitor con navegador)
- **Compatibilidad con Praxis**: MATCH

### KEEP
- Next.js 16 + React 19 + TypeScript (App Router, Server Actions)
- Tailwind CSS 3.4 + shadcn/ui
- Supabase (Auth + Postgres + Storage + Realtime + RLS)
- Zod (validación en todos los bordes: server actions, forms, API routes)
- Zustand (estado cliente: carrito de pedido, wizard corporativo, filtros)
- Turbopack (dev)
- Playwright (suite E2E en CI, fases finales)

### ADD
- `@tanstack/react-query` ^5 — cache de estado de servidor (disponibilidad, listados del panel)
- `react-hook-form` + `@hookform/resolvers` ^3 — formularios complejos (reserva, wizard corporativo, CRUD del panel)
- `date-fns` ^4 — rangos de fechas, noches, calendarios de disponibilidad
- `nuqs` ^2 — estado en la URL para el buscador de disponibilidad (compartible, indexable)
- `qrcode` ^1 — generación de códigos para tickets de pasadía y mesas del restaurante
- `@supabase/ssr` ^0.6 — ya está en `package.json`; se activa con los helpers de sesión server-side
- shadcn/ui — instalar los componentes base (el `components.json` existe, no hay componentes)
- Opcional (fases finales): `@vercel/analytics` / `posthog-js` — sólo tras consentimiento de cookies

### REPLACE
- Sitio estático (`index.html` + `styles.css` + `app.js`) → app Next.js. En la rama de trabajo se elimina el estático y las imágenes se mueven a `public/` optimizadas; `main` conserva el estático hasta el corte.

### REMOVE
- `stripe` / `@stripe/*` de la receta web-saas por defecto — **no hay pagos en v1**. El cobro en línea se añade después con `payments-polar`.

### CONFIG
- Tablas Supabase con RLS obligatoria desde el primer write: `profiles` + roles de staff; alojamiento (`room_types`, `rooms`, `availability`/bloqueos, `reservations`, `reservation_guests`); pasadías (`pass_products`, `experiences`, `tickets`); restaurante (`menu_categories`, `menu_items`, `daily_special`, `orders`, `order_items`); corporativo (`corp_experiences`, `corp_pricing`, `corp_leads`); `notifications`.
- `middleware.ts` — protección de rutas del panel + gate global de `noindex` en el demo
- `next.config.ts` — cabeceras de seguridad (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy), `images` remotePatterns para Supabase Storage
- `robots.ts` + `sitemap.ts` dinámicos, **controlados por variable de entorno** (`SITE_MODE=demo|production`): demo = `Disallow: /` global y sin sitemap; producción = público indexable salvo `/admin` y superficies de gestión
- Rate-limiting en endpoints de leads y reservas (Supabase / edge)
- Variables nuevas: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `SITE_MODE`, `NEXT_PUBLIC_SITE_URL`, `RESERVATION_NOTIFY_CHANNEL` (a definir)
- Proyecto Vercel nuevo para el demo (`lomabonita-demo`), rama de producción = rama de trabajo, framework Next.js; dominio `demo.lomabonitahotel.com` cuando exista el CNAME, `lomabonita-demo.vercel.app` mientras tanto

### Archivos Praxis a eliminar
- Ninguno (el scaffold apunta a este caso). Se llenan `src/features/*` y `src/core/*` que hoy son `.gitkeep`.

### Archivos nuevos a crear
- `src/app/(public)/` — home, `/hospedaje`, `/restaurante`, `/pasadias`, `/experiencias`, `/experiencias-corporativas`, `/contacto`, `/galeria`, páginas legales
- `src/app/(app)/admin/` — panel unificado con secciones
- `src/app/(reservar)/` y rutas del flujo de reserva / pedido / ticket / wizard
- `src/features/alojamiento/`, `src/features/restaurante/`, `src/features/pasadias/`, `src/features/experiencias/`, `src/features/corporativo/`, `src/features/admin/`, `src/features/legal/`
- `src/core/ui/` (primitivos + tokens de diseño Eje Cafetero), `src/core/adapters/supabase/*` (ya existen browser/server), `src/core/lib/seo/*`
- `supabase/migrations/*.sql`
- `middleware.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`
- `.github/workflows/*` (CI Playwright, fases finales)

### IDE / Toolchain externo requerido
- Supabase CLI (migraciones) — o Management API con el access token ya provisto
- Cuenta Vercel (token de team ya provisto) para el proyecto del demo
- Acceso DNS de Namecheap del propietario para el subdominio del demo (opcional; hay fallback `*.vercel.app`)

## Alcance por Fases

> Diario vivo del proyecto y fuente de las fases del PRP único. Cada fase entrega algo verificable en la URL oculta del demo.

### Fase 0: Fundación, seguridad y pipeline del demo
- **Estado**: COMPLETADO
- **Objetivo high-level**: dejar la app Next.js en pie sobre una rama del repo, con Supabase cableado, auth base, capa de seguridad, sistema de diseño Eje Cafetero, e imágenes migradas y optimizadas, desplegándose automáticamente a la URL oculta de Vercel con `noindex` global.
- **Criterios observables**: `npm run build` y `npx tsc --noEmit` pasan sin errores; la URL del demo (`lomabonita-demo.vercel.app` o `demo.lomabonitahotel.com`) carga la app Next y responde `X-Robots-Tag: noindex` y `Content-Security-Policy` en las cabeceras (`curl -I`); `GET /robots.txt` en el demo devuelve `Disallow: /`; un `curl` a una ruta del panel sin sesión redirige a login; `git log origin/main` sigue mostrando solo el commit del sitio estático (no se tocó `main`); las imágenes del prototipo están en `public/` como WebP < 300 KB c/u (control negativo: no queda ningún `.jpeg` de varios MB en el árbol de la rama).
- **Depende de**: —
- **Aprendizajes para fases siguientes**: —
- **Ajustes a la Directiva de Stack**: —
- **Iniciada**: 2026-09-10
- **Completada**: 2026-09-10

### Fase 1: Sitio público, Inicio rediseñada y páginas de servicio
- **Estado**: COMPLETADO
- **Objetivo high-level**: Home nueva mobile-first con estética Eje Cafetero + navegación y footer compartidos + páginas informativas `/hospedaje`, `/restaurante`, `/pasadias`, `/experiencias` (karts, cabalgata, balsaje), `/contacto`, `/galeria`, con el contenido migrado del prototipo y sin ninguna mención a `fincalomabonitacartago.com`.
- **Criterios observables**: cada ruta listada responde 200 y renderiza su `<h1>` propio; navegación y footer aparecen en todas; `grep -ri "fincalomabonitacartago" src/ public/` no devuelve nada (control negativo); en viewport 390px no hay scroll horizontal ni solapamientos en ninguna de las páginas (revisión con agent-browser, screenshot); los teléfonos, redes y horarios coinciden con los del prototipo; la ficha de balsaje menciona explícitamente "salida y regreso desde Loma Bonita".
- **Depende de**: Fase 0
- **Aprendizajes para fases siguientes**: —
- **Ajustes a la Directiva de Stack**: —
- **Iniciada**: 2026-09-10
- **Completada**: 2026-09-10

### Fase 2: SEO técnico y estructura de contenido
- **Estado**: COMPLETADO
- **Objetivo high-level**: metadata por ruta, `sitemap.ts` y `robots.ts` dinámicos controlados por `SITE_MODE`, datos estructurados JSON-LD por tipo (LodgingBusiness, Restaurant, TouristAttraction para balsaje), Open Graph, canónicos a `lomabonitahotel.com`, y una pasada de rendimiento/Core Web Vitals.
- **Criterios observables**: cada página pública emite `<title>`, `<meta name=description>`, `<link rel=canonical>` únicos apuntando al host de producción; el JSON-LD valida contra el validador de Schema.org sin errores; con `SITE_MODE=production` (local) `sitemap.xml` lista las rutas públicas y excluye `/admin`; con `SITE_MODE=demo` no hay sitemap y `robots` bloquea todo (control positivo y negativo del mismo interruptor); Lighthouse mobile ≥ 90 en Performance y SEO en la Home y en `/hospedaje`.
- **Depende de**: Fase 1
- **Aprendizajes para fases siguientes**: Lighthouse local: SEO 100 (supera el ≥95). Performance 80 (LCP 3.7s, dominado por el server-response-time de `next start` local ~660ms; en el edge de Vercel baja mucho). `next/image` con priority + sizes correctos ya aplicados. **Pendiente para la Fase 8 (QA): re-medir Core Web Vitals sobre el deploy en vivo y cerrar Performance ≥ 90.**
- **Ajustes a la Directiva de Stack**: —
- **Iniciada**: 2026-09-10
- **Completada**: 2026-09-10

### Fase 3: Reservas de alojamiento (self-service)
- **Estado**: COMPLETADO
- **Objetivo high-level**: esquema de datos de alojamiento con RLS + 11 habitaciones ficticias sembradas (parejas / familiares / grupales, aforo ~35), buscador público por fechas + adultos + niños, detalle de habitación, y flujo de solicitud de reserva sin pago con estados (solicitada → confirmada / rechazada).
- **Criterios observables**: todas las tablas nuevas tienen `rowsecurity = true` (consulta a `pg_tables`); un usuario anónimo puede leer disponibilidad pero no `reservations` ajenas (test de policy); buscar un rango donde una habitación ya está bloqueada la excluye del resultado; enviar el formulario con fechas invertidas o cupo excedido es rechazado por Zod en el servidor (control negativo) y devuelve error legible; una solicitud válida crea una fila `reservations` en estado `solicitada` visible luego en el panel; el flujo completo se puede hacer en móvil (390px) sin fricción (agent-browser).
- **Depende de**: Fase 0
- **Aprendizajes para fases siguientes**: (a) nuqs necesita `<NuqsAdapter>` en un layout — `next build` NO lo detecta (error solo en runtime). (b) nuqs omite de la URL los valores que igualan su `withDefault`, así que un `hasSearch` server-side que exija ese param se rompe con los defaults — exigir solo lo mínimo. (c) El ejecutor puede dejar policies RLS permisivas tras experimentos y cerrar con "tests pendientes": el director SIEMPRE corre los tests de policy + concurrencia + E2E él mismo, nunca los da por hechos.
- **Ajustes a la Directiva de Stack**: —
- **Iniciada**: 2026-09-10
- **Completada**: 2026-09-10

### Fase 4: Panel de administración unificado + notificación de reservas
- **Estado**: COMPLETADO
- **Objetivo high-level**: un solo `/admin` con login y roles, vista general con notificaciones, y la sección de Hospedaje operativa (lista de reservas, cambio de estado, gestión de habitaciones y bloqueos de disponibilidad), generando una notificación por cada reserva entrante.
- **Criterios observables**: `/admin` sin sesión redirige a login; con sesión de staff carga el shell con el menú de secciones (Hospedaje, Restaurante, Pasadías, Experiencias, Leads — las no construidas aún visibles como "próximamente"); crear una reserva desde el flujo público de la Fase 3 hace aparecer, sin recargar o con recarga simple, una notificación nueva en el panel y la reserva en la lista; confirmar/rechazar desde el panel cambia el estado y ese cambio se refleja en la disponibilidad pública (control positivo); un rol no-staff no puede entrar a `/admin` (control negativo).
- **Depende de**: Fase 3
- **Aprendizajes para fases siguientes**: El ejecutor corrió los checks de BD (RLS/policies/trigger) pero no los flujos E2E ("requieren servidor corriendo") — el director los completó simulando a nivel de BD las mismas operaciones que hacen las Server Actions (confirmar/rechazar/bloquear) y probando /admin sin sesión. Login OTP real no se probó en navegador por falta de acceso al correo del staff (mauroz05@gmail.com) — queda para que el propietario lo confirme en la presentación.
- **Ajustes a la Directiva de Stack**: —
- **Iniciada**: 2026-09-10
- **Completada**: 2026-09-10

### Fase 5: Pasadías, experiencias y tickets
- **Estado**: COMPLETADO
- **Objetivo high-level**: productos de pasadía + experiencias agregables (karts, cabalgata, balsaje) con tarifas de prueba, flujo de reserva/emisión de tickets sin pago con código/QR, y la sección de Pasadías en el panel (cupos por fecha, tickets emitidos, check-in).
- **Criterios observables**: elegir pasadía + fecha + Nº personas + experiencias agregadas calcula un total de prueba correcto (suma verificable); completar la solicitud genera un ticket con código único y QR escaneable que resuelve a la página del ticket; superar el cupo configurado de una fecha bloquea la emisión (control negativo); el ticket emitido aparece en el panel y se puede marcar "usado"; el QR se ve y funciona en móvil.
- **Depende de**: Fase 4
- **Aprendizajes para fases siguientes**: —
- **Ajustes a la Directiva de Stack**: —
- **Iniciada**: 2026-09-10
- **Completada**: 2026-09-11

### Fase 6: Portafolio de experiencias corporativas + captación de leads
- **Estado**: COMPLETADO
- **Objetivo high-level**: página `/experiencias-corporativas` con el copy provisto + asistente de 5 pasos (elige → personaliza → participantes y fecha → valor estimado → deja tus datos) con configuración de tarifas de prueba en un solo lugar, y captura de lead (Nombre, Empresa, Correo, WhatsApp, Fecha tentativa, Nº personas) que llega al panel con notificación.
- **Criterios observables**: el asistente recorre los 5 pasos y en el paso 4 muestra un "valor estimado" que corresponde a la suma de las opciones marcadas × participantes según la tabla de tarifas de prueba; el texto de la página coincide con el copy del PDF "Experiencias Corporativas Loma Bonita" (secciones Pasadía corporativo, Integración & Team Building, Eventos corporativos, Experiencia corporativa, complementos, destinos, "¿Cómo funciona?"); enviar el formulario con correo inválido lo rechaza (control negativo); un envío válido crea una fila `corp_leads`, dispara notificación y aparece en la sección "Leads corporativos" del panel; hay rate-limiting: N envíos seguidos desde el mismo origen se frenan.
- **Depende de**: Fase 4
- **Aprendizajes para fases siguientes**: GLM (migraciones 0011/0012, RLS + rate-limit con advisory lock de calidad Fase 5) se quedó sin cupo a mitad de fase; Sonnet 4.5 retomó y terminó la UI, pero encadenó `.select('id').single()` tras un insert anónimo — el mismo gotcha que la Fase 5 ya había documentado (la policy de anon da INSERT sin SELECT; pedir representación rompe el insert con 401/42501 aunque la fila se guarde). Lo mal-diagnosticó como policy RLS restrictiva y escribió una migración (0013) que nunca se aplicó y que el director descartó por innecesaria; además "verificó" con un insert vía service-role (bypass RLS) en vez del flujo real. El director reprodujo el bug con curl, lo corrigió en el código (quitar el `.select()`) y volvió a probar los 5 pasos con la anon key real. **Regla reforzada para todas las fases siguientes: documentar un gotcha en el PRP no basta — hay que recordárselo explícitamente a cada ejecutor nuevo, y nunca aceptar un insert vía service-role como prueba del flujo anónimo real.**
- **Ajustes a la Directiva de Stack**: —
- **Iniciada**: 2026-09-10
- **Completada**: 2026-09-11

### Fase 7: Restaurante — carta, pedido en sitio y pantalla de cocina (KDS)
- **Estado**: EN PROGRESO
- **Objetivo high-level**: esquema de carta + siembra con platos típicos del Eje Cafetero y un plato del día, página pública de carta, flujo de pedido para el comensal en mesa (identificado por mesa/QR), pantalla de cocina en tiempo real con estados, y sección de Restaurante en el panel (CRUD de carta, plato del día, historial de pedidos).
- **Criterios observables**: la carta pública lista los platos sembrados por categoría y destaca el plato del día; desde una mesa el comensal arma un pedido y al enviarlo aparece en < 3 s en la pantalla de cocina (Supabase Realtime, control positivo); avanzar el estado en cocina (recibido → en preparación → listo) se refleja en la vista del comensal; un pedido vacío no se puede enviar (control negativo); editar la carta o cambiar el plato del día desde el panel se ve reflejado en la carta pública; todo el flujo del comensal es usable en móvil.
- **Depende de**: Fase 4
- **Aprendizajes para fases siguientes**: —
- **Ajustes a la Directiva de Stack**: —
- **Iniciada**: 2026-09-10
- **Completada**: —

### Fase 8: Páginas legales, consentimiento de cookies y cierre del demo
- **Estado**: EN PROGRESO
- **Objetivo high-level**: páginas legales (Privacidad, Tratamiento de Datos — Ley 1581, Aviso Legal / T&C, Cookies) enlazadas desde el footer, banner de consentimiento real que bloquea cookies no esenciales y recuerda la elección, QA final de flujos felices y de error con agent-browser, deploy del demo estable y entrega del guion de presentación para el propietario + runbook del corte a producción.
- **Criterios observables**: las 4 páginas legales responden 200 y están enlazadas en el footer; en primera visita aparece el banner y, hasta aceptar, no se cargan scripts de analítica (control negativo: `network` sin peticiones a dominios de analítica antes del opt-in); tras aceptar, la preferencia persiste y el banner no reaparece al recargar ni en una segunda visita (control positivo); recorrido completo por agent-browser de los flujos clave (reserva, ticket, pedido, lead) con flujo feliz y flujo de error capturados en screenshot; el `runbook.md` describe el corte (merge a `main`, `SITE_MODE=production`, DNS) en pasos accionables.
- **Depende de**: Fase 1, Fase 3, Fase 5, Fase 6, Fase 7
- **Aprendizajes para fases siguientes**: —
- **Ajustes a la Directiva de Stack**: —
- **Iniciada**: 2026-09-10
- **Completada**: —

## Supuestos (deben ser verdad)

- [ ] El repo `marketinglomabonita-jpg/lomabonita` acepta push con el token provisto y `main` se puede dejar intacto trabajando en una rama (verificado: push de prueba OK).
- [ ] El proyecto Supabase `xedfjhigbrttavtwvgxe` está disponible para crear tablas y correr migraciones con el access token provisto (verificado: Management API responde 200).
- [ ] El token de Vercel del team "Loma Bonita" permite crear un proyecto nuevo y asignarle dominios (por confirmar en Fase 0).
- [ ] Está bien que el demo viva en `lomabonita-demo.vercel.app` hasta que el propietario cree el CNAME `demo.lomabonitahotel.com` en Namecheap.
- [ ] Los datos ficticios (habitaciones, carta, tarifas) son aceptables para la presentación y se reemplazarán por reales después de la reunión con el propietario.
- [ ] No hay cobro en línea en esta entrega: reservas, tickets y cotizaciones quedan como solicitud/estimado; el pago se gestiona por fuera.
- [ ] El contenido del PDF "Experiencias Corporativas Loma Bonita" es el copy definitivo para esa página (salvo tarifas).
- [ ] `fincalomabonitacartago.com` no debe aparecer en ninguna parte del producto nuevo.

## Fuera de Alcance (NO construir en este brief)

- Pasarela de pagos / cobro en línea (Polar, tarjetas, PSE) — entrega posterior con `payments-polar`.
- Channel manager / sincronización con OTAs (Booking.com, Airbnb, Expedia).
- Integración con Google Business Profile y publicación en directorios (pendiente de aprobación; solo se deja el NAP y el schema consistentes).
- App móvil nativa / PWA instalable / notificaciones push (posible fase futura con `pwa-mobile`).
- Emails transaccionales automáticos (confirmaciones por correo) — se puede sumar luego con `emails-transactional`; en v1 la notificación vive en el panel.
- Facturación electrónica DIAN, POS de restaurante, control de inventario / almacén.
- Migración de datos reales de habitaciones, carta y tarifas (llega después de la reunión con el propietario).
- El corte de dominio a producción (merge a `main` + DNS): se deja el runbook listo, pero se ejecuta cuando el propietario apruebe.
- Multi-idioma (i18n). El sitio va en español.
- Registro de bases de datos ante la SIC (RNBD): trámite del propietario, fuera del software.

## Evaluacion

| Dimension | Nivel | Nota |
|-----------|-------|------|
| Complejidad tecnica | Alta | 5 subsistemas transaccionales (reservas, tickets, pedidos+KDS realtime, cotizador, panel) sobre un sitio público con SEO; el riesgo fino está en disponibilidad sin doble-booking y en RLS por rol. |
| Riesgo / dependencias externas | Medio | Infra ya provista y verificada (repo, Supabase, Vercel). Dependencia blanda: CNAME del propietario para el subdominio (hay fallback). Datos reales llegan después, por diseño. |
| Esfuerzo estimado | 9 fases (0-8) | Fase 0 y 4 son habilitadoras; 3/5/6/7 son los subsistemas; 1/2 el sitio+SEO; 8 el cierre. |
| Costos externos recurrentes | ~US$0-20/mes | Supabase free o Pro (US$25) según uso; Vercel Hobby/Pro; dominio ya pago. Sin costos de pasarela en v1. |

## Fuentes Consultadas

- https://www.lapatria.com/eje-cafetero/sobre-guadua-y-rio-el-balsaje-que-mantiene-viva-una-tradicion-en-el-eje-cafetero — balsaje como tradición viva en guadua; familias del río; contexto cultural para el copy.
- https://turismoquindio.com/atractivos/balsaje-rio-la-vieja/ — recorrido, duración (~3 h), bogas narradores, Reserva del Ocaso (110 ha, mono aullador).
- https://fincaspanacah10.com/balsaje-por-el-rio-la-vieja-aventura-entre-paisajes-cafeteros/ — ruta Puerto Alejandría → Piedras de Moler, ~12 km, traslado desde hoteles de Quimbaya/Montenegro, almuerzo campesino, temporada seca dic-mar y jul-ago.
- https://www.cloudbeds.com/articles/hotel-booking-engine-guide/ — motores de reserva 2026: componente nativo en el propio dominio (no iframe), prevención de doble-booking como requisito central.
- https://hello.pricelabs.co/blog/hotel-direct-booking-websites/ — buenas prácticas de reserva directa: mobile-first, conversión típica < 2%, claridad del flujo.
- https://www.guideflow.com/blog/kitchen-display-system — KDS: reemplaza comandas de papel, cola unificada de pedidos de mesa/QR/app, estados.
- https://www.orderout.co/blog/square-kitchen-display-system/ — Square KDS sobre tablets Android, Expeditor Mode; referencia de UX de cocina.
- https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981 — Ley 1581 de 2012: consentimiento previo, expreso e informado; política de tratamiento obligatoria.
- https://www.ochgroup.co/en/cookies-y-datos-personales-en-colombia/ — Resolución SIC 32.126 de 2022: 4 categorías de cookies, ninguna exenta de consentimiento → banner con opt-in real.
- https://turismoquindio.com/ y https://www.ejehoteles.com/planes/pasadias/ — patrones de keywords del turismo regional (pasadía + lugar, pasadía con almuerzo, finca hotel eje cafetero, salón para eventos).

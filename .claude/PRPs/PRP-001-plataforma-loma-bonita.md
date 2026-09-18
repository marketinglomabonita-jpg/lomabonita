# PRP-001: Plataforma Digital Finca Hotel Loma Bonita

> **Estado**: APROBADO
> **Fecha**: 2026-09-10
> **Proyecto**: Loma Bonita
> **Aprobado**: 2026-09-10 — el dueño del producto dio el "arranca" tras revisar brief y confirmar alcance, infra, modelo de entrega y orquestación (director + ejecutor GLM, escala Pareja).

---

## Origen

> Derivado de `@docs/BRIEF-plataforma-loma-bonita.md`. Cubre TODAS las fases de su `## Alcance por Fases` (Fase 0 a Fase 8).
> Hereda Directiva de Stack (MATCH), Supuestos, Fuera de Alcance y aprendizajes heredados.

Modo directo (el dueño del producto trajo la idea y el copy corporativo; no hay Director). Alcance entendido y confirmado en el brief: pasar la landing estática a una plataforma multi-servicio (sitio público + reservas de alojamiento + tickets de pasadías/experiencias + carta y pedido de restaurante + KDS + portafolio corporativo con cotizador y captación de leads + panel de administración unificado), desplegada a producción en una URL oculta (`noindex`, no enlazada) para presentarla al propietario, con `www.lomabonitahotel.com` sirviendo el sitio actual hasta el corte. Sin pagos en línea en esta entrega. Resultado observable que se persigue: la URL oculta del demo carga la plataforma completa, navegable de punta a punta con datos de ejemplo, y `main` del repo queda sin tocar.

---

## Objetivo

Quiero que Loma Bonita deje de ser un folleto de una sola página y pase a ser una plataforma donde el visitante gestione solo su reserva de alojamiento, saque su ticket de pasadía o experiencia, arme su pedido en el restaurante, y donde una empresa construya su experiencia corporativa y reciba una cotización estimada dejando sus datos. Quiero operar todo eso desde un panel de administración único, enterarme al instante de cada reserva, y que el sitio esté hecho para posicionar en buscadores de turismo del Eje Cafetero. Y lo quiero ya en producción, pero en una dirección oculta que solo yo comparta, para mostrárselo al propietario antes de reemplazar la página actual.

## Por Que

| Problema | Solucion |
|----------|----------|
| Toda la información amontonada en una URL; nada indexable por servicio | Sitio multi-página: una URL por servicio con su propio `<title>`, meta, H1 y datos estructurados |
| La "reserva" solo arma un WhatsApp; no persiste ni valida nada | Motor de reservas self-service con disponibilidad real y solicitudes que quedan registradas |
| No hay forma de que el comensal pida ni de que cocina vea los pedidos ordenados | Carta + pedido en mesa + pantalla de cocina en tiempo real |
| Las empresas piden cotización por teléfono y se pierden leads | Asistente de cotización que calcula un estimado y captura el lead al panel |
| El prototipo se hizo sin prácticas de seguridad | RLS en toda tabla, validación Zod en todo borde, cabeceras + CSP, control de acceso al panel |
| No hay operación digital: reservas, pedidos y leads viven en cabezas y chats | Panel unificado con notificaciones |

**Valor**: Necesito que un visitante pueda reservar o cotizar sin que nadie lo atienda por WhatsApp, y que cada reserva me llegue como notificación al panel. Necesito además que Google entienda qué ofrece Loma Bonita y dónde queda, para captar el tráfico de "pasadía en Cartago", "finca hotel eje cafetero", "balsaje río la vieja" y similares.

## Que

> Voz: impersonal. Contrato tecnico.

### Criterios de exito

- [ ] La URL oculta del demo (`lomabonita-demo.vercel.app` y/o `demo.lomabonitahotel.com`) sirve la plataforma Next.js completa; `curl -I` de cualquier ruta devuelve `X-Robots-Tag: noindex` y `Content-Security-Policy`; `GET /robots.txt` devuelve `Disallow: /`.
- [ ] `git log origin/main` sigue mostrando únicamente el commit `4bb306e` del sitio estático — `main` no se tocó en toda la ejecución.
- [ ] Recorrido end-to-end en móvil (viewport 390px, agent-browser) sin scroll horizontal ni solapamientos: Home → cada página de servicio → reservar alojamiento → sacar ticket de pasadía → armar pedido en mesa → completar el asistente corporativo y dejar el lead.
- [ ] Cada acción transaccional (reserva, ticket, pedido, lead) crea su fila en Supabase y aparece en la sección correspondiente del panel `/admin`; una reserva nueva genera una notificación visible en el panel.
- [ ] `SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind='r'` muestra `relrowsecurity = true` en todas las tablas nuevas (control negativo: cero tablas nuevas sin RLS).
- [ ] `grep -rniE "fincalomabonitacartago|stripe|STRIPE_" src/ public/ supabase/` no devuelve nada (dominio ajeno erradicado; sin pagos en v1).
- [ ] `npm run build` y `npx tsc --noEmit` terminan sin errores; `npm run lint` limpio.
- [ ] Existe `docs/runbook-corte-produccion.md` con los pasos accionables del corte (merge a `main`, `SITE_MODE=production`, DNS, dominio en Vercel).
- [ ] Las 4 páginas legales responden 200 y están enlazadas en el footer; antes de aceptar el banner de cookies no se emite ninguna petición a dominios de analítica (control negativo en el panel de red).

### Comportamiento esperado

**Visitante público.** Entra a la Home (rediseñada, estética Eje Cafetero, mobile-first), navega a `/hospedaje`, `/restaurante`, `/pasadias`, `/experiencias`, `/experiencias-corporativas`, `/galeria`, `/contacto`. En `/hospedaje` elige fechas de entrada y salida, número de adultos y niños; el sistema muestra las habitaciones disponibles para ese rango; elige una, revisa el detalle y envía una **solicitud de reserva** (sin pago) con sus datos; recibe una confirmación en pantalla con un código de seguimiento. En `/pasadias` elige un plan + fecha + número de personas, agrega experiencias (karts, cabalgata, balsaje), ve un total de prueba y saca un **ticket** con código y QR. En `/experiencias-corporativas` recorre el asistente de 5 pasos (elige tipo de experiencia → personaliza inclusiones → indica participantes y fecha → revisa el **valor estimado** → deja Nombre, Empresa, Correo, WhatsApp, Fecha tentativa, Nº personas) y queda como **lead**.

**Comensal en el restaurante.** Abre la vista de pedido asociada a una mesa (parámetro/QR), ve la carta y el plato del día, arma su pedido y lo envía; puede seguir el estado (recibido → en preparación → listo).

**Cocina.** Una pantalla web muestra los pedidos entrantes en una sola fila, en tiempo real, con su estado; el personal avanza el estado y eso se refleja en la vista del comensal.

**Staff / administrador.** Entra a `/admin` con su cuenta (OTP). Ve una vista general con notificaciones y secciones: Hospedaje (reservas, cambio de estado, habitaciones y bloqueos de disponibilidad), Restaurante (CRUD de carta, plato del día, historial de pedidos), Pasadías (cupos por fecha, tickets, check-in), Experiencias (cupos), Leads corporativos (cotizaciones recibidas). Al confirmar o rechazar una reserva, la disponibilidad pública se actualiza.

### Casos borde

- Rango de fechas invertido o igual, o número de personas por encima del aforo → rechazo con Zod en el servidor y mensaje legible; nunca crea la fila.
- Dos solicitudes simultáneas sobre la misma habitación y fechas solapadas → la restricción de exclusión en base de datos impide el doble registro; la segunda recibe error de disponibilidad.
- Fecha de pasadía con cupo agotado → no se emite ticket.
- Formulario corporativo con correo inválido o campos vacíos → rechazo; N envíos seguidos desde el mismo origen → rate-limit.
- Pedido de restaurante vacío → no se puede enviar.
- Acceso a `/admin` o a rutas de sección sin sesión → redirige a login; con sesión sin rol de staff → 403.
- `SUPABASE_SERVICE_ROLE_KEY` referenciada desde un módulo cliente → el build debe fallar o el guardrail de import debe impedirlo (la clave nunca llega al bundle del navegador).
- Demo: cualquier bot que pida `/sitemap.xml` → 404/vacío; `robots.txt` → `Disallow: /`.
- Imágenes faltantes del prototipo (ej. `lomita 3.jpeg` referenciada y ausente) → se resuelve o se sustituye; no quedan `src` rotos.

---

## Contexto

> Voz: impersonal.

### Documentacion externa

- https://www.cloudbeds.com/articles/hotel-booking-engine-guide/ — motor de reservas nativo en el propio dominio (no iframe); prevención de doble-booking como requisito central.
- https://hello.pricelabs.co/blog/hotel-direct-booking-websites/ — reserva directa mobile-first; conversión típica < 2%; claridad del flujo.
- https://www.postgresql.org/docs/current/rangetypes.html y `btree_gist` — restricción de exclusión sobre `tstzrange` para impedir solapamientos de reserva a nivel de tabla.
- https://supabase.com/docs/guides/auth/row-level-security — policies por `auth.uid()` y por rol; base del control de acceso del panel.
- https://supabase.com/docs/guides/realtime — canal de cambios para la pantalla de cocina y las notificaciones del panel.
- https://www.guideflow.com/blog/kitchen-display-system y https://www.orderout.co/blog/square-kitchen-display-system/ — patrón KDS: cola unificada, estados, pensado para pantalla táctil.
- https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981 — Ley 1581 de 2012: consentimiento previo, expreso e informado; política de tratamiento obligatoria.
- https://www.ochgroup.co/en/cookies-y-datos-personales-en-colombia/ — Resolución SIC 32.126 de 2022: 4 categorías de cookies, ninguna exenta de consentimiento → banner con opt-in real que bloquea lo no esencial.
- https://turismoquindio.com/atractivos/balsaje-rio-la-vieja/ y https://fincaspanacah10.com/balsaje-por-el-rio-la-vieja-aventura-entre-paisajes-cafeteros/ — datos del balsaje (guadua, ~3 h, ~12 km, Reserva del Ocaso, ruta Quimbaya → Piedras de Moler) para el copy de la experiencia.
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata y `.../functions/generate-sitemap` — metadata por ruta, `sitemap.ts` y `robots.ts` dinámicos.

### Codigo existente a consultar

- `src/core/adapters/supabase/browser.ts` y `server.ts` — clientes ya configurados con `@supabase/ssr` y `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. El cliente admin (service role) hay que crearlo como módulo server-only.
- `src/app/layout.tsx`, `src/app/(public)/layout.tsx`, `src/app/(app)/layout.tsx` — layouts base del scaffold; `(app)/layout.tsx` tiene un TODO para la nav del área autenticada.
- `src/app/(public)/login/`, `signup/`, `src/app/(app)/dashboard/` — carpetas del scaffold con solo `.gitkeep`; se reemplazan por el flujo real.
- `tailwind.config.ts` + `src/app/globals.css` — mínimos; se extienden con los tokens de la paleta Eje Cafetero.
- `components.json` — shadcn "new-york", RSC, `baseColor: neutral`, aliases a `@/core/ui` y `@/core/lib/utils`, iconos lucide. No hay componentes instalados.
- `.claude/skills/auth-stack/SKILL.md` — patrón OTP de 6 dígitos + `profiles` + RLS + middleware; base para el auth del staff.
- `.claude/skills/supabase-admin/SKILL.md` — creación de tablas + RLS + migraciones.
- Prototipo estático en la carpeta hermana `../lomabonita-main/` (`index.html`, `styles.css`, `app.js`, imágenes) — fuente del contenido, textos, secciones y activos a migrar.
- `docs/Experiencias Corporativas Loma Bonita.pdf` (copy provisto por el dueño) — texto definitivo de `/experiencias-corporativas`.

### Gotchas conocidas

- **RLS antes del primer write** (Supabase): habilitar `ENABLE ROW LEVEL SECURITY` en cada tabla al crearla; sin policy, `anon` no puede nada — hay que escribir policies explícitas para el `INSERT` anónimo de reservas/tickets/pedidos/leads y para el acceso completo del staff.
- **Doble-booking**: no basta chequear en la UI ni en el server action; requiere `EXCLUDE USING gist (room_id WITH =, during WITH &&)` con `btree_gist` sobre un `tstzrange`/`daterange` — extensión que hay que habilitar en la migración.
- **`SITE_MODE`**: `robots.ts` y `sitemap.ts` deben leer la variable en tiempo de request/build; el `X-Robots-Tag` global va en `middleware.ts` o en `headers()` de `next.config.ts`, no solo en `<meta>` (los bots que no ejecutan JS deben verlo en la cabecera).
- **service_role**: solo en módulos server-only (`import 'server-only'`); jamás en componentes cliente ni en variables `NEXT_PUBLIC_*`. La clave nueva de Supabase es `sb_secret_…` (no el JWT legacy).
- **Vercel y `main`**: el proyecto `lomabonita` existente tiene rama de producción `main`; el proyecto nuevo del demo debe fijar su rama de producción a `plataforma-v2` para no interferir. El DNS de `lomabonitahotel.com` es externo (Namecheap) → el subdominio necesita CNAME creado por el propietario; hasta entonces, `*.vercel.app`.
- **Next 16 + React 19**: Server Actions para las mutaciones; `useActionState` para el estado de formularios; imágenes vía `next/image` con `remotePatterns` para Supabase Storage.
- **Turbopack dev**: el proyecto usa `next dev --turbopack`; validar también `next build` (webpack) antes de cada PR.
- **`.gitignore`**: `*.mcp.json` está ignorado; `supabase/migrations/` NO está ignorado (se commitea). El tooling Praxis (`.claude/skills/**`, `.agents/**`, `.graphify/**`) hoy se commitearía — se decide gitignorearlo en la rama para mantener el repo del cliente enfocado en el producto.
- **Realtime**: las tablas que alimentan KDS y notificaciones deben añadirse a la publicación `supabase_realtime`.
- **Imágenes del prototipo**: varias pesan 3-5 MB; convertir a WebP y redimensionar antes de subir a `public/` o a Storage.

### Modelo de datos (alto nivel — la DDL fina la genera el bucle-agentico por fase)

```sql
-- Extensiones
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Identidad / staff (Fase 0 / 4)
CREATE TYPE staff_role AS ENUM ('owner','admin','recepcion','cocina','anfitrion');
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role staff_role NOT NULL DEFAULT 'recepcion',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Alojamiento (Fase 3 / 4)
CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, nombre TEXT NOT NULL, descripcion TEXT,
  capacidad_max INT NOT NULL, cama TEXT, precio_noche_muestra NUMERIC(12,2) NOT NULL,
  is_sample BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES room_types(id),
  nombre TEXT NOT NULL, activa BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,                 -- token opaco de seguimiento
  room_id UUID REFERENCES rooms(id),
  during DATERANGE NOT NULL,
  adultos INT NOT NULL CHECK (adultos > 0), ninos INT NOT NULL DEFAULT 0,
  nombre TEXT NOT NULL, email TEXT, telefono TEXT, notas TEXT,
  estado TEXT NOT NULL DEFAULT 'solicitada',   -- solicitada|confirmada|rechazada|cancelada
  created_at TIMESTAMPTZ DEFAULT NOW(),
  EXCLUDE USING gist (room_id WITH =, during WITH &&) WHERE (estado IN ('solicitada','confirmada'))
);
-- room_blocks (bloqueos manuales de disponibilidad), reservation_guests

-- Pasadías y experiencias (Fase 5)
-- pass_products, experiences (karts|cabalgata|balsaje|…), tickets (codigo, qr, fecha, personas, addons jsonb, estado, is_sample)
-- pass_capacity (cupo por fecha)

-- Restaurante (Fase 7)
-- menu_categories, menu_items (categoria, nombre, descripcion, precio_muestra, disponible, is_sample)
-- daily_special (fecha, menu_item_id | texto)
-- restaurant_tables (numero, token)
-- orders (mesa, estado: recibido|en_preparacion|listo|entregado, created_at), order_items (order_id, menu_item_id, cantidad, notas)

-- Corporativo (Fase 6)
-- corp_experiences (tipo), corp_pricing (concepto, unidad, precio_muestra)  -- todo is_sample
-- corp_leads (nombre, empresa, email, whatsapp, fecha_tentativa, num_personas, seleccion jsonb, estimado NUMERIC, created_at, estado)

-- Transversal (Fase 4)
-- notifications (tipo, ref_table, ref_id, titulo, cuerpo, leida BOOLEAN, created_at)

-- RLS: en TODAS. anon => INSERT acotado en reservations/tickets/orders/order_items/corp_leads
--      + SELECT propio por 'codigo'. staff (auth + profiles.role) => acceso por seccion.
-- Realtime: publicar orders, order_items, notifications.
```

---

## Directiva de Stack heredada

> Copia íntegra del brief `@docs/BRIEF-plataforma-loma-bonita.md`.

### Clasificacion
- **Tipo**: web-saas (plataforma de operación hotelera: sitio público + reservas/pedidos/tickets + panel autenticado)
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
- `date-fns` ^4 — rangos de fechas, noches, calendarios
- `nuqs` ^2 — estado en la URL para el buscador de disponibilidad (compartible, indexable)
- `qrcode` ^1 — códigos para tickets de pasadía y mesas del restaurante
- `@supabase/ssr` ^0.6 — ya está en `package.json`; se activan los helpers de sesión server-side
- shadcn/ui — instalar los componentes base (el `components.json` existe, no hay componentes)
- Opcional (fases finales): `@vercel/analytics` / `posthog-js` — sólo tras consentimiento de cookies

### REPLACE
- Sitio estático (`index.html` + `styles.css` + `app.js`) → app Next.js. En la rama de trabajo se elimina el estático y las imágenes se mueven a `public/` optimizadas; `main` conserva el estático hasta el corte.

### REMOVE
- `stripe` / `@stripe/*` de la receta web-saas por defecto — **no hay pagos en v1**. El cobro en línea se añade después con `payments-polar`.

### CONFIG
- Tablas Supabase con RLS obligatoria desde el primer write (ver Modelo de datos).
- `middleware.ts` — protección de rutas del panel + gate global de `noindex` en el demo.
- `next.config.ts` — cabeceras de seguridad (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy), `images.remotePatterns` para Supabase Storage.
- `robots.ts` + `sitemap.ts` dinámicos, controlados por `SITE_MODE` (`demo` | `production`).
- Rate-limiting en endpoints de leads y reservas.
- Variables nuevas: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `SITE_MODE`, `NEXT_PUBLIC_SITE_URL`, `RESERVATION_NOTIFY_CHANNEL` (a definir).
- Proyecto Vercel nuevo para el demo (`lomabonita-demo`), rama de producción = `plataforma-v2`, framework Next.js; dominio `demo.lomabonitahotel.com` cuando exista el CNAME, `lomabonita-demo.vercel.app` mientras tanto.

### Refinamientos a la Directiva durante este PRP
- Añadir `btree_gist` como extensión de Postgres (restricción de exclusión anti-doble-booking) — no estaba explícito en el brief.
- Añadir `server-only` (paquete) para blindar los módulos que usan `service_role`.
- Gitignore en la rama `plataforma-v2` para `.claude/skills/**`, `.agents/**`, `.graphify/**` (mantener `CLAUDE.md`, `AGENTS.md`, `docs/`, `.claude/PRPs/`).
- Rate-limiting: implementar como token-bucket en Postgres/Edge (sin dependencia externa de pago) salvo que se decida Upstash free.

---

## Supuestos heredados

> Copia exacta del brief. El `bucle-agentico` los verifica antes de arrancar.

- [ ] El repo `marketinglomabonita-jpg/lomabonita` acepta push con el token provisto y `main` se puede dejar intacto trabajando en una rama (verificado: push de prueba OK).
- [ ] El proyecto Supabase `xedfjhigbrttavtwvgxe` está disponible para crear tablas y correr migraciones con el access token provisto (verificado: Management API responde 200).
- [ ] El token de Vercel del team "Loma Bonita" permite crear un proyecto nuevo y asignarle dominios (por confirmar en Fase 0).
- [ ] Está bien que el demo viva en `lomabonita-demo.vercel.app` hasta que el propietario cree el CNAME `demo.lomabonitahotel.com` en Namecheap.
- [ ] Los datos ficticios (habitaciones, carta, tarifas) son aceptables para la presentación y se reemplazarán por reales después de la reunión con el propietario.
- [ ] No hay cobro en línea en esta entrega: reservas, tickets y cotizaciones quedan como solicitud/estimado; el pago se gestiona por fuera.
- [ ] El contenido del PDF "Experiencias Corporativas Loma Bonita" es el copy definitivo para esa página (salvo tarifas).
- [ ] `fincalomabonitacartago.com` no debe aparecer en ninguna parte del producto nuevo.

### Supuestos adicionales (especificos de este PRP)
- [ ] `node_modules` se puede instalar en el entorno (el scaffold no lo trae); `npm install` corre limpio con Next 16 + React 19.
- [ ] El plan free de Supabase soporta `btree_gist` y Realtime para el volumen del demo.
- [ ] La cuenta de Vercel permite un segundo proyecto en el mismo team sin coste adicional relevante.

---

## Fuera de Alcance heredado

> Copia exacta del brief.

- Pasarela de pagos / cobro en línea (Polar, tarjetas, PSE) — entrega posterior con `payments-polar`.
- Channel manager / sincronización con OTAs (Booking.com, Airbnb, Expedia).
- Integración con Google Business Profile y publicación en directorios (solo se deja el NAP y el schema consistentes).
- App móvil nativa / PWA instalable / notificaciones push.
- Emails transaccionales automáticos — en v1 la notificación vive en el panel.
- Facturación electrónica DIAN, POS de restaurante, control de inventario / almacén.
- Migración de datos reales de habitaciones, carta y tarifas.
- El corte de dominio a producción (merge a `main` + DNS): se deja el runbook listo, se ejecuta cuando el propietario apruebe.
- Multi-idioma (i18n). El sitio va en español.
- Registro de bases de datos ante la SIC (RNBD): trámite del propietario.

### Fuera de Alcance adicional (especifico de este PRP)
- Reportería/analítica de negocio en el panel (ocupación histórica, ingresos): el panel v1 es operativo, no analítico.
- Roles granulares más allá del enum `staff_role` base.
- Tests unitarios exhaustivos por módulo: la cobertura E2E de flujos críticos (Fase 8) es el mínimo exigido; Vitest por módulo es opcional.

---

## Terreno heredado

No hay terreno heredado (modo directo, sin Director). Los datos de infraestructura verificados (tokens, IDs de proyecto, ramas) están en `.env.local` y en la memoria de proyecto de Praxis, y se re-verifican en Fase 0.

---

## Aprendizajes heredados de fases previas

No hay aprendizajes heredados — primer PRP del brief. `CLAUDE.md` no tiene aún sección de aprendizajes transversales poblada.

---

## Plan de implementacion

> Solo FASES. Las subtareas las genera el `bucle-agentico` al entrar a cada fase, con contexto fresco.
> Cada `**Validacion**` es observable y no-degradable: comando/observación exacta con control positivo Y negativo. Los criterios vienen del `## Alcance por Fases` del brief sin debilitarlos.

### Fase 0: Fundacion, seguridad y pipeline del demo
- **Objetivo**: dejar la app Next.js en pie sobre la rama `plataforma-v2` (cortada de `origin/main`), con Supabase cableado (cliente browser/server/admin), auth OTP de staff, capa de seguridad (CSP + cabeceras + middleware de rutas), sistema de diseño Eje Cafetero (tokens Tailwind + shadcn/ui), imágenes del prototipo migradas y optimizadas a `public/`, y despliegue automático al proyecto Vercel `lomabonita-demo` con `noindex` global.
- **Validacion**:
  - `npm run build` y `npx tsc --noEmit` salen con código 0; `npm run lint` sin errores.
  - `curl -I https://<url-demo>/` incluye `x-robots-tag: noindex` y `content-security-policy`; `curl https://<url-demo>/robots.txt` contiene `Disallow: /` (control positivo). Con `SITE_MODE=production` en local, `curl localhost:3000/robots.txt` NO contiene `Disallow: /` y `curl localhost:3000/sitemap.xml` lista rutas (control negativo del mismo interruptor).
  - `curl -I https://<url-demo>/admin` responde 307/302 a `/login` sin sesión (control negativo: no 200).
  - `git log origin/main --oneline` = una sola línea (`4bb306e`); `git branch -r` incluye `origin/plataforma-v2`.
  - `find public -iname "*.jpg" -o -iname "*.jpeg" | xargs -r ls -l` → ningún archivo > 300 KB; `find . -path ./node_modules -prune -o -iname "*.jpeg" -print` no lista imágenes multi-MB en la rama (control negativo).
  - `grep -rn "server-only" src/core/adapters/supabase/admin*.ts` existe; un `import` de ese módulo desde un componente `'use client'` rompe `npm run build` (prueba del instrumento).
  - El proyecto `lomabonita-demo` existe en el team y su "Production Branch" es `plataforma-v2` (consulta API de Vercel); el proyecto `lomabonita` original conserva `main`.

### Fase 1: Sitio publico, Inicio rediseñada y paginas de servicio
- **Objetivo**: Home nueva mobile-first con estética Eje Cafetero + navegación y footer compartidos + páginas informativas `/hospedaje`, `/restaurante`, `/pasadias`, `/experiencias` (karts, cabalgata, balsaje), `/contacto`, `/galeria`, con el contenido migrado del prototipo y cero mención a `fincalomabonitacartago.com`.
- **Validacion**:
  - `for r in / /hospedaje /restaurante /pasadias /experiencias /experiencias-corporativas /contacto /galeria; do curl -s -o /dev/null -w "$r %{http_code}\n" https://<url-demo>$r; done` → todas 200.
  - Cada ruta renderiza exactamente un `<h1>` propio y contiene el header y el footer compartidos (snapshot de accesibilidad con agent-browser).
  - `grep -rniE "fincalomabonitacartago" src/ public/` → sin resultados (control negativo).
  - agent-browser en viewport 390×844 sobre cada ruta: screenshot sin scroll horizontal (`document.scrollingElement.scrollWidth <= 390 + 1`) ni texto solapado.
  - La página `/experiencias` contiene la cadena "salida y regreso desde Loma Bonita" (o equivalente literal aprobado) en la ficha de balsaje.
  - Teléfonos (`310 291 3182`, `324 497 1602`), handles de redes y horarios coinciden con los del prototipo (`grep`).

### Fase 2: SEO tecnico y estructura de contenido
- **Objetivo**: metadata por ruta, `sitemap.ts` y `robots.ts` dinámicos por `SITE_MODE`, datos estructurados JSON-LD por tipo (LodgingBusiness, Restaurant, TouristAttraction para balsaje), Open Graph, canónicos a `https://www.lomabonitahotel.com`, y pasada de rendimiento/Core Web Vitals.
- **Validacion**:
  - Cada página pública emite `<title>`, `<meta name="description">` y `<link rel="canonical">` únicos; el canonical apunta al host de producción, no a la URL del demo (parse del HTML).
  - El bloque JSON-LD de la Home, `/restaurante` y la ficha de balsaje valida sin errores en https://validator.schema.org/ (pegar salida).
  - `SITE_MODE=production` local → `sitemap.xml` incluye las 8 rutas públicas y excluye `/admin` y subrutas de gestión; `SITE_MODE=demo` → `/sitemap.xml` responde 404 o vacío y `robots.txt` = `User-agent: *\nDisallow: /` (control positivo y negativo del interruptor).
  - Lighthouse (móvil) sobre Home y `/hospedaje`: Performance ≥ 90 y SEO ≥ 95 (adjuntar reporte).
  - `grep -rn "lomabonita-demo.vercel.app" src/` → sin URLs del demo hardcodeadas en metadata (control negativo).

### Fase 3: Reservas de alojamiento (self-service)
- **Objetivo**: esquema de alojamiento con RLS + 11 habitaciones ficticias sembradas (parejas / familiares 3-4 / grupales, aforo total ~35), buscador público por fechas + adultos + niños, detalle de habitación, y flujo de solicitud de reserva sin pago con estados (solicitada → confirmada / rechazada).
- **Validacion**:
  - `SELECT count(*) FROM rooms` ≥ 11 y `SELECT sum(capacidad_max) FROM room_types rt JOIN rooms r ON r.room_type_id=rt.id` entre 33 y 37; todas las filas con `is_sample = true`.
  - `pg_class.relrowsecurity = true` para `room_types, rooms, reservations, room_blocks, reservation_guests` (control negativo: 0 sin RLS).
  - Test de policy: con la anon key, `INSERT` en `reservations` con datos válidos funciona; `SELECT * FROM reservations` sin filtrar por `codigo` devuelve 0 filas ajenas; `UPDATE` de una reserva desde anon falla.
  - Buscar un rango que solapa un `room_block` o una reserva `confirmada` de una habitación → esa habitación no aparece en resultados; liberar el bloqueo → reaparece.
  - `POST` del formulario con `during` invertido o `adultos` > `capacidad_max` → 4xx con mensaje Zod; `SELECT count(*)` de `reservations` no cambia (control negativo).
  - Dos `INSERT` concurrentes sobre el mismo `room_id` con rangos solapados → uno falla por la restricción `EXCLUDE USING gist` (reproducir con dos conexiones).
  - Recorrido en agent-browser 390px: buscar → elegir → enviar → ver código de seguimiento en pantalla; la fila queda en estado `solicitada`.

### Fase 4: Panel de administracion unificado + notificacion de reservas
- **Objetivo**: un solo `/admin` con login OTP y roles, vista general con notificaciones, y la sección de Hospedaje operativa (lista de reservas, cambio de estado, gestión de habitaciones y bloqueos), generando una notificación por cada reserva entrante.
- **Validacion**:
  - `curl -I https://<url-demo>/admin` sin cookie → redirección a `/login`; con sesión de rol `recepcion`/`admin` → 200 y el shell muestra el menú (Hospedaje activo; Restaurante/Pasadías/Experiencias/Leads visibles como "próximamente" hasta su fase).
  - Crear una reserva por el flujo público de la Fase 3 → aparece una fila nueva en `notifications` (`tipo='reserva'`) y la reserva en la lista del panel tras recargar; el contador de notificaciones del panel incrementa en 1 (control positivo).
  - Confirmar la reserva desde el panel → `estado='confirmada'` y esa habitación deja de aparecer para ese rango en el buscador público; rechazarla → vuelve a aparecer (control positivo y negativo).
  - Con un usuario `auth` sin fila en `profiles` o con rol fuera del enum de staff → `/admin` responde 403 (control negativo).
  - Crear/editar una habitación y un bloqueo de fechas desde el panel se refleja en la disponibilidad pública.

### Fase 5: Pasadias, experiencias y tickets
- **Objetivo**: productos de pasadía + experiencias agregables (karts, cabalgata, balsaje) con tarifas de prueba, flujo de reserva/emisión de tickets sin pago con código/QR, y la sección de Pasadías en el panel (cupos por fecha, tickets emitidos, check-in).
- **Validacion**:
  - Elegir pasadía + fecha + N personas + K experiencias → el total mostrado = `precio_pasadia*personas + Σ(precio_experiencia_i*personas)` según `corp_pricing`/tabla de muestra (cálculo verificable a mano con la salida).
  - Completar la solicitud → fila en `tickets` con `codigo` único (constraint `UNIQUE`) y un dataURL de QR que, escaneado/resuelto, abre `/ticket/<codigo>` con los datos correctos.
  - Configurar `pass_capacity` de una fecha en N y emitir N tickets → el intento N+1 se rechaza con mensaje de cupo (control negativo); `SELECT count(*)` no pasa de N.
  - El ticket aparece en la sección Pasadías del panel; marcar "usado" cambia el estado y el segundo intento de check-in avisa "ya utilizado".
  - agent-browser 390px: el QR se renderiza y la página del ticket es legible en móvil.

### Fase 6: Portafolio de experiencias corporativas + captacion de leads
- **Objetivo**: página `/experiencias-corporativas` con el copy del PDF provisto + asistente de 5 pasos (elige → personaliza → participantes y fecha → valor estimado → deja tus datos) con tarifas de prueba en un solo módulo de config, y captura de lead (Nombre, Empresa, Correo, WhatsApp, Fecha tentativa, Nº personas) que llega al panel con notificación.
- **Validacion**:
  - El texto de la página contiene, verificable por `grep`, los títulos del PDF: "Pasadía corporativo", "Integración & Team Building", "Eventos corporativos", "Experiencia corporativa", "¿Cómo funciona?", "Recibe tu cotización".
  - El asistente recorre los 5 pasos; en el paso 4 el "valor estimado" = suma de las opciones marcadas × participantes según `src/core/config/tarifas-corporativas.ts` (recalcular a mano con dos combinaciones distintas y comparar).
  - `POST` con email inválido o campos obligatorios vacíos → 4xx, sin fila nueva en `corp_leads` (control negativo).
  - `POST` válido → fila en `corp_leads` con `seleccion` (jsonb) y `estimado` persistidos, notificación `tipo='lead'`, y visible en la sección "Leads corporativos" del panel.
  - Rate-limit: 6 envíos en < 1 min desde el mismo origen → a partir del 6º responde 429 (control positivo); un envío legítimo posterior tras la ventana vuelve a pasar (control negativo).

### Fase 7: Restaurante — carta, pedido en sitio y pantalla de cocina (KDS)
- **Objetivo**: esquema de carta + siembra con platos típicos del Eje Cafetero y un plato del día, página pública de carta, flujo de pedido para el comensal en mesa (identificado por mesa/QR), pantalla de cocina en tiempo real con estados, y sección de Restaurante en el panel (CRUD de carta, plato del día, historial de pedidos).
- **Validacion**:
  - `/restaurante` lista los `menu_items` sembrados agrupados por `menu_categories` y destaca el `daily_special` del día; todas las filas `is_sample = true`.
  - Desde `/mesa/<token>` se arma un pedido y al enviarlo aparece en `/cocina` en < 3 s sin recargar (Supabase Realtime; medir con dos pestañas/dispositivos, control positivo).
  - Avanzar el estado en `/cocina` (recibido → en preparación → listo) se refleja en la vista del comensal en < 3 s.
  - Enviar un pedido sin ítems → bloqueado en cliente y en server action (control negativo).
  - Editar un `menu_item` o cambiar el `daily_special` desde el panel → cambio visible en `/restaurante` tras recarga.
  - `orders` y `order_items` están en la publicación `supabase_realtime` (`SELECT * FROM pg_publication_tables WHERE pubname='supabase_realtime'`).

### Fase 8: Paginas legales, consentimiento de cookies y cierre del demo
- **Objetivo**: páginas legales (Privacidad, Tratamiento de Datos — Ley 1581, Aviso Legal / T&C, Cookies) enlazadas desde el footer, banner de consentimiento real que bloquea cookies no esenciales y recuerda la elección, QA final de flujos felices y de error con agent-browser, deploy del demo estable, y `docs/runbook-corte-produccion.md`.
- **Validacion**:
  - `for r in /legal/privacidad /legal/datos-personales /legal/terminos /legal/cookies; do curl -s -o /dev/null -w "$r %{http_code}\n" https://<url-demo>$r; done` → todas 200; las 4 aparecen enlazadas en el footer de todas las páginas.
  - Primera visita (perfil de navegador limpio, agent-browser): el banner aparece y el panel de red NO muestra peticiones a dominios de analítica antes del clic en "Aceptar" (control negativo). Tras aceptar: `localStorage`/cookie de consentimiento presente, el banner no reaparece al recargar ni en una segunda navegación (control positivo). Tras "Rechazar": tampoco se cargan.
  - Recorrido agent-browser de los flujos clave (reserva, ticket, pedido, lead) capturando **flujo feliz y flujo de error** en screenshot; se adjuntan las 8 imágenes.
  - `npm run build`, `npx tsc --noEmit`, `npm run lint` limpios sobre la rama.
  - `docs/runbook-corte-produccion.md` existe y enumera pasos accionables: (1) reapuntar dominio/merge a `main`, (2) `SITE_MODE=production` en el proyecto Vercel, (3) DNS del apex/`www`, (4) verificación post-corte (indexabilidad, `/admin` sigue `noindex`).
  - `grep -rn "TODO\|FIXME\|XXX" src/` no supera un umbral acordado (p. ej. 0 en rutas de pago/seguridad; los cosméticos van al registro de aprendizajes).

### Fase 9: Validacion final
- **Objetivo**: sistema funcionando end-to-end en la URL oculta, con todos los criterios de éxito del PRP cumplidos.
- **Validacion**:
  - [ ] Todos los "Criterios de exito" de la sección `## Que` marcados y comprobados con su evidencia.
  - [ ] `npm run build` + `npx tsc --noEmit` + `npm run lint` en verde sobre `plataforma-v2`.
  - [ ] Suite Playwright de los flujos críticos (reserva, ticket, pedido, lead, acceso al panel) en verde en CI (`.github/workflows`).
  - [ ] agent-browser: flujo feliz + flujo de error de cada subsistema, en snapshot/screenshot.
  - [ ] `git log origin/main` intacto; PR de `plataforma-v2` abierto y al día; deploy del demo verde.
  - [ ] Memoria de proyecto Praxis y `CLAUDE.md` actualizados con los aprendizajes transversales que apliquen.

---

## Aprendizajes

> Esta seccion crece con cada error durante la ejecucion del bucle-agentico. Se filtra al cierre con los criterios discriminativos.

### 2026-09-11 (Fase 7, método): el espejo del gotcha `.select()` — el VERIFICADOR también puede falsear un 42501
- **Error**: al verificar el insert anónimo de `orders` con curl contra la REST API, un insert con payload válido rebotaba 42501 ("new row violates row-level security policy") aunque la policy era correcta. Causa: el curl usaba `Prefer: return=representation`, que añade `RETURNING` al INSERT — sin policy de SELECT para anon, Postgres evalúa el RETURNING contra RLS y falla. Es la trampa de la Fase 6, pero del lado del que prueba.
- **Fix**: verificar inserts anónimos SIEMPRE con `Prefer: return=minimal` (el equivalente exacto del `.insert()` sin `.select()` de la app) — con minimal el mismo payload pasó 201. Contra-proba decisiva: el insert directo por SQL con `set local role anon` funcionaba, delatando que la policy estaba bien y el artefacto estaba en la capa REST de la verificación.
- **Aplicar en**: cualquier verificación futura de policies anon-insert-only vía curl/REST (QA de Fase 8, futuro POS). Regla: si el SQL como rol anon pasa pero el REST falla, revisar el header `Prefer` antes de tocar la migración.

### 2026-09-16 (post-demo, terreno): contenido real sin motor de reservas + publicar el demo
- **Error**: tras el push a `plataforma-v2`, Vercel creó solo un deploy *preview*; `lomabonita-demo.vercel.app` siguió sirviendo la versión anterior (confirma la trampa del 2026-09-10). Además, el despacho a Codex para generar imágenes con IA falló en el primer turno por límite de uso de la cuenta (hasta 2026-10-05), y no hay llave de OpenRouter en `.env.local` para la vía `image-kit`.
- **Fix**: deploy de producción por `POST /v13/deployments` con `gitSource.ref=plataforma-v2` tras cada push. Hospedaje/Pasadías/Restaurante pasan a datos estáticos reales (`features/*/data/`) con reserva por WhatsApp; los motores de reserva quedan para la v3 sin tocar el panel. Imágenes IA pendientes: `scripts/verify-ai-images.mjs` ya define el contrato (6 slugs en `public/img/ai/`).
- **Aplicar en**: cualquier publicación del demo; cualquier encargo de imágenes (confirmar cupo del proveedor o llave de imágenes antes de planear alrededor de ellas). Una carpeta anidada sin versionar dentro del repo rompe `tsc` del build: quedó excluida en `tsconfig.json`.

### 2026-09-11 (Fase 7, terreno): handoff sin gates — backslashes en imports y JSX en try/catch
- **Error**: el ejecutor anterior cerró sin correr los gates. Quedaron: (1) un import con backslashes de Windows (`'@/features\restaurante\...'` — `\r` es un carriage return real, `\c`/`\p` escapes inútiles → tsc no encontraba el módulo); (2) JSX construido dentro de un try/catch (regla `react-hooks/error-boundaries`); (3) un import sin uso. Nada de esto saltaba "leyendo el código".
- **Fix**: forward slashes en el import; datos dentro del try/catch y JSX fuera; import eliminado. `tsc`/`lint`/`build` en verde tras 3 correcciones.
- **Aplicar en**: todo código generado o retomado en Windows — los gates detectan esto siempre; correrlos es parte de "casi completa", no un extra opcional.

### 2026-09-10: El production branch de Vercel no se puede cambiar por API (trampa del terreno)
- **Error**: `POST /v11/projects` y `PATCH /v9/projects/{id}` ignoran `gitRepository.productionBranch` / `link.productionBranch` (siempre queda `main`); `PATCH {"productionBranch":...}` da 400; `/v1/projects/{id}/branch` da 404. El proyecto `lomabonita-demo` quedó con production branch = `main`.
- **Fix**: desplegar `plataforma-v2` a `target: production` con `POST /v13/deployments` + `gitSource.ref=plataforma-v2`. Cada fase: tras el push de `plataforma-v2`, disparar un deploy de producción por API (el director controla el pipeline). Alternativa de conveniencia: el usuario cambia el dropdown en Vercel → Settings → Git → Production Branch a `plataforma-v2` (una vez).
- **Aplicar en**: cualquier fase que dependa de que `lomabonita-demo.vercel.app` refleje el último push; y en el runbook del corte (Fase 8).

### 2026-09-10: Vercel Authentication (SSO) viene ON por defecto en proyectos nuevos
- **Error**: el proyecto nuevo trae `ssoProtection: { deploymentType: "all_except_custom_domains" }` → toda la app redirige a `vercel.com/sso-api`; el propietario (no miembro del team) no puede abrir el enlace.
- **Fix**: `PATCH /v9/projects/{id}` con `{"ssoProtection":null,"passwordProtection":null}`. El demo ya va `noindex` + sin enlaces, así que es seguro. Verificar SIEMPRE tras crear un proyecto de demo.
- **Aplicar en**: creación de cualquier proyecto Vercel destinado a compartirse por enlace.

### 2026-09-11 (Fase 6, método): documentar un gotcha en el PRP no evita que se repita — hay que recordárselo al ejecutor
- **Error**: el gotcha de "`.insert().select()` con policy anon-insert-only rompe con 401/42501" ya estaba documentado en el PRP desde la Fase 5. La Fase 6 (ejecutor Sonnet 4.5, sesión nueva) lo reintrodujo en `createCorpLead` de todos modos, lo mal-diagnosticó como una policy RLS demasiado restrictiva, escribió una migración correctiva innecesaria (nunca aplicada) y "verificó" el flujo insertando con el cliente service-role (bypass RLS) en vez de probar el camino anónimo real — dio por buena una fase que no lo estaba.
- **Fix**: el director reprodujo el bug con `curl` (insert con `Prefer: return=representation` → 401; sin él → pasa), corrigió `actions.ts` (sin `.select()` tras el insert anónimo), descartó la migración innecesaria, y re-verificó los 5 pasos con la anon key real vía agent-browser.
- **Aplicar en**: CADA encargo de fase que incluya una tabla con policy anon-insert-only (pasadías, hospedaje, corporativo ya lo tienen; futuras fases de restaurante/pedidos también aplicarán) — recordar EXPLÍCITAMENTE en el encargo "no encadenes `.select()` tras un insert de un cliente sin policy de SELECT". Y como regla de verificación: un insert con el cliente `admin`/service-role NUNCA cuenta como prueba de que el flujo público (anon) funciona — hay que probarlo con la anon key o con la app real sin sesión.

### 2026-09-11 (Fase 5, terreno de seguridad): `handle_new_user` (Fase 0) da rol de staff a CUALQUIER alta en auth.users
- **Hallazgo**: el trigger `handle_new_user` (migración `0001`) crea `profiles` con `role='recepcion', activo=true` para todo usuario nuevo de `auth.users`, y `is_staff()` incluye `recepcion` — así que cualquier alta en Auth es staff de facto. Hoy no es explotable porque no hay signup público (`shouldCreateUser: false` en el login OTP), pero es una bomba de tiempo si alguna fase futura habilita registro público (ej. cuentas de huésped, leads con cuenta).
- **No se corrigió**: la migración `0001` es invariante de fases posteriores por encargo explícito. Queda documentado aquí para que la fase que toque auth de nuevo (o antes del corte a producción) decida: el alta automática de `profiles` debería crear rol `null`/`ninguno` (no staff) y que un owner/admin promueva explícitamente, o el trigger debe distinguir altas de staff (invitadas por un admin) de cualquier otra.
- **Aplicar en**: cualquier fase que toque auth, señup público, o el runbook de corte a producción (Fase 8) — revisar antes de exponer registro público.

### 2026-09-10 (Fase 3): nuqs — adapter obligatorio + omite valores default de la URL
- **Error**: (1) `useQueryStates`/`useQueryState` de `nuqs` lanza `[nuqs] requires an adapter` en runtime — `/hospedaje` devolvía 500 aunque `next build` pasaba en verde. (2) `parseAsInteger.withDefault(2)`: cuando el valor iguala el default, nuqs lo OMITE de la URL; el server `hasSearch = params.checkIn && params.checkOut && params.adultos` era falso con 2 adultos → el buscador no devolvía nada.
- **Fix**: `<NuqsAdapter>` de `nuqs/adapters/next/app` en `src/app/(public)/layout.tsx`. `hasSearch` exige solo `checkIn && checkOut`; `searchParamsSchema.adultos` con `.default(2)`.
- **Aplicar en**: cualquier fase que use `nuqs` (Fase 5 pasadías, Fase 6 wizard corporativo). `next build` NO es suficiente para validar páginas con nuqs — hay que cargar la ruta en runtime.

### 2026-09-10 (Fase 3, método): un ejecutor puede dejar RLS permisiva y cerrar con "tests pendientes"
- **Error**: el ejecutor (Sonnet 4.5) experimentó con una policy `WITH CHECK (true)` en `reservations: anon insert` para diagnosticar un bloqueo, no la revirtió, y cerró la fase con "verificaciones funcionales pendientes". Resultado: anon podía insertar `estado='confirmada'` (auto-confirmar reservas).
- **Fix**: migración `0007` restaura el `WITH CHECK` real. El director corrió TODOS los tests que el ejecutor omitió (policy: insert válido / insert confirmada rechazado / select vacío / update no-op; concurrencia 23P01; E2E 390px; aforo excedido).
- **Aplicar en**: `praxis-master` — cuando el ejecutor cierra con "tests pendientes" o hedge ("la ruta de producción maneja auth"), la fase NO está completa; el director ejecuta la verificación completa antes de aceptar, siempre, sin excepción. Nunca confiar en policies RLS sin consultarlas con `pg_policies` en la BD real.

### 2026-09-10: `next lint` fue removido en Next 16
- **Error**: `next lint` → "Invalid project directory provided, no such directory: .../lint".
- **Fix**: `eslint.config.mjs` flat nativo (`@eslint/js` + `typescript-eslint` + `eslint-plugin-react-hooks` + `@next/eslint-plugin-next`), scope `src/**` + config raíz, ignorando el tooling Praxis. `FlatCompat` + `eslint-config-next` 16.3.4 rompe con ESLint 9 ("Converting circular structure to JSON") — no usarlo.
- **Aplicar en**: cualquier proyecto Praxis nuevo sobre Next 16.

### 2026-09-11 (Fase 8, código): Server Action pública con `.parse()` deja el UI colgado sin error visible
- **Error**: `createCorpLead` (src/features/corporativo/api/actions.ts) usaba `createCorpLeadSchema.parse(input)` directo — cuando el usuario enviaba un email inválido, `.parse()` lanzaba una excepción que rompía la promesa del cliente, dejando el wizard-corporativo colgado en "Enviando..." para siempre sin mensaje de error visible. El usuario no sabía qué pasó ni podía reintentar.
- **Fix**: cambio a `.safeParse(input)` + retorno estructurado `{success: false, error: string, code?: string}`. El wizard ahora muestra el error en UI ("Datos inválidos. Revisa el formulario.") y el usuario puede corregir y reenviar. Contra-prueba: correo válido → envía OK.
- **Aplicar en**: TODAS las Server Actions públicas (sin sesión autenticada, expuestas a anon) — nunca usar `.parse()` directo; siempre `.safeParse()` + retornar `{success, error}` para que el cliente pueda mostrar el error en UI. Aplica a `createReservation`, `createTicket`, `createCorpLead`, futuros endpoints públicos de pedidos/contacto. El patrón general: cualquier SA pública debe devolver un discriminated union `{success: true} | {success: false, error: string}`, nunca lanzar excepciones sin capturar.

---

## Anti-patrones

- **NO generar nuevos PRPs durante la ejecucion de este PRP** — un PRP = un solo plan, una sola pila de fases.
- **NO tocar la rama `main`** — todo el trabajo vive en `plataforma-v2`; `main` sólo cambia en el corte, que está fuera de alcance.
- No introducir Stripe ni ninguna pasarela de pago (fuera de alcance v1).
- No exponer `SUPABASE_SERVICE_ROLE_KEY` en el bundle cliente ni en variables `NEXT_PUBLIC_*`.
- No crear tablas sin `ENABLE ROW LEVEL SECURITY` + policies explícitas en la misma migración.
- No validar disponibilidad solo en la UI o en el server action — la restricción de exclusión en base de datos es obligatoria.
- No hardcodear tarifas por el código — todas viven en `src/core/config/tarifas*.ts` marcadas como muestra.
- No dejar URLs del demo (`*.vercel.app`) en metadata, canónicos ni JSON-LD — el host canónico es `www.lomabonitahotel.com`.
- No indexar el demo: `SITE_MODE=demo` implica `noindex` en cabecera + `robots` bloqueante + sin sitemap.
- No `any` (usar `unknown` + narrowing). No ignorar errores de TypeScript. No commitear secretos.
- No enlazar las superficies de gestión (`/admin`, `/cocina`, `/mesa/*`) desde el sitio público; se acceden por URL directa.

---

## Trust Stack (referencia)

Compatibilidad heredada = **MATCH**. Aplica el Trust Stack Praxis tal cual:

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js 16 + React 19 + TypeScript (strict) |
| Estilos | Tailwind CSS 3.4 + shadcn/ui (new-york) |
| Backend | Supabase (Auth + Postgres + Storage + Realtime + RLS) |
| Validacion | Zod (todos los bordes) |
| Estado cliente | Zustand + @tanstack/react-query |
| Formularios | react-hook-form + @hookform/resolvers |
| Testing | Playwright (E2E en CI) |
| Deploy | Vercel (proyecto `lomabonita-demo`, rama `plataforma-v2`) |

**Comandos de validacion final**: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npx playwright test`, + validación de UI con agent-browser (flujo feliz + flujo de error).

---

*PRP pendiente de aprobacion. No se ha modificado codigo.*

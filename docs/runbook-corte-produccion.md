# Runbook: corte a producción — plataforma Loma Bonita

> Guía de ejecución para el **director** del proyecto. Ningún paso de este documento se
> ejecuta en automático ni antes de que el propietario dé su aprobación explícita tras la
> presentación del demo (`https://lomabonita-demo.vercel.app`). Mientras tanto,
> `www.lomabonitahotel.com` sigue sirviendo el sitio estático (proyecto Vercel `lomabonita`,
> rama `main`).

**Estado del corte**: ✅ EJECUTADO el 2026-09-17 por orden del propietario.

> Qué se hizo: `NEXT_PUBLIC_SITE_MODE=production` y `NEXT_PUBLIC_SITE_URL=https://www.lomabonitahotel.com`
> en el proyecto `lomabonita-demo`; merge de `plataforma-v2` a `main`; deploy de producción desde
> `main`; dominios `lomabonitahotel.com` (308 → www) y `www.lomabonitahotel.com` trasladados del
> proyecto `lomabonita` al `lomabonita-demo`.
>
> **Punto de retorno**: el sitio estático anterior sigue en el commit `4bb306e` y en el proyecto
> Vercel `lomabonita`; revertir = devolver ambos dominios a ese proyecto.
>
> Pendiente del Paso 6: rotar las credenciales compartidas durante la construcción.

---

## Contexto de infraestructura (estado actual, medido)

| Pieza | Hoy |
|---|---|
| Repo | `marketinglomabonita-jpg/lomabonita`. Plataforma nueva en rama `plataforma-v2`; `main` intacto (solo el commit `4bb306e` del sitio estático). |
| Proyecto Vercel nuevo | `lomabonita-demo` (team "Loma Bonita"), sirviendo `plataforma-v2`. |
| Proyecto Vercel viejo | `lomabonita`, rama de producción `main`, ligado al dominio `lomabonitahotel.com` / `www`. |
| DNS | `lomabonitahotel.com` en Namecheap (externo a Vercel). |
| Indexabilidad | `NEXT_PUBLIC_SITE_MODE=demo` → `noindex` global, `robots.txt` con `Disallow: /`, sin sitemap. |

---

## Paso 0 — Aprobación explícita del propietario

- Presentar el demo y recoger el visto bueno **sobre contenido, precios y datos reales**.
- Sin ese visto bueno, no se ejecuta ningún paso siguiente. Este runbook no tiene fechas: se
  ejecuta cuando el propietario diga que sí.

## Paso 1 — Reemplazar los datos de ejemplo por los reales

Todo el contenido transaccional del demo está sembrado con datos ficticios marcados
(`is_sample = true`). Reemplazar con los datos que apruebe el propietario:

1. **Hospedaje**: tipos de habitación, capacidad, precios por noche (`room_types`,
   `room_types.precio_noche_muestra`), número real de habitaciones (`rooms`). Editable desde
   `/admin/hospedaje` o por SQL.
2. **Restaurante**: carta completa por categoría y precios (`menu_items`), plato del día.
   Editable desde `/admin/restaurante`.
3. **Pasadías y experiencias**: planes, tarifas y cupos (`pass_products`, `experiences`,
   `pass_capacity`). Tarifas también en `src/core/config/tarifas-*.ts`.
4. **Corporativo**: conceptos y precios del cotizador (`corp_pricing` +
   `src/core/config/tarifas-corporativas.ts`).
5. **Datos de negocio** (`src/core/config/site.ts`): confirmar con el propietario dirección
   exacta, coordenadas del pin de Google Maps, email de contacto (hoy `null`) y horarios.
6. Al finalizar, quitar el aviso de "fase de validación / precios de ejemplo" de
   `/legal/terminos` (numeral 3) y actualizar la fecha de las páginas legales.

## Paso 2 — Fijar `NEXT_PUBLIC_SITE_MODE=production`

Es una **variable de entorno del proyecto Vercel `lomabonita-demo`** (o del proyecto que quede
como definitivo):

1. Vercel → proyecto → **Settings → Environment Variables**.
2. `NEXT_PUBLIC_SITE_MODE` = `production` para **Production** (y Preview si se desea seguir
   validando el interruptor).
3. Redesplegar (los cambios de env requieren nuevo deploy para tomar efecto).

Efecto: `robots.txt` deja de bloquear, se publica el `sitemap.xml` con las rutas públicas
(incluidas las 4 legales) y solo `/admin` y `/cocina` quedan `noindex`.

> Nota: `src/app/robots.ts`, `sitemap.ts` y el middleware ya implementan el interruptor — no
> hay que tocar código en el corte, solo la variable.

## Paso 3 — Mover el dominio al proyecto de la plataforma (mismo team Vercel)

Hoy `lomabonitahotel.com` / `www` viven en el proyecto estático `lomabonita`. Para moverlos al
proyecto nuevo dentro del mismo team:

1. Vercel → proyecto **`lomabonita-demo`** → **Settings → Domains** → **Add** →
   `lomabonitahotel.com` y `www.lomabonitahotel.com`.
2. Vercel detectará que el dominio está en uso por otro proyecto del team y ofrecerá
   **transferirlo** (mantiene el DNS apuntando a Vercel; no requiere tocar Namecheap si el
   dominio ya resuelve a Vercel).
3. Verificar en el proyecto viejo `lomabonita` que el dominio quedó removido de su lista.
4. Si Vercel pide ajuste DNS (Namecheap): los registros deben apuntar a `76.76.21.21` (apex A)
   y/o `cname.vercel-dns.com` (`www` CNAME), según lo que muestre el asistente de Vercel.
5. El sitio estático viejo deja de servirse en cuanto el dominio se transfiera — por eso este
   paso va DESPUÉS de tener datos reales y `SITE_MODE=production`.

## Paso 4 — Merge de `plataforma-v2` a `main` (solo con el visto bueno)

1. Abrir PR de `plataforma-v2` → `main` (o convertir `plataforma-v2` en la rama de producción
   del proyecto, si se prefiere mantener ambas).
2. Revisar el diff completo (última revisión de seguridad: sin secrets, sin `console.log`,
   `grep -rniE "fincalomabonitacartago|stripe" src/ public/ supabase/` vacío).
3. Merge **solo cuando el propietario haya aprobado** — nunca antes.
4. `main` queda como rama de producción del proyecto definitivo en Vercel.

> Gotcha medido (PRP): la rama de producción de un proyecto Vercel **no se puede cambiar por
> API** (`PATCH` la ignora). Si hace falta cambiarla, es manual: Vercel → Settings → Git →
> Production Branch. Y si se mantiene el pipeline por API, disparar el deploy de producción
> con `POST /v13/deployments` + `gitSource.ref` de la rama deseada.

## Paso 5 — Verificación post-corte (checklist accionable)

Contra `https://www.lomabonitahotel.com`:

```bash
curl -s https://www.lomabonitahotel.com/robots.txt          # SIN "Disallow: /"
curl -s https://www.lomabonitahotel.com/sitemap.xml         # lista las rutas públicas incl. /legal/*
curl -I https://www.lomabonitahotel.com/admin               # redirige a login (307/302), nunca 200 público
curl -I https://www.lomabonitahotel.com/                    # sin X-Robots-Tag: noindex
```

- Recorrer en móvil los 4 flujos transaccionales (reserva, ticket, pedido, lead) contra datos
  reales.
- Iniciar sesión en `/admin` con el OTP real del propietario (el login por navegador no se pudo
  probar en el demo por falta de acceso al correo del staff — primera sesión real = probarlo).
- **Search Console** (cuando el propietario la abra): verificar propiedad del dominio, enviar
  `https://www.lomabonitahotel.com/sitemap.xml` y solicitar indexación de la home.
- Google Business Profile (en trámite): confirmar que el NAP coincide con `site.ts`.

## Paso 6 — Rotar credenciales expuestas en el chat de trabajo

Varias credenciales se compartieron por chat durante la construcción (token de GitHub, token de
Vercel, access token de Supabase, keys del proyecto). Una vez el corte esté estable:

- GitHub: regenerar el PAT usado.
- Vercel: regenerar el token del team.
- Supabase: regenerar el access token; rotar la `anon`/`service_role` solo si se sospecha
  exposición (la `service_role` jamás estuvo en el bundle cliente — verificar con un grep
  post-merge si se quiere doble prueba).
- Actualizar `.env.local` / variables de entorno de Vercel con los valores nuevos.

## Pendientes del propietario (fuera del software)

- Registro de la base de datos ante la SIC (RNBD) — obligación del responsable del tratamiento.
- Confirmar dirección exacta + pin de Maps (hoy `geo` es provisional en `site.ts`).
- Decidir si se contrata analítica (GA4/PostHog); si se instala, TODO script debe consultar
  `hasCookieConsent()` (`src/features/marketing/lib/cookie-consent.ts`) antes de cargarse.

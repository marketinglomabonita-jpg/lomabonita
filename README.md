# Proyecto Praxis

Proyecto base inicializado con la extensión VS Code **Praxis**, que inyecta un stack opinado (Trust Stack) y un sistema agéntico listo para construir features sobre él. Este archivo describe el estado inicial del proyecto: qué incluye, cómo está organizado, y qué convenciones aplican.

---

## Naturaleza del proyecto

Scaffold limpio: **Next.js + sistema agéntico Praxis**, sin features de negocio implementadas. La carpeta `src/` contiene únicamente el blueprint base (`_blueprint`, `auth`, `dashboard`); cada feature nueva se construye sobre este scaffold siguiendo la metodología Praxis (`brief → prp → bucle-agentico`) descrita en `CLAUDE.md` y en `.claude/skills/`.

El proyecto está pensado para ser **extendido**, no consumido tal cual. Toda funcionalidad nueva vive como `src/features/<nombre>/` y se origina desde un PRP aprobado.

---

## Trust Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 + React 19 + TypeScript (strict) |
| Estilos | Tailwind CSS 3.4 + shadcn/ui |
| Backend | Supabase (Postgres + Auth + RLS) |
| AI Engine | Vercel AI SDK v5 + OpenRouter |
| Validación | Zod (en bordes) |
| Estado cliente | Zustand |
| Testing | Playwright CLI + MCP |
| Dev server | Turbopack |

Si el brief de un proyecto declara compatibilidad `PARTIAL`, `REPLACE_FRONT` o `REPLACE`, la Directiva de Stack del brief indica los deltas (KEEP / ADD / REPLACE / REMOVE / CONFIG) — el Trust Stack default solo aplica a `MATCH` y `EXTEND`.

---

## Estructura

```
.
├── CLAUDE.md                     # Reglas del proyecto + metodología recursiva
├── README.md                     # Este archivo
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── components.json               # shadcn/ui config
├── postcss.config.js
├── .env.local.example            # Variables de entorno (template)
├── .mcp.json                     # MCPs activos (next-devtools, playwright por defecto)
│
├── docs/                         # Briefs y documentación del proyecto
│   └── BRIEF-*.md                # Briefs generados por la skill /brief (canónico desde PRP-040)
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (public)/             # Rutas sin auth (login, signup)
│   │   ├── (app)/                # Rutas autenticadas
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── features/                 # Feature-First (DDD modular monolith)
│   │   ├── _blueprint/           # Scaffold para nuevas features
│   │   ├── auth/                 # Flujo de autenticación (Supabase)
│   │   └── dashboard/            # Dashboard inicial post-login
│   │
│   └── core/                     # Código compartido entre features
│       ├── ui/                   # Primitivos visuales (Button, Input, …)
│       ├── hooks/                # Hooks transversales
│       ├── lib/                  # Utilidades puras
│       ├── adapters/             # Clientes a servicios externos
│       │   └── supabase/         # browser.ts + server.ts
│       ├── config/               # Constantes
│       └── primitives/           # Assets, design tokens
│
└── .claude/
    ├── README.md                 # Documentación del sistema agéntico
    ├── settings.json             # Configuración de Claude Code
    ├── example.mcp.json          # Referencia de MCPs disponibles
    ├── design-systems/           # Sistemas visuales referenciables
    ├── hooks/                    # Scripts en eventos de Claude Code
    ├── PRPs/                     # Product Requirements Prompts
    │   └── prp-base.md           # Template base
    └── skills/                   # Skills activas (las 20 del catálogo, todas por defecto)
        ├── brief/                # Escala proyecto
        ├── prp/                  # Escala feature
        ├── bucle-agentico/       # Escala subtarea + doctrina canónica
        ├── praxis-master/        # Escala organización: dirigir agentes
        ├── praxis-init/          # Contexto de un proyecto existente
        ├── graphify/             # Grafo de conocimiento del código
        ├── skill-creator/        # Crear nuevas skills con validador
        ├── impeccable/           # Frontend con criterio de diseño
        ├── agent-browser/        # El navegador del agente (validar UI)
        ├── supabase-admin/       # Base de datos: tablas, RLS, queries
        ├── auth-stack/           # Autenticación completa
        ├── infra-vps/            # DevOps en VPS propio
        └── verification-before-completion/  # Evidencia antes de dar por terminado
```

---

## Convenciones aplicables

- **Feature-First**: cada feature vive en una sola carpeta bajo `src/features/<nombre>/` con sus `components/`, `hooks/`, `services/` (server actions) y `types/`. Esta colocación reduce la carga cognitiva al leer una feature completa sin saltar entre carpetas.
- **Validación en bordes**: cualquier input externo (forms, API routes, server actions) pasa por un schema Zod antes de tocar lógica de negocio.
- **RLS obligatorio**: toda tabla de Supabase nueva habilita Row Level Security antes del primer write.
- **Sin `any`**: TypeScript en strict mode. Para tipos desconocidos: `unknown` + narrowing.
- **Tamaño**: archivos ≤ 500 líneas, funciones ≤ 50 líneas.
- **Naming**: variables y funciones en `camelCase`; componentes y clases en `PascalCase`; constantes en `UPPER_SNAKE_CASE`. Archivos de Next.js siguen la convención del framework (`page.tsx`, `layout.tsx`, `[slug]/page.tsx`).
- **Secretos**: nunca en código fuente. `.env.local` está gitignored; el template está en `.env.local.example`.

Reglas completas en `CLAUDE.md`.

---

## Sistema agéntico

El directorio `.claude/` contiene el sistema agéntico que opera sobre este proyecto.

- **Skills**: módulos instructivos cargados vía `@.claude/skills/<id>/SKILL.md`. Las **20 skills del catálogo se activan por defecto** en todo proyecto: la metodología completa (`brief`, `prp`, `bucle-agentico`, `praxis-master`), el mapeo graph-first del código (`graphify`), utilidades transversales (`praxis-init`, `skill-creator`, `impeccable`, `agent-browser`, `supabase-admin`, `auth-stack`, `infra-vps`, `verification-before-completion`) y las de dominio (`payments-polar`, `emails-transactional`, `ai-sdk-kit`, `pwa-mobile`, `image-kit`, `web-3d`, `playwright-cli`). Cualquiera se puede desactivar desde el panel de Praxis si un proyecto no la usa.
- **PRPs**: especificaciones ejecutables de features (Product Requirements Prompts, framework Wirasm). Cada PRP define objetivo, comportamiento, plan de implementación por fases, y crece con aprendizajes durante la ejecución. Lifecycle: `PENDIENTE → APROBADO → EN PROGRESO → COMPLETADO`.
- **Metodología recursiva**: `brief → prp → bucle-agentico` no son tres herramientas separadas, sino el mismo patrón ("Mapea. Planea solo este nivel. Ejecuta. Documenta. Propaga aprendizajes hacia arriba.") aplicado a tres escalas (proyecto / feature / subtarea). Los aprendizajes propagan hacia arriba al cerrar cada nivel: subtarea → PRP → brief → CLAUDE.md. La doctrina canónica vive en `@.claude/skills/bucle-agentico/SKILL.md`.

---

## Grafo de conocimiento del código

Este proyecto nace **graph-first**: viene con un **grafo de conocimiento del código** que vive en `.graphify/`. Es el mapa estructural del proyecto — funciones, componentes, tablas y conceptos, con sus relaciones, comunidades detectadas y los puntos más conectados del sistema. El agente lo consulta para **orientarse antes de tocar código** (`brief`, `prp`, `bucle-agentico` y `praxis-init` mapean el contexto sobre el grafo, no solo a fuerza de búsqueda), para medir qué afecta un cambio antes de hacerlo (blast-radius), y así trabajar sobre la realidad del código en vez de suposiciones.

- **Para qué sirve**: mapear la arquitectura, entender dependencias, y ver el radio de impacto de un cambio antes de aplicarlo. Menos contexto perdido, menos sorpresas.
- **Se mantiene solo**: el grafo **crece con el proyecto**. En un scaffold recién creado casi no hay código que mapear todavía; se construye y refresca a medida que el proyecto crece. La skill `@.claude/skills/graphify/SKILL.md` lo genera y actualiza (por debajo usa la herramienta `graphify`, que se instala sola la primera vez).
- **Cómo se regenera**: el agente lo actualiza tras cambios de código (incremental y barato). También puedes pedirle *"actualiza el grafo del proyecto"* en cualquier momento. `.graphify/graph.json` y `GRAPH_REPORT.md` viajan con el repo; los archivos temporales quedan fuera vía `.gitignore`.

---

## Comandos npm

```
npm run dev          # Dev server (Turbopack)
npm run build        # Build de producción
npm run lint         # ESLint
npx tsc --noEmit     # Type-check sin emitir
```

---

## Variables de entorno

Definidas en `.env.local.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Variables adicionales se agregan a `.env.local.example` cuando un PRP las introduce; el origen y el uso de cada nueva variable quedan documentados en el PRP correspondiente.

---

## MCPs activos por defecto

- `next-devtools` (stdio): errores de build y runtime en tiempo real.
- `playwright` (stdio): validación visual.

Otros MCPs del catálogo (Supabase, Stripe, Vercel, Sentry) se activan desde la extensión Praxis cuando el proyecto los requiere.

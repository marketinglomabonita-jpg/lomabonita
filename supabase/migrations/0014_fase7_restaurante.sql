-- Fase 7 — restaurante: carta, pedido en mesa y pantalla de cocina (KDS).
--
-- Tablas: menu_categories, menu_items, orders. RLS en TODAS, en la misma
-- migración (patrón de 0009/0011). El pedido tiene `items` como jsonb (array),
-- no tabla normalizada `order_items` — scope de v1 es operación, no analítica.
--
-- Del lado del comensal (anon): SOLO insert en orders, sin select/update/delete.
-- El estado se consulta por RPC `get_order_status(p_codigo text)` (security definer).
-- Realtime solo del lado staff: `/cocina` usa el cliente autenticado; el comensal
-- hace polling (cada ~4s) de `get_order_status` para evitar rabbit-hole de RLS.

-- ============================================================================
-- Categorías de carta
-- ============================================================================
create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  orden int not null default 0,
  is_sample boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.menu_categories enable row level security;

drop policy if exists "menu_categories: public read" on public.menu_categories;
create policy "menu_categories: public read"
  on public.menu_categories for select
  using (true);

drop policy if exists "menu_categories: staff all" on public.menu_categories;
create policy "menu_categories: staff all"
  on public.menu_categories for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================================
-- Ítems de carta (platos)
-- ============================================================================
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  slug text unique not null,
  nombre text not null,
  descripcion text,
  precio_muestra numeric(12,2) not null check (precio_muestra >= 0),
  disponible boolean not null default true,
  es_plato_del_dia boolean not null default false,
  is_sample boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;

drop policy if exists "menu_items: public read" on public.menu_items;
create policy "menu_items: public read"
  on public.menu_items for select
  using (true);

drop policy if exists "menu_items: staff all" on public.menu_items;
create policy "menu_items: staff all"
  on public.menu_items for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================================
-- Pedidos
-- ============================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,                  -- OR-XXXXXX
  mesa_numero int not null check (mesa_numero between 1 and 50),
  items jsonb not null,
  total numeric(12,2) not null check (total >= 0),
  estado text not null default 'recibido' check (estado in ('recibido','en_preparacion','listo','entregado','cancelado')),
  created_at timestamptz not null default now(),
  constraint orders_items_is_array check (jsonb_typeof(items) = 'array'),
  constraint orders_items_not_empty check (jsonb_array_length(items) > 0)
);

alter table public.orders enable row level security;

-- Anon SOLO insert, acotado. Cero select/update/delete para anon
-- (patrón reservations/tickets/corp_leads). El estado se consulta por RPC.
drop policy if exists "orders: anon insert" on public.orders;
create policy "orders: anon insert"
  on public.orders for insert
  to anon
  with check (
    estado = 'recibido'
    and mesa_numero between 1 and 50
    and total >= 0
    and jsonb_array_length(items) > 0
  );

drop policy if exists "orders: staff all" on public.orders;
create policy "orders: staff all"
  on public.orders for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================================
-- Consulta de estado de pedido para el comensal (RPC pública, security definer)
--
-- Anon no puede leer la tabla `orders`, pero SÍ necesita conocer el estado
-- del pedido que acaba de crear (polling cada ~4s). Esta RPC devuelve 0 filas
-- si el código no existe (no lanza error); el comensal muestra "no encontrado".
-- ============================================================================
create or replace function public.get_order_status(p_codigo text)
returns table(
  estado text,
  items jsonb,
  total numeric,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select o.estado, o.items, o.total, o.created_at
  from public.orders o
  where o.codigo = p_codigo;
end;
$$;

grant execute on function public.get_order_status(text) to anon, authenticated;

-- ============================================================================
-- Notificación por pedido recibido (tipo 'pedido')
--
-- Extiende el CHECK de notifications.tipo para admitir 'pedido' (decisión:
-- tipo propio, distinguible de 'reserva'/'pasadia'/'lead' en el panel; el
-- constraint existente se reemplaza de forma dinámica para no depender de su
-- nombre generado, patrón de 0009/0011).
-- ============================================================================
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.notifications'::regclass and contype = 'c'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
  end loop;

  alter table public.notifications
    add constraint notifications_tipo_check
    check (tipo in ('reserva','pasadia','lead','pedido','sistema'));
end $$;

create or replace function public.notify_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (tipo, titulo, cuerpo, ref_table, ref_id)
  values (
    'pedido',
    'Nuevo pedido ' || new.codigo,
    'Mesa ' || new.mesa_numero || ' · ' || jsonb_array_length(new.items) || ' ítem(s) · $' || round(new.total, 0),
    'orders',
    new.id
  );
  return new;
end;
$$;

drop trigger if exists on_order_created on public.orders;
create trigger on_order_created
  after insert on public.orders
  for each row
  execute function public.notify_new_order();

-- ============================================================================
-- Realtime
-- ============================================================================
alter publication supabase_realtime add table public.orders;

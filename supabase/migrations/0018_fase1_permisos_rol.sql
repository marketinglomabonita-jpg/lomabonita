-- Fase 1B — Permisos por rol (gerente, comercial) + perfiles nuevos inactivos.
--
-- (a) is_staff() pasa a incluir gerente y comercial (agregados al enum en 0017).
--     Redefinir la función actualiza en bloque todas las policies que la usan
--     (0004, 0006-0009, 0011, 0014, 0017) sin tocarlas.
-- (b) can_see_money(): visión de dinero/métricas — owner, admin, gerente.
-- (c) can_manage_users(): gestión de usuarios — owner, admin, gerente.
-- (d) handle_new_user(): el perfil nuevo nace inactivo — defensa en profundidad:
--     sin acceso hasta que un administrador lo active y le asigne rol.
--     Solo afecta a usuarios creados después de aplicarse esta migración.
--
-- Las tres funciones de consulta son security definer con search_path fijo:
-- bypasean RLS y evitan la recursión (mismo patrón que 0004).

-- (a) Staff: los 7 roles del equipo
create or replace function public.is_staff()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('owner','admin','gerente','comercial','recepcion','cocina','anfitrion')
      and activo
  );
end $$;

-- (b) Visión de dinero/métricas
create or replace function public.can_see_money()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('owner','admin','gerente')
      and activo
  );
end $$;

-- (c) Gestión de usuarios
create or replace function public.can_manage_users()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('owner','admin','gerente')
      and activo
  );
end $$;

-- (d) Alta automática de fila al crear el usuario en auth: nace inactivo
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, activo)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), false)
  on conflict (id) do nothing;
  return new;
end $$;

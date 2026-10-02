-- Fase 1B — Endurecer RLS de profiles: separar lectura de escritura.
--
-- Antes: "profiles: admin all" (FOR ALL con is_staff()) dejaba que CUALQUIER
-- miembro del staff (incluido comercial/recepcion) leyera y ESCRIBIERA cualquier
-- perfil por la vía del API autenticado — la separación de roles quedaba solo en la UI.
--
-- Ahora: todo el staff puede LEER el equipo (para verlo en el panel), pero solo
-- quien gestiona usuarios (owner/admin/gerente, vía can_manage_users()) puede
-- INSERTAR/ACTUALIZAR/BORRAR perfiles. La creación automática la hace el trigger
-- handle_new_user (security definer, bypasea RLS) y el panel escribe con service-role.

drop policy if exists "profiles: admin all" on public.profiles;

-- Lectura: cada quien su fila (ya existe "profiles: self read") + el staff ve a todo el equipo.
drop policy if exists "profiles: staff read" on public.profiles;
create policy "profiles: staff read"
  on public.profiles for select
  to authenticated
  using (public.is_staff());

-- Escritura: solo gestores de usuarios.
drop policy if exists "profiles: managers insert" on public.profiles;
create policy "profiles: managers insert"
  on public.profiles for insert
  to authenticated
  with check (public.can_manage_users());

drop policy if exists "profiles: managers update" on public.profiles;
create policy "profiles: managers update"
  on public.profiles for update
  to authenticated
  using (public.can_manage_users())
  with check (public.can_manage_users());

drop policy if exists "profiles: managers delete" on public.profiles;
create policy "profiles: managers delete"
  on public.profiles for delete
  to authenticated
  using (public.can_manage_users());

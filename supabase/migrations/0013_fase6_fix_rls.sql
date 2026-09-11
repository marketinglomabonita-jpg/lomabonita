-- Fase 6 — ajuste de RLS: permitir inserción de leads tanto anon como authenticated.
--
-- La policy original solo permitía anon, pero las Server Actions usan el cliente
-- con cookies, así que los usuarios autenticados (ej. al probar con sesión de staff)
-- también deben poder enviar solicitudes.

drop policy if exists "corp_leads: anon insert" on public.corp_leads;

create policy "corp_leads: public insert"
  on public.corp_leads for insert
  to anon, authenticated
  with check (
    estado = 'nuevo'
    and personas > 0
    and email ~* '^[^@]+@[^@]+\.[^@]+$'
  );

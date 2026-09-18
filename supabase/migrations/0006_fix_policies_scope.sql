-- Fix: las policies de staff deben aplicar solo a roles authenticated, no a todos.
-- Esto evita que interfieran con las policies de anon.

drop policy if exists "reservations: staff all" on public.reservations;
create policy "reservations: staff all"
  on public.reservations for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

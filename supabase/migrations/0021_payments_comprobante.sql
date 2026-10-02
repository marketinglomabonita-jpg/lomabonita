-- R3.1 del panel — soporte de comprobante de pago en los abonos.
--
-- Guarda la RUTA del archivo en el bucket privado 'comprobantes' (no el archivo).
-- El bucket es privado: se crea aparte (Storage API) y el acceso va por server
-- actions con service-role, que generan URLs firmadas para verlo. Nadie público
-- lee los comprobantes (son documentos financieros).
alter table public.payments
  add column if not exists comprobante_path text;

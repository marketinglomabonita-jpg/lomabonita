-- Fase 4: Notificaciones del panel
--
-- Tabla notifications: notifica al staff de eventos transaccionales (reservas, leads, pedidos)
-- con suscripción Realtime opcional. Solo acceso para staff autenticado.

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('reserva','lead','pedido','sistema')),
  titulo TEXT NOT NULL,
  cuerpo TEXT,
  ref_table TEXT,
  ref_id UUID,
  leida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS obligatoria
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: staff puede leer todas las notificaciones
CREATE POLICY "Staff can select notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

-- Policy: staff puede marcar como leída (update)
CREATE POLICY "Staff can update notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Trigger: notificar nueva reserva
CREATE OR REPLACE FUNCTION public.notify_new_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (tipo, titulo, cuerpo, ref_table, ref_id)
  VALUES (
    'reserva',
    'Nueva solicitud de reserva ' || NEW.codigo,
    NEW.nombre || ' · ' || NEW.during::text,
    'reservations',
    NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_reservation_created ON public.reservations;
CREATE TRIGGER on_reservation_created
  AFTER INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_reservation();

-- Añadir a la publicación de Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

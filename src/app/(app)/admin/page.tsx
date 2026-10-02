import { redirect } from 'next/navigation'

/**
 * La vista principal del panel es ahora el calendario (`/admin/calendario`).
 * El bloque de notificaciones que vivía aquí quedó en el historial de git;
 * se puede reubicar en una sección propia cuando se necesite.
 */
export default function AdminHomePage() {
  redirect('/admin/calendario')
}

import { BUSINESS } from '@/core/config/site'

/** "+573102913182" -> "310 291 3182" */
export function formatPhone(phone: string): string {
  const local = phone.replace(/^\+?57/, '')
  if (local.length !== 10) return phone
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
}

/** Enlace de WhatsApp al numero oficial del negocio, con mensaje precargado. */
export function waLink(message: string): string {
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`
}

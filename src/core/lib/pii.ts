/**
 * Enmascarado de datos personales para las páginas públicas de confirmación
 * (`/reserva/[codigo]`, `/pasadia/[codigo]`). Esas páginas se abren con el
 * código secreto de la reserva/ticket; el enmascarado es defensa en
 * profundidad: si el enlace o una captura se comparten, el correo y el
 * teléfono completos del cliente no quedan expuestos (Habeas Data, Ley 1581).
 */

/** `juan.perez@gmail.com` → `j•••@gmail.com`. Vacío/nulo → ''. */
export function enmascararEmail(email: string | null | undefined): string {
  if (!email) return ''
  const idx = email.lastIndexOf('@')
  if (idx <= 0) return '•••'
  const usuario = email.slice(0, idx)
  const dominio = email.slice(idx + 1)
  const oculto = '•'.repeat(Math.max(usuario.length - 1, 3))
  return `${usuario[0]}${oculto}@${dominio}`
}

/** `3102913182` → `•••••••182` (deja los últimos 3). Vacío/nulo → ''. */
export function enmascararTelefono(telefono: string | null | undefined): string {
  if (!telefono) return ''
  const limpio = telefono.replace(/\s+/g, '')
  if (limpio.length <= 3) return '•'.repeat(limpio.length)
  return `${'•'.repeat(limpio.length - 3)}${limpio.slice(-3)}`
}

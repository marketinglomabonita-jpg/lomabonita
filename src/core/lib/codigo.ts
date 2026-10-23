import { randomInt } from 'node:crypto'

/**
 * Alfabeto de 32 símbolos sin caracteres ambiguos (sin 0/O ni 1/I): fácil de
 * dictar y transcribir sin confusiones.
 */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Largo por defecto del sufijo aleatorio. 32^10 ≈ 1.1 × 10^15 combinaciones. */
const LONGITUD_DEFECTO = 10

/**
 * Genera un código público CRIPTO-SEGURO del tipo `PREFIJO-XXXXXXXXXX`.
 *
 * Usa `randomInt` (CSPRNG del sistema), no `Math.random`. Las páginas públicas
 * `/reserva/[codigo]` y `/pasadia/[codigo]` leen por código saltándose RLS y
 * muestran datos del cliente, así que el código ES el secreto que los protege:
 * con 10 caracteres sobre 32 símbolos el espacio (≈ 10^15) hace inviable
 * adivinarlo o enumerarlo. `Math.random` NO sirve aquí: es predecible.
 *
 * Solo para runtime Node (server actions / server components), no Edge.
 */
export function generarCodigoSeguro(prefijo: string, longitud: number = LONGITUD_DEFECTO): string {
  let sufijo = ''
  for (let i = 0; i < longitud; i++) {
    sufijo += ALFABETO[randomInt(ALFABETO.length)]
  }
  return `${prefijo}-${sufijo}`
}

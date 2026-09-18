import { z } from 'zod'

/**
 * Consentimiento de cookies (Fase 8): la preferencia vive en localStorage del
 * navegador (no en Supabase). Los cambios notifican un evento para que el banner
 * (useSyncExternalStore) reaccione sin effects.
 */
const STORAGE_KEY = 'lb-cookie-consent'

/** Evento despachado en cada escritura/borrado de la preferencia. */
export const CONSENT_CHANGE_EVENT = 'lb-cookie-consent-change'

const consentSchema = z.object({
  accepted: z.boolean(),
  timestamp: z.string(),
})

export type CookieConsent = z.infer<typeof consentSchema>

/** Clave de localStorage donde vive la preferencia (lectura reactiva del banner). */
export function consentStorageKey(): string {
  return STORAGE_KEY
}

/** Preferencia guardada, o null si no existe o es ilegible (navegacion privada, etc). */
export function readCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    const result = consentSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

/**
 * Cualquier script NO esencial (analitica, marketing, pixeles) debe consultar
 * esta funcion ANTES de cargarse. Devuelve true solo con aceptacion expresa.
 */
export function hasCookieConsent(): boolean {
  return readCookieConsent()?.accepted === true
}

export function saveCookieConsent(accepted: boolean): void {
  if (typeof window === 'undefined') return
  try {
    const value: CookieConsent = { accepted, timestamp: new Date().toISOString() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // localStorage puede lanzar en navegacion privada: la preferencia no persiste
    // y el banner seguira mostrandose, que es el comportamiento seguro.
    return
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT))
}

/** Borra la preferencia para que el banner vuelva a mostrarse. */
export function resetCookieConsent(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    return
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT))
}

/** Pide reabrir el banner (usado desde la politica de cookies). */
export function requestConsentBanner(): void {
  resetCookieConsent()
}

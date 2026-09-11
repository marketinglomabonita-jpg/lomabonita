'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Button } from '@/core/ui/button'
import {
  CONSENT_CHANGE_EVENT,
  consentStorageKey,
  saveCookieConsent,
} from '../lib/cookie-consent'

/** Sentinel del server snapshot: nunca es null ni un valor real de localStorage. */
const SERVER_SNAPSHOT = 'ssr'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(CONSENT_CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CONSENT_CHANGE_EVENT, callback)
  }
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(consentStorageKey())
  } catch {
    return null
  }
}

/**
 * Banner de consentimiento de cookies (Fase 8). Opt-in real: visible solo
 * mientras no exista preferencia guardada en localStorage; recuerda la eleccion
 * (recargas y visitas futuras) y se puede reabrir desde /legal/cookies.
 * Ningun script no esencial debe cargarse sin que hasCookieConsent() sea true.
 */
export function CookieConsent() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT)

  if (stored !== null) return null

  const choose = (accepted: boolean) => {
    saveCookieConsent(accepted)
  }

  return (
    <div role="dialog" aria-label="Consentimiento de cookies" className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-4 shadow-lg shadow-black/25 sm:p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Usamos almacenamiento esencial para que el sitio funcione y, <strong>solo con tu
          autorización</strong>, cookies de analítica para mejorarlo. Lee nuestra{' '}
          <Link
            href="/legal/cookies"
            className="font-medium text-secondary underline underline-offset-2 hover:text-primary"
          >
            Política de Cookies
          </Link>{' '}
          para decidir.
        </p>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => choose(false)}>
            Rechazar
          </Button>
          <Button size="sm" onClick={() => choose(true)}>
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { Button } from '@/core/ui/button'
import { requestConsentBanner } from '@/features/marketing/lib/cookie-consent'

/** Reabre el banner de cookies para revisar la preferencia (pagina /legal/cookies). */
export function CookiePreferencesButton() {
  return (
    <Button variant="secondary" size="sm" className="mt-4" onClick={requestConsentBanner}>
      Revisar mis preferencias de cookies
    </Button>
  )
}

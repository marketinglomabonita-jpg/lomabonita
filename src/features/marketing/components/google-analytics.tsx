'use client'

import { useSyncExternalStore } from 'react'
import Script from 'next/script'
import { CONSENT_CHANGE_EVENT, hasCookieConsent } from '../lib/cookie-consent'

const MEASUREMENT_ID = 'G-E1Y83JMXDF'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(CONSENT_CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CONSENT_CHANGE_EVENT, callback)
  }
}

function getSnapshot(): boolean {
  return hasCookieConsent()
}

/** Carga GA4 exclusivamente despues de una aceptacion expresa de cookies. */
export function GoogleAnalytics() {
  const hasConsent = useSyncExternalStore(subscribe, getSnapshot, () => false)

  if (!hasConsent) return null

  return (
    <>
      <Script
        id="google-analytics"
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${MEASUREMENT_ID}');
        `}
      </Script>
    </>
  )
}

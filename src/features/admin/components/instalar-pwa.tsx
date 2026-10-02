'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Download, Share, X } from 'lucide-react'
import { Button } from '@/core/ui/button'

/** Evento no estándar (Chrome/Edge Android): expone prompt() para instalar. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function esStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

/** iOS nunca dispara beforeinstallprompt: se instala desde Compartir. */
function esIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform))
  )
}

const suscribirNada = () => () => {}

/** Re-lectura cuando el display-mode cambia (p. ej. tras instalar desde el menú). */
function suscribirStandalone(notificar: () => void) {
  const mq = window.matchMedia('(display-mode: standalone)')
  mq.addEventListener('change', notificar)
  return () => mq.removeEventListener('change', notificar)
}

/**
 * Ayuda de instalación de la PWA del panel + registro de su service worker.
 * Vive SOLO en el layout del panel: fuera de /admin nada registra el SW.
 * El estado del navegador (standalone/iOS/prompt) se lee con
 * useSyncExternalStore para no sincronizar setState dentro de efectos.
 */
export function InstalarPwa() {
  const standalone = useSyncExternalStore(suscribirStandalone, esStandalone, () => false)
  const ios = useSyncExternalStore(suscribirNada, esIOS, () => false)
  const [deferido, setDeferido] = useState<BeforeInstallPromptEvent | null>(null)
  const [descartada, setDescartada] = useState(false)

  useEffect(() => {
    // SW de la PWA del panel (scope /admin). Re-registrar siendo standalone
    // es un no-op y asegura su presencia tras actualizaciones.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/admin' })
        .catch((err: unknown) =>
          console.warn('[panel] no se pudo registrar el service worker:', err),
        )
    }

    const alPreguntar = (e: Event) => {
      e.preventDefault()
      setDeferido(e as BeforeInstallPromptEvent)
    }
    const alInstalar = () => {
      setDeferido(null)
      setDescartada(true)
    }
    window.addEventListener('beforeinstallprompt', alPreguntar)
    window.addEventListener('appinstalled', alInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', alPreguntar)
      window.removeEventListener('appinstalled', alInstalar)
    }
  }, [])

  async function instalar() {
    if (!deferido) return
    await deferido.prompt()
    const { outcome } = await deferido.userChoice
    setDeferido(null)
    if (outcome === 'accepted') setDescartada(true)
  }

  // Ya instalada (o ayuda cerrada): no estorbar.
  if (standalone || descartada) return null

  return (
    <div className="fixed bottom-4 right-4 z-30 max-w-[calc(100vw-2rem)]">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3 pl-4 shadow-lg">
        {deferido ? (
          <Button size="sm" onClick={() => void instalar()}>
            <Download aria-hidden="true" />
            Instalar app
          </Button>
        ) : ios ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Share className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              En iPhone:{' '}
              <strong className="font-medium text-foreground">
                Compartir → Añadir a pantalla de inicio
              </strong>
            </span>
          </p>
        ) : (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Download className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Para instalarla: menú del navegador →{' '}
              <strong className="font-medium text-foreground">Instalar app</strong>
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={() => setDescartada(true)}
          aria-label="Cerrar ayuda de instalación"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

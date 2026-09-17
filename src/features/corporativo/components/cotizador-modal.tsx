'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/core/ui/dialog'
import { WizardCorporativo } from './wizard-corporativo'

type AbrirOpts = { tipo?: string; paso?: number }

type CotizadorContextValue = {
  abrir: (opts?: AbrirOpts) => void
}

const CotizadorContext = createContext<CotizadorContextValue | null>(null)

export function useCotizador(): CotizadorContextValue {
  const ctx = useContext(CotizadorContext)
  if (!ctx) {
    throw new Error('useCotizador debe usarse dentro de <CotizadorProvider>')
  }
  return ctx
}

/**
 * Provee el cotizador corporativo como ventana emergente (modal).
 *
 * El wizard vive dentro de un Dialog de Radix (foco atrapado, cierre con Escape,
 * bloqueo de scroll del fondo). Los botones "Cotizar"/"ARMA TU EXPERIENCIA"
 * abren el modal sin navegar ni mover la página. Antes esto se hacía con
 * `href="...#wizard"` (saltaba a la sección) + `window.scrollTo` al cambiar de
 * paso (movía el fondo). Ambos eliminados: el modal es una capa fija.
 *
 * El estado del modal vive aquí (cliente); la página sigue siendo Server Component.
 */
export function CotizadorProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  // `nonce` fuerza un remount del wizard en cada apertura para reiniciar su estado
  // con el tipo/paso correctos (p. ej. "Cotizar" entra al paso 02 con el tipo fijado).
  const [config, setConfig] = useState({ tipo: '', paso: 1, nonce: 0 })

  const abrir = useCallback((opts?: AbrirOpts) => {
    setConfig((c) => ({ tipo: opts?.tipo ?? '', paso: opts?.paso ?? 1, nonce: c.nonce + 1 }))
    setOpen(true)
  }, [])

  // Enlace compartible: `?tipo=<slug>` sigue funcionando; ahora abre el modal
  // directo en el paso 02 con ese tipo elegido (antes dejaba al usuario en el paso 01).
  // La apertura se difiere a después del primer paint: evita abrir durante la
  // hidratación y no dispara renders en cascada dentro del efecto.
  useEffect(() => {
    const tipo = new URLSearchParams(window.location.search).get('tipo')
    if (!tipo) return
    const raf = requestAnimationFrame(() => abrir({ tipo, paso: 2 }))
    return () => cancelAnimationFrame(raf)
  }, [abrir])

  return (
    <CotizadorContext.Provider value={{ abrir }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-modal-scroll
          className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto p-5 sm:p-6"
        >
          <DialogTitle className="sr-only">Arma tu experiencia corporativa</DialogTitle>
          {open && (
            <WizardCorporativo
              key={config.nonce}
              initialTipo={config.tipo}
              initialPaso={config.paso}
              onClose={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </CotizadorContext.Provider>
  )
}

/**
 * Botón que abre el cotizador en modal. Reemplaza a los `<Link href="#wizard">`.
 * Conserva las clases visuales del enlace original que reciba por `className`.
 */
export function AbrirCotizadorButton({
  tipo,
  paso,
  className,
  children,
}: {
  tipo?: string
  paso?: number
  className?: string
  children: React.ReactNode
}) {
  const { abrir } = useCotizador()
  return (
    <button type="button" className={className} onClick={() => abrir({ tipo, paso })}>
      {children}
    </button>
  )
}

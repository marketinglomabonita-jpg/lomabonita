'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  BedDouble,
  Briefcase,
  CalendarDays,
  Contact,
  LayoutDashboard,
  Menu,
  Sparkles,
  Sun,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type SeccionPanel = { href: string; label: string; activa: boolean }

const ICONOS: Record<string, LucideIcon> = {
  '/admin/calendario': CalendarDays,
  '/admin/resumen': LayoutDashboard,
  '/admin/hospedaje': BedDouble,
  '/admin/restaurante': UtensilsCrossed,
  '/admin/pasadias': Sun,
  '/admin/experiencias': Sparkles,
  '/admin/leads': Briefcase,
  '/admin/usuarios': Users,
  '/admin/clientes': Contact,
}

/**
 * Shell de navegación del panel: barra lateral estática en escritorio y menú
 * hamburguesa (drawer lateral + overlay) en móvil. Calendario llega primero
 * desde SECCIONES y la sección de la ruta actual queda resaltada vía
 * usePathname (aria-current="page").
 */
export function PanelNav({
  secciones,
  email,
  children,
}: {
  secciones: SeccionPanel[]
  email: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [abierta, setAbierta] = useState(false)
  const botonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLElement>(null)

  // Elegir una sección navega: cada enlace cierra el menú en su onClick.
  // Atrás/adelante del navegador también cierra (popstate).

  // Escape cierra el drawer y devuelve el foco al botón que lo abrió.
  useEffect(() => {
    if (!abierta) return
    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierta(false)
        botonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', alPulsarTecla)
    return () => window.removeEventListener('keydown', alPulsarTecla)
  }, [abierta])

  // Navegación atrás/adelante con el menú abierto: se cierra.
  useEffect(() => {
    const alVolver = () => setAbierta(false)
    window.addEventListener('popstate', alVolver)
    return () => window.removeEventListener('popstate', alVolver)
  }, [])

  // Al abrir: foco dentro del menú y scroll del fondo bloqueado.
  useEffect(() => {
    if (abierta) menuRef.current?.focus()
    document.body.style.overflow = abierta ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [abierta])

  const cerrarMenu = () => {
    setAbierta(false)
    botonRef.current?.focus()
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="container flex h-14 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1">
            <button
              ref={botonRef}
              type="button"
              onClick={() => setAbierta((v) => !v)}
              aria-label={abierta ? 'Cerrar menú de secciones' : 'Abrir menú de secciones'}
              aria-expanded={abierta}
              aria-controls="panel-nav-secciones"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
              {abierta ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <span className="truncate font-display font-semibold text-primary">
              Loma Bonita · Panel
            </span>
          </div>
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        </div>
      </header>

      {/* Overlay que bloquea el fondo mientras el drawer móvil está abierto */}
      {abierta && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={cerrarMenu}
          aria-hidden="true"
        />
      )}

      <div className="container grid gap-6 py-6 md:grid-cols-[200px_1fr]">
        {/* Móvil: drawer deslizante. Escritorio: columna lateral estática. */}
        <nav
          id="panel-nav-secciones"
          ref={menuRef}
          tabIndex={-1}
          aria-label="Secciones del panel"
          className={[
            'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] -translate-x-full flex-col gap-1 overflow-y-auto border-r bg-card p-4 text-sm transition-transform duration-200 ease-in-out focus-visible:outline-none',
            abierta ? 'translate-x-0' : '',
            'md:static md:z-auto md:w-auto md:max-w-none md:translate-x-0 md:overflow-visible md:border-0 md:p-0 md:transition-none',
          ].join(' ')}
        >
          <div className="mb-3 flex items-center justify-between md:hidden">
            <span className="px-1 font-display font-semibold text-primary">Secciones</span>
            <button
              type="button"
              onClick={cerrarMenu}
              aria-label="Cerrar menú de secciones"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {secciones.map((s) => {
            const Icona = ICONOS[s.href]
            const base = 'flex items-center gap-2.5 rounded-md px-3 py-2'

            if (!s.activa) {
              return (
                <span
                  key={s.href}
                  aria-disabled="true"
                  className={`${base} pointer-events-none text-muted-foreground/60`}
                >
                  {Icona && <Icona className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  {s.label}
                  <span className="ml-auto text-[10px]">· próximamente</span>
                </span>
              )
            }

            const enRutaActiva = pathname === s.href || pathname.startsWith(`${s.href}/`)
            return (
              <Link
                key={s.href}
                href={s.href}
                onClick={() => setAbierta(false)}
                aria-current={enRutaActiva ? 'page' : undefined}
                className={
                  enRutaActiva
                    ? `${base} bg-primary/10 font-medium text-primary`
                    : `${base} hover:bg-muted`
                }
              >
                {Icona && <Icona className="h-4 w-4 shrink-0" aria-hidden="true" />}
                {s.label}
              </Link>
            )
          })}
        </nav>

        <main>{children}</main>
      </div>
    </>
  )
}

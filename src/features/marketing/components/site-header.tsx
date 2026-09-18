'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, Phone, X } from 'lucide-react'
import { BUSINESS } from '@/core/config/site'
import { formatPhone } from '@/core/lib/contact'
import { IMAGES } from '@/core/lib/images'
import { cn } from '@/core/lib/utils'
import { buttonVariants } from '@/core/ui/button'
import { NAV_LINKS } from '../data/nav'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState(pathname)

  // Cierra el menu movil al cambiar de ruta (ajuste durante render, sin efecto).
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-primary text-primary-foreground">
        <div className="container flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1.5 text-xs">
          <p className="hidden sm:block">
            ¡Tu escape perfecto en el Eje Cafetero! · Pasadía y Hospedaje
          </p>
          <div className="flex items-center gap-4 sm:ml-auto">
            {BUSINESS.phones.map((phone) => (
              <a
                key={phone}
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1.5 hover:underline"
              >
                <Phone className="size-3.5" aria-hidden="true" />
                {formatPhone(phone)}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5"
            aria-label={`${BUSINESS.legalName} — Inicio`}
          >
            <Image
              src={IMAGES['logo-finca-loma-bonita'].src}
              alt={`Logo de ${BUSINESS.legalName}`}
              width={56}
              height={56}
              sizes="56px"
              className="h-14 w-auto"
            />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="font-display text-lg font-semibold text-primary">
                Loma Bonita
              </span>
              <span className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                Finca Hotel · Eje Cafetero
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary',
                  pathname === link.href ? 'text-primary' : 'text-foreground/80',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/contacto"
              className={cn(buttonVariants({ variant: 'accent', size: 'sm' }), 'hidden sm:inline-flex')}
            >
              Reservar
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              className="inline-flex size-11 items-center justify-center rounded-md hover:bg-muted lg:hidden"
            >
              {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {open && (
          <nav
            id="mobile-nav"
            className="border-t border-border bg-background lg:hidden"
            aria-label="Navegación móvil"
          >
            <div className="container flex flex-col gap-1 py-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-md px-3 py-2.5 text-base font-medium',
                    pathname === link.href ? 'bg-muted text-primary' : 'text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/contacto"
                className={cn(buttonVariants({ variant: 'accent' }), 'mt-2')}
              >
                Reservar ahora
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

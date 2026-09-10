import Link from 'next/link'
import { BUSINESS } from '@/core/config/site'
import { buttonVariants } from '@/core/ui/button'
import { cn } from '@/core/lib/utils'

/**
 * Home provisional (Fase 0). La Home real —rediseño Eje Cafetero, hero, servicios,
 * galería, SEO— se construye en la Fase 1. Esto solo confirma que la app corre y
 * que la navegación llega a cada sección.
 */
const SECCIONES = [
  { href: '/hospedaje', label: 'Hospedaje' },
  { href: '/restaurante', label: 'Restaurante' },
  { href: '/pasadias', label: 'Pasadías' },
  { href: '/experiencias', label: 'Experiencias' },
  { href: '/experiencias-corporativas', label: 'Experiencias corporativas' },
  { href: '/galeria', label: 'Galería' },
  { href: '/contacto', label: 'Contacto' },
]

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="font-display text-sm uppercase tracking-widest text-accent">
          {BUSINESS.slogan}
        </p>
        <h1 className="text-4xl font-semibold text-primary sm:text-5xl">{BUSINESS.legalName}</h1>
        <p className="text-muted-foreground">
          Plataforma en construcción · vista previa privada. Piedras de Moler, Vía Alcalá — Cartago,
          Eje Cafetero.
        </p>
      </header>

      <nav className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={cn(buttonVariants({ variant: 'outline' }), 'h-auto py-3')}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      <p className="text-xs text-muted-foreground">
        Área de administración en{' '}
        <Link href="/admin" className="underline">
          /admin
        </Link>
        .
      </p>
    </main>
  )
}

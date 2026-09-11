import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/core/adapters/supabase/server'

export const metadata: Metadata = {
  title: 'Panel · Loma Bonita',
  robots: 'noindex',
}

/**
 * Shell del panel unificado. Defensa en profundidad: el middleware ya redirige a
 * /login sin sesión; aquí se revalida y (desde Fase 4) se comprueba el rol de staff
 * contra `profiles`.
 */
const SECCIONES = [
  { href: '/admin', label: 'Resumen', activa: true },
  { href: '/admin/hospedaje', label: 'Hospedaje', activa: true },
  { href: '/admin/restaurante', label: 'Restaurante', activa: true },
  { href: '/admin/pasadias', label: 'Pasadías', activa: true },
  { href: '/admin/experiencias', label: 'Experiencias', activa: false },
  { href: '/admin/leads', label: 'Leads corporativos', activa: true },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin')

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <span className="font-display font-semibold text-primary">Loma Bonita · Panel</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      </header>
      <div className="container grid gap-6 py-6 md:grid-cols-[200px_1fr]">
        <nav className="flex flex-col gap-1 text-sm">
          {SECCIONES.map((s) => (
            <Link
              key={s.href}
              href={s.activa ? s.href : '#'}
              aria-disabled={!s.activa}
              className={
                s.activa
                  ? 'rounded-md px-3 py-2 hover:bg-muted'
                  : 'pointer-events-none rounded-md px-3 py-2 text-muted-foreground/60'
              }
            >
              {s.label}
              {!s.activa && <span className="ml-1 text-[10px]">· próximamente</span>}
            </Link>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  )
}

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/core/adapters/supabase/server'
import { LoginForm } from '@/features/admin/components/login-form'

export const metadata: Metadata = {
  title: 'Acceso al panel',
  robots: { index: false, follow: false },
}

/** Destino seguro tras el login: solo rutas internas del panel (evita open-redirect). */
function destinoSeguro(next: string | string[] | undefined): string {
  const valor = Array.isArray(next) ? next[0] : next
  return valor && valor.startsWith('/admin') ? valor : '/admin/calendario'
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  // Si ya hay sesión (p. ej. al reabrir la app instalada que arranca por el
  // slug → /login), no mostrar el formulario: ir directo al panel.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect(destinoSeguro((await searchParams).next))

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-primary">Acceso al panel</h1>
        <p className="text-sm text-muted-foreground">
          Solo para el equipo de Loma Bonita. Te enviamos un código de 6 dígitos al correo.
        </p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}

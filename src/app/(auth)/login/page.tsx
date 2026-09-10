import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LoginForm } from '@/features/admin/components/login-form'

export const metadata: Metadata = {
  title: 'Acceso al panel',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
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

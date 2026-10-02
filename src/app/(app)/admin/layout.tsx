import { redirect } from 'next/navigation'
import type { Metadata, Viewport } from 'next'
import { createClient } from '@/core/adapters/supabase/server'
import { PanelNav } from '@/features/admin/components/panel-nav'
import { InstalarPwa } from '@/features/admin/components/instalar-pwa'

export const metadata: Metadata = {
  title: 'Panel · Loma Bonita',
  robots: 'noindex',
  // El <link rel="manifest"> se renderiza manualmente abajo con
  // crossOrigin="use-credentials" para que el fetch del manifest LLEVE la cookie
  // de acceso (así el manifest puede personalizar el start_url al slug secreto).
  // Por eso NO se declara `manifest` aquí (emitiría un link sin credenciales).
  appleWebApp: {
    capable: true,
    title: 'LB Panel',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#1f5138',
}

/**
 * Shell del panel unificado. Defensa en profundidad: el middleware ya redirige a
 * /login sin sesión; aquí se revalida y (desde Fase 4) se comprueba el rol de staff
 * contra `profiles`.
 */
const SECCIONES = [
  { href: '/admin/calendario', label: 'Calendario', activa: true },
  { href: '/admin/resumen', label: 'Resumen', activa: true },
  { href: '/admin/reportes', label: 'Reportes', activa: true },
  { href: '/admin/hospedaje', label: 'Hospedaje', activa: true },
  { href: '/admin/restaurante', label: 'Restaurante', activa: true },
  { href: '/admin/pasadias', label: 'Pasadías', activa: true },
  { href: '/admin/experiencias', label: 'Experiencias', activa: false },
  { href: '/admin/leads', label: 'Leads corporativos', activa: true },
  { href: '/admin/usuarios', label: 'Usuarios', activa: true },
  { href: '/admin/clientes', label: 'Clientes', activa: true },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin')

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Manifest con credenciales: el fetch lleva la cookie de acceso, así el
          manifest puede fijar el start_url a la dirección secreta. React 19
          sube este <link> al <head>. */}
      <link rel="manifest" href="/panel.webmanifest" crossOrigin="use-credentials" />
      {/* Registro del SW del panel + ayuda discreta de instalación (solo aquí) */}
      <InstalarPwa />
      <PanelNav secciones={SECCIONES} email={user.email ?? ''}>
        {children}
      </PanelNav>
    </div>
  )
}

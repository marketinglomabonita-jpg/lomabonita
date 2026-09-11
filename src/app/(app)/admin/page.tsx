import Link from 'next/link'
import { Bell, Hotel, UtensilsCrossed, Calendar, Briefcase, Users } from 'lucide-react'
import {
  listNotifications,
  countUnreadNotifications,
} from '@/features/hospedaje/api/admin-actions'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const SECCIONES = [
  { href: '/admin/hospedaje', label: 'Hospedaje', icon: Hotel, activa: true },
  { href: '/admin/restaurante', label: 'Restaurante', icon: UtensilsCrossed, activa: false },
  { href: '/admin/pasadias', label: 'Pasadías', icon: Calendar, activa: false },
  { href: '/admin/experiencias', label: 'Experiencias', icon: Briefcase, activa: false },
  { href: '/admin/leads', label: 'Leads corporativos', icon: Users, activa: false },
]

export default async function AdminHomePage() {
  const [notifications, unreadCount] = await Promise.all([
    listNotifications(10),
    countUnreadNotifications(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Panel de administración</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenido al panel unificado de Loma Bonita
        </p>
      </div>

      {/* Notificaciones recientes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium">Notificaciones recientes</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            No hay notificaciones todavía
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                className={`rounded-lg border bg-card p-4 ${!notif.leida ? 'border-primary/50' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notif.titulo}</p>
                    {notif.cuerpo && (
                      <p className="text-xs text-muted-foreground mt-1">{notif.cuerpo}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notif.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                  {!notif.leida && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acceso rápido a secciones */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Acceso rápido</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SECCIONES.map((seccion) => {
            const Icon = seccion.icon
            return (
              <Link
                key={seccion.href}
                href={seccion.activa ? seccion.href : '#'}
                className={`flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors ${
                  seccion.activa
                    ? 'hover:bg-muted cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
                aria-disabled={!seccion.activa}
              >
                <Icon className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{seccion.label}</p>
                  {!seccion.activa && (
                    <p className="text-xs text-muted-foreground">Próximamente</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950">
        <p className="font-medium text-amber-900 dark:text-amber-100">
          💡 Datos de ejemplo
        </p>
        <p className="text-amber-700 dark:text-amber-300 mt-1">
          Las habitaciones, tarifas y reservas actuales son ficticias. Se reemplazarán con
          datos reales después de la presentación al propietario.
        </p>
      </div>
    </div>
  )
}

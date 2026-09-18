import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import QRCode from 'qrcode'
import { Calendar, CheckCircle2, Ticket as TicketIcon, Users } from 'lucide-react'
import { createAdminClient } from '@/core/adapters/supabase/admin'
import { SITE_ORIGIN } from '@/core/config/site'
import { IMAGES } from '@/core/lib/images'
import { buildPageMetadata } from '@/core/lib/seo'
import { buttonVariants } from '@/core/ui/button'
import { formatCOP } from '@/features/pasadias/lib/format'
import type { Experience, Ticket } from '@/features/pasadias/contracts/types'

type Props = {
  params: Promise<{ codigo: string }>
}

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Tu ticket de pasadía',
    description: 'Ticket de pasadía con código y QR para presentar en la entrada.',
    path: '/pasadia',
    image: IMAGES['piscina-recreativa'],
    imageAlt: 'Piscina recreativa de la Finca Loma Bonita',
  }),
  robots: 'noindex',
}

export default async function TicketPage({ params }: Props) {
  const { codigo } = await params

  // Admin client para leer por código (la policy no permite SELECT a anon)
  const supabase = createAdminClient()
  const [{ data: ticket, error }, { data: experiences }] = await Promise.all([
    supabase.from('tickets').select('*').eq('codigo', codigo).single(),
    supabase.from('experiences').select('slug, nombre'),
  ])

  if (error || !ticket) {
    notFound()
  }

  const t = ticket as Ticket
  const experienceList = (experiences ?? []) as Pick<Experience, 'slug' | 'nombre'>[]
  const addons = Array.isArray(t.addons) ? t.addons : []
  const addonNombres = addons
    .map((slug) => experienceList.find((e) => e.slug === slug)?.nombre ?? slug)
    .filter((nombre, i, arr) => arr.indexOf(nombre) === i)

  // QR apuntando a la URL pública de esta misma página
  const qrDataUrl = await QRCode.toDataURL(`${SITE_ORIGIN}/pasadia/${t.codigo}`, {
    margin: 1,
    width: 240,
  })

  const estadoColors: Record<string, string> = {
    emitido: 'bg-green-100 text-green-800',
    usado: 'bg-gray-100 text-gray-800',
    cancelado: 'bg-red-100 text-red-800',
  }

  const estadoLabels: Record<string, string> = {
    emitido: 'Válido',
    usado: 'Ya utilizado',
    cancelado: 'Cancelado',
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-12">
      <div className="container max-w-2xl">
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-16 text-green-600" aria-hidden="true" />
            <h1 className="mt-4 font-display text-3xl font-bold text-cafe">¡Ticket emitido!</h1>
            <p className="mt-2 text-muted-foreground">
              Presenta este código en la entrada de la finca:{' '}
              <strong className="font-mono text-lg text-cafe">{t.codigo}</strong>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <TicketIcon className="size-5 text-primary" aria-hidden="true" />
                Ticket de pasadía
              </h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estadoColors[t.estado]}`}>
                {estadoLabels[t.estado]}
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
              {/* QR */}
              <figure className="mx-auto space-y-2 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- dataURL generado en servidor */}
                <img
                  src={qrDataUrl}
                  alt={`Código QR del ticket ${t.codigo}`}
                  width={240}
                  height={240}
                  className="rounded-lg border border-border bg-white p-2"
                />
                <figcaption className="font-mono text-sm font-semibold">{t.codigo}</figcaption>
              </figure>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="font-medium">Fecha</p>
                    <p className="text-muted-foreground">
                      {format(new Date(`${t.fecha}T12:00:00`), "EEEE d 'de' MMMM 'de' yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="font-medium">Personas</p>
                    <p className="text-muted-foreground">
                      {t.personas} persona{t.personas > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {addonNombres.length > 0 && (
                  <div className="border-t border-border pt-3">
                    <p className="font-medium">Experiencias incluidas</p>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      {addonNombres.map((nombre) => (
                        <li key={nombre}>• {nombre}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t border-border pt-3">
                  <p className="font-medium">Total de prueba</p>
                  <p className="font-display text-xl font-bold text-cafe">
                    {formatCOP(t.total_muestra)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tarifa de ejemplo — sin pago en línea.
                  </p>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="font-medium">A nombre de</p>
                  <p className="text-muted-foreground">{t.nombre}</p>
                  {t.email && <p className="text-muted-foreground">{t.email}</p>}
                  {t.telefono && <p className="text-muted-foreground">{t.telefono}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <p className="font-medium">¿Qué sigue?</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
              <li>Guarda este código o toma captura del QR.</li>
              <li>Llega desde las 9:00 a.m. del día de tu pasadía.</li>
              <li>El staff valida el ticket con el QR en la entrada.</li>
            </ul>
          </div>

          <div className="text-center">
            <Link href="/pasadias" className={buttonVariants()}>
              Volver a pasadías
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

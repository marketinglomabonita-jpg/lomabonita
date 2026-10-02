import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { formatCop } from '@/core/lib/money'
import { Badge } from '@/core/ui/badge'
import {
  diaSiguiente,
  esFechaISOValida,
  fechaLegible,
  getDetalleDia,
  getPlanesPasadia,
} from '@/features/calendario/api/dia'
import { CrearPasadiaForm } from '@/features/calendario/components/crear-pasadia-form'
import { CrearReservaForm } from '@/features/calendario/components/crear-reserva-form'

/** [fecha] del dynamic segment: se await-ea y se valida; si no, 404. */
const fechaParamSchema = z.string().refine(esFechaISOValida, 'Fecha inválida')

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fecha: string }>
}): Promise<Metadata> {
  const { fecha } = await params
  const base = 'Calendario · Panel · Loma Bonita'

  if (!fechaParamSchema.safeParse(fecha).success) return { title: base, robots: 'noindex' }

  return {
    title: `${fechaLegible(fecha)} · Panel · Loma Bonita`,
    robots: 'noindex',
  }
}

export default async function DiaCalendarioPage({
  params,
}: {
  params: Promise<{ fecha: string }>
}) {
  const { fecha } = await params

  const parsed = fechaParamSchema.safeParse(fecha)
  if (!parsed.success) notFound()

  const fechaISO = parsed.data
  const [detalle, planes] = await Promise.all([getDetalleDia(fechaISO), getPlanesPasadia()])

  const libresHoy = detalle.habitaciones.filter((h) => !h.ocupadaPor)
  const cupoTotal = Math.max(detalle.pasadiaPersonas, 0) + Math.max(detalle.cupoRestante, 0)

  return (
    <div className="space-y-6">
      {/* Encabezado con la fecha y vuelta al mes */}
      <div className="space-y-1">
        <Link
          href={`/admin/calendario?mes=${fechaISO.slice(0, 7)}`}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ‹ Volver al mes
        </Link>
        <h1 className="text-2xl font-semibold capitalize text-primary">
          {fechaLegible(fechaISO)}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ocupación del día, reservas de alojamiento y pasadías
        </p>
      </div>

      {/* Alojamiento: estado de las habitaciones + formulario de reserva */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Alojamiento · {detalle.habitaciones.length - libresHoy.length} de{' '}
          {detalle.habitaciones.length} ocupadas
        </h2>

        {detalle.habitaciones.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {detalle.habitaciones.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    Hab. {h.numero} · {h.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {h.capacidad ? `Hasta ${h.capacidad} personas` : 'Capacidad sin definir'}
                  </p>
                </div>
                {h.ocupadaPor ? (
                  <Badge className="shrink-0 bg-red-100 text-red-800">
                    Ocupada por {h.ocupadaPor}
                  </Badge>
                ) : (
                  <Badge className="shrink-0 bg-green-100 text-green-800">Libre</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Reservar alojamiento</h3>
          <CrearReservaForm
            fecha={fechaISO}
            salidaInicial={diaSiguiente(fechaISO)}
            habitacionesLibres={libresHoy}
          />
        </div>
      </section>

      {/* Pasadías: cupo del día + lista + formulario */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pasadías</h2>

        <p className="text-sm text-muted-foreground">
          Quedan <span className="font-medium text-foreground">{Math.max(detalle.cupoRestante, 0)}</span>{' '}
          de {cupoTotal} cupos de personas para este día
        </p>

        {detalle.pasadias.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Sin pasadías emitidas este día</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Personas</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {detalle.pasadias.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-medium tabular-nums">{t.codigo}</td>
                    <td className="px-4 py-3">{t.nombre}</td>
                    <td className="px-4 py-3 tabular-nums">{t.personas}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCop(t.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Agregar pasadía</h3>
          <CrearPasadiaForm fecha={fechaISO} planes={planes} />
        </div>
      </section>
    </div>
  )
}

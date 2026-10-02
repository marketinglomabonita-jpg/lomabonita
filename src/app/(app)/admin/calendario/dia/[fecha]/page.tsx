import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
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
import { GestionPasadia } from '@/features/calendario/components/gestion-pasadia'
import { GestionReserva } from '@/features/calendario/components/gestion-reserva'

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
              <div key={h.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      Hab. {h.numero} · {h.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {h.capacidad ? `Hasta ${h.capacidad} personas` : 'Capacidad sin definir'}
                    </p>
                  </div>
                  {h.reserva ? (
                    <Badge className="shrink-0 bg-red-100 text-red-800">Ocupada</Badge>
                  ) : (
                    <Badge className="shrink-0 bg-green-100 text-green-800">Libre</Badge>
                  )}
                </div>

                {/* Gestión de la reserva que ocupa la habitación (R5): saldo,
                    abonos, comprobantes, editar, cancelar, eliminar. */}
                {h.reserva && (
                  <div className="mt-3 border-t pt-3">
                    <GestionReserva
                      reserva={h.reserva}
                      habitacionActual={{ id: h.id, numero: h.numero, nombre: h.nombre }}
                      fecha={fechaISO}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reservas vivas cuya habitación ya no existe (fue eliminada o
            desactivada): no cuelgan de ninguna tarjeta, pero se gestionan igual
            — editarlas permite reasignarlas a una habitación activa. */}
        {detalle.reservasSinHabitacion.length > 0 && (
          <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Reservas sin habitación activa
            </h3>
            <p className="text-xs text-muted-foreground">
              Su habitación fue eliminada o desactivada con la reserva viva. Edítalas para
              reasignarlas a una habitación libre.
            </p>
            {detalle.reservasSinHabitacion.map((r) => (
              <div key={r.id} className="rounded-lg border bg-card p-3">
                <GestionReserva reserva={r} habitacionActual={null} fecha={fechaISO} />
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
          <div className="grid gap-2 sm:grid-cols-2">
            {detalle.pasadias.map((t) => (
              <div key={t.id} className="rounded-lg border bg-card p-3">
                <GestionPasadia pasadia={t} />
              </div>
            ))}
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

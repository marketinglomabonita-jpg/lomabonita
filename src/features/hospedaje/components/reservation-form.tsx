'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { createReservation } from '../api/create-reservation'
import { createReservationSchema, type CreateReservationInput } from '../contracts/types'
import { cn } from '@/core/lib/utils'
import { buttonVariants } from '@/core/ui/button'

type Props = {
  roomTypeSlug: string
  checkIn: string
  checkOut: string
  adultos: number
  ninos: number
}

export function ReservationForm({ roomTypeSlug, checkIn, checkOut, adultos, ninos }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateReservationInput>({
    resolver: zodResolver(createReservationSchema),
    defaultValues: {
      room_type_slug: roomTypeSlug,
      check_in: checkIn,
      check_out: checkOut,
      adultos,
      ninos,
      nombre: '',
      email: '',
      telefono: '',
      notas: '',
    },
  })

  const onSubmit = async (data: CreateReservationInput) => {
    setError(null)
    const result = await createReservation(data)

    if (!result.success) {
      setError(result.error)
      return
    }

    router.push(`/reserva/${result.codigo}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nombre" className="mb-1.5 block text-sm font-medium">
            Nombre completo <span className="text-destructive">*</span>
          </label>
          <input
            {...register('nombre')}
            type="text"
            id="nombre"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.nombre && (
            <p className="mt-1 text-xs text-destructive">{errors.nombre.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Correo electrónico
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="telefono" className="mb-1.5 block text-sm font-medium">
            Teléfono / WhatsApp
          </label>
          <input
            {...register('telefono')}
            type="tel"
            id="telefono"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.telefono && (
            <p className="mt-1 text-xs text-destructive">{errors.telefono.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="notas" className="mb-1.5 block text-sm font-medium">
          Notas o solicitudes especiales
        </label>
        <textarea
          {...register('notas')}
          id="notas"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Ej: Necesito cuna para bebé, llegada tarde, etc."
        />
        {errors.notas && <p className="mt-1 text-xs text-destructive">{errors.notas.message}</p>}
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Detalle de la solicitud:</p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          <li>
            • Entrada: <strong>{checkIn}</strong>
          </li>
          <li>
            • Salida: <strong>{checkOut}</strong>
          </li>
          <li>
            • Huéspedes: <strong>{adultos} adulto{adultos > 1 ? 's' : ''}</strong>
            {ninos > 0 && (
              <>
                {' '}
                + <strong>{ninos} niño{ninos > 1 ? 's' : ''}</strong>
              </>
            )}
          </li>
        </ul>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Enviando solicitud...
          </>
        ) : (
          'Enviar solicitud de reserva'
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Esta es una solicitud sin pago. Te contactaremos para confirmar disponibilidad y finalizar
        tu reserva.
      </p>
    </form>
  )
}

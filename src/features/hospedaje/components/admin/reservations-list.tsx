'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { listReservations, updateReservationStatus } from '../../api/admin-actions'
import { Badge } from '@/core/ui/badge'
import { Button } from '@/core/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/ui/select'
import { Check, X, Ban } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Reservation } from '../../contracts/types'

const STATUS_COLORS = {
  solicitada: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  confirmada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rechazada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  cancelada: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
}

const STATUS_LABELS = {
  solicitada: 'Solicitada',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
}

export function ReservationsList() {
  const [filter, setFilter] = useState<string>('todas')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Cargar reservas al montar
  useEffect(() => {
    listReservations().then((data) => {
      setReservations(data)
      setLoading(false)
    })
  }, [])

  const handleStatusChange = async (
    reservationId: string,
    nuevoEstado: 'confirmada' | 'rechazada' | 'cancelada'
  ) => {
    try {
      await updateReservationStatus({ reservation_id: reservationId, nuevo_estado: nuevoEstado })
      startTransition(() => {
        router.refresh()
        listReservations().then(setReservations)
      })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al actualizar')
    }
  }

  const filteredReservations =
    filter === 'todas'
      ? reservations
      : reservations.filter((r) => r.estado === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Cargando reservas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filtrar por estado:</label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="solicitada">Solicitadas</SelectItem>
            <SelectItem value="confirmada">Confirmadas</SelectItem>
            <SelectItem value="rechazada">Rechazadas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredReservations.length} reserva(s)
        </span>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No hay reservas con este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((reservation) => (
            <div key={reservation.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-sm font-medium">{reservation.codigo}</p>
                    <Badge className={STATUS_COLORS[reservation.estado]}>
                      {STATUS_LABELS[reservation.estado]}
                    </Badge>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <p>
                      <span className="font-medium">Huésped:</span> {reservation.nombre}
                    </p>
                    <p>
                      <span className="font-medium">Fechas:</span>{' '}
                      {reservation.during.replace('[', '').replace(')', '')}
                    </p>
                    <p>
                      <span className="font-medium">Personas:</span> {reservation.adultos} adulto
                      (s)
                      {reservation.ninos > 0 && `, ${reservation.ninos} niño(s)`}
                    </p>
                    {reservation.email && (
                      <p>
                        <span className="font-medium">Correo:</span> {reservation.email}
                      </p>
                    )}
                    {reservation.telefono && (
                      <p>
                        <span className="font-medium">Teléfono:</span> {reservation.telefono}
                      </p>
                    )}
                    {reservation.notas && (
                      <p>
                        <span className="font-medium">Notas:</span> {reservation.notas}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Creada{' '}
                    {formatDistanceToNow(new Date(reservation.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>

                {reservation.estado === 'solicitada' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStatusChange(reservation.id, 'confirmada')}
                      disabled={isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      onClick={() => handleStatusChange(reservation.id, 'rechazada')}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                )}

                {reservation.estado === 'confirmada' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(reservation.id, 'cancelada')}
                    disabled={isPending}
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

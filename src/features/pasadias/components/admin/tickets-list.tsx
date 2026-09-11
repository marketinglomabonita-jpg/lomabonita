'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertTriangle, ScanLine } from 'lucide-react'
import { listTickets, checkInTicket } from '../../api/admin-actions'
import { Badge } from '@/core/ui/badge'
import { Button } from '@/core/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/ui/select'
import { formatCOP } from '../../lib/format'
import type { Ticket } from '../../contracts/types'

const STATUS_COLORS = {
  emitido: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  usado: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

const STATUS_LABELS = {
  emitido: 'Emitido',
  usado: 'Usado',
  cancelado: 'Cancelado',
}

type Props = {
  /** Mapa slug → nombre para mostrar los addons legibles */
  experienceNames: Record<string, string>
}

export function TicketsList({ experienceNames }: Props) {
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [fechaFilter, setFechaFilter] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [checkInErrors, setCheckInErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const reload = () => {
    listTickets().then((data) => {
      setTickets(data)
      setLoading(false)
    })
  }

  useEffect(() => {
    reload()
  }, [])

  const handleCheckIn = async (ticketId: string) => {
    try {
      const result = await checkInTicket({ ticket_id: ticketId })
      if (!result.success) {
        // Segundo intento sobre un ticket ya usado: aviso inline en esa fila
        setCheckInErrors((prev) => ({ ...prev, [ticketId]: result.error }))
        setTimeout(() => {
          setCheckInErrors((prev) => {
            const next = { ...prev }
            delete next[ticketId]
            return next
          })
        }, 6000)
        return
      }
      setCheckInErrors((prev) => {
        const next = { ...prev }
        delete next[ticketId]
        return next
      })
      startTransition(() => {
        router.refresh()
        reload()
      })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al hacer check-in')
    }
  }

  const filtered = tickets.filter((t) => {
    if (estadoFilter !== 'todos' && t.estado !== estadoFilter) return false
    if (fechaFilter && t.fecha !== fechaFilter) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Cargando tickets...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium" htmlFor="filtro-estado">
          Estado:
        </label>
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger id="filtro-estado" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="emitido">Emitidos</SelectItem>
            <SelectItem value="usado">Usados</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <label className="text-sm font-medium" htmlFor="filtro-fecha">
          Fecha:
        </label>
        <input
          type="date"
          id="filtro-fecha"
          value={fechaFilter}
          onChange={(e) => setFechaFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {(estadoFilter !== 'todos' || fechaFilter) && (
          <button
            type="button"
            onClick={() => {
              setEstadoFilter('todos')
              setFechaFilter('')
            }}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Limpiar filtros
          </button>
        )}
        <span className="text-sm text-muted-foreground">{filtered.length} ticket(s)</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No hay tickets con este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const addons = Array.isArray(ticket.addons) ? ticket.addons : []
            return (
              <div key={ticket.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-sm font-medium">{ticket.codigo}</p>
                      <Badge className={STATUS_COLORS[ticket.estado]}>
                        {STATUS_LABELS[ticket.estado]}
                      </Badge>
                    </div>

                    <div className="grid gap-1.5 text-sm">
                      <p>
                        <span className="font-medium">Fecha:</span> {ticket.fecha}
                      </p>
                      <p>
                        <span className="font-medium">Personas:</span> {ticket.personas}
                      </p>
                      {addons.length > 0 && (
                        <p>
                          <span className="font-medium">Experiencias:</span>{' '}
                          {addons.map((slug) => experienceNames[slug] ?? slug).join(', ')}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Total:</span> {formatCOP(ticket.total_muestra)}
                      </p>
                      <p>
                        <span className="font-medium">Solicitante:</span> {ticket.nombre}
                        {ticket.email ? ` · ${ticket.email}` : ''}
                        {ticket.telefono ? ` · ${ticket.telefono}` : ''}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Emitido{' '}
                      {formatDistanceToNow(new Date(ticket.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>

                    {checkInErrors[ticket.id] && (
                      <p className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                        {checkInErrors[ticket.id]}
                      </p>
                    )}
                  </div>

                  {ticket.estado === 'emitido' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleCheckIn(ticket.id)}
                      disabled={isPending}
                    >
                      <ScanLine className="mr-1 h-4 w-4" />
                      Marcar como usado
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

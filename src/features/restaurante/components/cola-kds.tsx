'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/core/adapters/supabase/browser'
import { listOrders, updateOrderEstado } from '../api/admin-actions'
import { Button } from '@/core/ui/button'
import type { Order, OrderEstado } from '../contracts/types'

const ESTADOS: { estado: OrderEstado; label: string; color: string }[] = [
  { estado: 'recibido', label: 'Recibido', color: 'bg-blue-500' },
  { estado: 'en_preparacion', label: 'En preparación', color: 'bg-yellow-500' },
  { estado: 'listo', label: 'Listo', color: 'bg-green-500' },
  { estado: 'entregado', label: 'Entregado', color: 'bg-gray-500' },
]

export function ColaKDS() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await listOrders({ estado: undefined })
        // Solo pedidos no entregados ni cancelados
        setOrders(
          data.filter((o) => !['entregado', 'cancelado'].includes(o.estado))
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Realtime con cliente autenticado (staff)
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as Order
          setOrders((prev) => [newOrder, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const updated = payload.new as Order
          setOrders((prev) =>
            prev
              .map((o) => (o.id === updated.id ? updated : o))
              .filter((o) => !['entregado', 'cancelado'].includes(o.estado))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleAvanzar = async (orderId: string, estadoActual: OrderEstado) => {
    const idx = ESTADOS.findIndex((e) => e.estado === estadoActual)
    if (idx === -1 || idx >= ESTADOS.length - 1) return

    const siguiente = ESTADOS[idx + 1].estado

    try {
      await updateOrderEstado({ order_id: orderId, estado: siguiente })
    } catch (err) {
      console.error('Error al actualizar estado:', err)
    }
  }

  if (loading) {
    return <div className="text-center text-muted-foreground">Cargando pedidos...</div>
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 px-4 py-3 text-destructive">
        {error}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-12 text-center text-muted-foreground">
        No hay pedidos activos. Los pedidos nuevos aparecerán aquí en tiempo real.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => {
        const estadoInfo = ESTADOS.find((e) => e.estado === order.estado)
        const puedeAvanzar =
          estadoInfo && estadoInfo.estado !== 'entregado'

        return (
          <div
            key={order.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-muted-foreground">
                  {order.codigo}
                </div>
                <div className="text-lg font-bold">Mesa {order.mesa_numero}</div>
              </div>
              {estadoInfo && (
                <span
                  className={`${estadoInfo.color} rounded px-2 py-1 text-xs font-semibold text-white`}
                >
                  {estadoInfo.label}
                </span>
              )}
            </div>

            <div className="mb-3 space-y-1 text-sm">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between gap-2">
                  <span>
                    {item.cantidad}× {item.nombre}
                  </span>
                  {item.notas && (
                    <span className="text-xs italic text-muted-foreground">
                      {item.notas}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mb-3 border-t pt-2 text-sm font-semibold">
              Total: ${order.total.toLocaleString('es-CO')}
            </div>

            <div className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            {puedeAvanzar && (
              <Button
                onClick={() => handleAvanzar(order.id, order.estado)}
                className="mt-3 w-full"
                size="sm"
              >
                Avanzar a{' '}
                {ESTADOS[ESTADOS.findIndex((e) => e.estado === order.estado) + 1]?.label}
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { listOrders } from '../api/admin-actions'
import type { Order } from '../contracts/types'

export function HistorialPedidos() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await listOrders({})
        setOrders(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="text-center text-muted-foreground">Cargando...</div>
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
      <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-8 text-center text-muted-foreground">
        No hay pedidos registrados todavía.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Código</th>
            <th className="px-4 py-3 text-left font-medium">Mesa</th>
            <th className="px-4 py-3 text-left font-medium">Total</th>
            <th className="px-4 py-3 text-left font-medium">Estado</th>
            <th className="px-4 py-3 text-left font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-mono text-xs">{order.codigo}</td>
              <td className="px-4 py-3">{order.mesa_numero}</td>
              <td className="px-4 py-3 font-semibold">
                ${order.total.toLocaleString('es-CO')}
              </td>
              <td className="px-4 py-3">
                <span className="rounded bg-muted px-2 py-1 text-xs font-medium capitalize">
                  {order.estado.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(order.created_at).toLocaleString('es-CO', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

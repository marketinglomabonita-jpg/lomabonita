'use client'

import { useState, useEffect } from 'react'
import { Minus, Plus, Send, CheckCircle } from 'lucide-react'
import { Button } from '@/core/ui/button'
import {
  getMenuCategories,
  getMenuItems,
  getPlatoDelDia,
  createOrder,
  getOrderStatus,
} from '../api/actions'
import type { MenuItem, MenuCategory, OrderItem, OrderEstado } from '../contracts/types'

interface Props {
  mesaNumero: number
}

export function PedidoForm({ mesaNumero }: Props) {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [platoDelDia, setPlatoDelDia] = useState<MenuItem | null>(null)
  const [carrito, setCarrito] = useState<Map<string, OrderItem>>(new Map())
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [codigo, setCodigo] = useState<string | null>(null)
  const [estado, setEstado] = useState<OrderEstado | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [cats, its, plato] = await Promise.all([
          getMenuCategories(),
          getMenuItems(),
          getPlatoDelDia(),
        ])
        setCategories(cats)
        setItems(its)
        setPlatoDelDia(plato)
      } catch (err) {
        setError('Error al cargar la carta')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Polling del estado del pedido
  useEffect(() => {
    if (!codigo) return

    const interval = setInterval(async () => {
      try {
        const status = await getOrderStatus(codigo)
        if (status) {
          setEstado(status.estado)
        }
      } catch (err) {
        console.error('Error al consultar estado:', err)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [codigo])

  const agregarItem = (item: MenuItem) => {
    const nuevo = new Map(carrito)
    const existente = nuevo.get(item.id)

    if (existente) {
      nuevo.set(item.id, {
        ...existente,
        cantidad: existente.cantidad + 1,
      })
    } else {
      nuevo.set(item.id, {
        menu_item_id: item.id,
        nombre: item.nombre,
        cantidad: 1,
        precio: item.precio_muestra,
      })
    }

    setCarrito(nuevo)
  }

  const quitarItem = (itemId: string) => {
    const nuevo = new Map(carrito)
    const existente = nuevo.get(itemId)

    if (existente && existente.cantidad > 1) {
      nuevo.set(itemId, {
        ...existente,
        cantidad: existente.cantidad - 1,
      })
    } else {
      nuevo.delete(itemId)
    }

    setCarrito(nuevo)
  }

  const total = Array.from(carrito.values()).reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0
  )

  const handleEnviar = async () => {
    setEnviando(true)
    setError(null)

    try {
      const result = await createOrder({
        mesa_numero: mesaNumero,
        items: Array.from(carrito.values()),
        total,
      })

      if (result.success) {
        setCodigo(result.codigo)
        setEstado('recibido')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el pedido')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return <div className="text-center text-muted-foreground">Cargando carta...</div>
  }

  if (codigo) {
    return (
      <div className="space-y-6 rounded-lg border bg-card p-6 text-center shadow-sm">
        <CheckCircle className="mx-auto size-16 text-green-600" />
        <div>
          <h2 className="text-2xl font-bold">¡Pedido enviado!</h2>
          <p className="mt-2 text-muted-foreground">Tu código es:</p>
          <div className="mt-2 text-3xl font-bold text-primary">{codigo}</div>
        </div>
        {estado && (
          <div className="rounded-md bg-muted px-4 py-3">
            <div className="text-sm font-medium text-muted-foreground">Estado actual:</div>
            <div className="mt-1 text-lg font-semibold capitalize">
              {estado.replace('_', ' ')}
            </div>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          El estado se actualiza automáticamente. Puedes cerrar esta página.
        </p>
      </div>
    )
  }

  const itemsByCategory = categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id),
  }))

  return (
    <div className="space-y-6">
      {platoDelDia && (
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Plato del día
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold">{platoDelDia.nombre}</h3>
              {platoDelDia.descripcion && (
                <p className="text-sm text-muted-foreground">{platoDelDia.descripcion}</p>
              )}
              <div className="mt-1 font-semibold text-primary">
                ${platoDelDia.precio_muestra.toLocaleString('es-CO')}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => agregarItem(platoDelDia)}
              className="shrink-0"
            >
              <Plus className="size-4" />
              Agregar
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {itemsByCategory.map(
          (category) =>
            category.items.length > 0 && (
              <div key={category.id} className="space-y-3">
                <h3 className="font-semibold">{category.nombre}</h3>
                <div className="space-y-2">
                  {category.items.map((item) => {
                    const enCarrito = carrito.get(item.id)
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{item.nombre}</div>
                          {item.descripcion && (
                            <div className="text-xs text-muted-foreground">
                              {item.descripcion}
                            </div>
                          )}
                          <div className="mt-1 text-sm font-semibold text-primary">
                            ${item.precio_muestra.toLocaleString('es-CO')}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {enCarrito ? (
                            <>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => quitarItem(item.id)}
                                className="size-8"
                              >
                                <Minus className="size-3" />
                              </Button>
                              <span className="w-6 text-center font-semibold">
                                {enCarrito.cantidad}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => agregarItem(item)}
                                className="size-8"
                              >
                                <Plus className="size-3" />
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" onClick={() => agregarItem(item)}>
                              <Plus className="size-3" />
                              Agregar
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {carrito.size > 0 && (
        <div className="sticky bottom-0 rounded-lg border bg-card p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Total:</span>
            <span className="text-2xl font-bold text-primary">
              ${total.toLocaleString('es-CO')}
            </span>
          </div>
          <Button
            onClick={handleEnviar}
            disabled={enviando || carrito.size === 0}
            className="w-full"
            size="lg"
          >
            <Send className="size-4" />
            {enviando ? 'Enviando...' : 'Enviar pedido'}
          </Button>
        </div>
      )}
    </div>
  )
}

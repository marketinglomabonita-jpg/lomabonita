'use client'

import { useState, useEffect } from 'react'
import { Star, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/core/ui/button'
import {
  listMenuItems,
  togglePlatoDelDia,
  deleteMenuItem,
} from '../api/admin-actions'
import { getMenuCategories } from '../api/actions'
import type { MenuItem, MenuCategory } from '../contracts/types'

export function CartaAdmin() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [its, cats] = await Promise.all([listMenuItems(), getMenuCategories()])
        setItems(its)
        setCategories(cats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleTogglePlatoDelDia = async (itemId: string) => {
    try {
      await togglePlatoDelDia({ menu_item_id: itemId })
      // Recargar
      const updated = await listMenuItems()
      setItems(updated)
    } catch (err) {
      console.error('Error al marcar plato del día:', err)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Eliminar este ítem de la carta?')) return

    try {
      await deleteMenuItem(itemId)
      setItems((prev) => prev.filter((i) => i.id !== itemId))
    } catch (err) {
      console.error('Error al eliminar:', err)
    }
  }

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

  const itemsByCategory = categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id),
  }))

  return (
    <div className="space-y-6">
      {itemsByCategory.map(
        (category) =>
          category.items.length > 0 && (
            <div key={category.id} className="space-y-3">
              <h3 className="font-semibold">{category.nombre}</h3>
              <div className="space-y-2">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.nombre}</span>
                        {item.es_plato_del_dia && (
                          <Star className="size-4 fill-yellow-500 text-yellow-500" />
                        )}
                        {!item.disponible && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                            No disponible
                          </span>
                        )}
                        {item.is_sample && (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
                            Ejemplo
                          </span>
                        )}
                      </div>
                      {item.descripcion && (
                        <div className="text-sm text-muted-foreground">
                          {item.descripcion}
                        </div>
                      )}
                      <div className="mt-1 text-sm font-semibold text-primary">
                        ${item.precio_muestra.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleTogglePlatoDelDia(item.id)}
                        title={item.es_plato_del_dia ? 'Desmarcar plato del día' : 'Marcar como plato del día'}
                        className="size-8"
                      >
                        <Star className={item.es_plato_del_dia ? 'fill-yellow-500 text-yellow-500' : ''} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Editar (próximamente)"
                        className="size-8"
                        disabled
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        title="Eliminar"
                        className="size-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
      )}

      <p className="text-center text-xs text-muted-foreground">
        Crear/editar ítems se habilitará en una próxima iteración. Por ahora puedes
        marcar el plato del día y eliminar ítems.
      </p>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Star, Edit, Trash2, Plus } from 'lucide-react'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'
import { Label } from '@/core/ui/label'
import { Checkbox } from '@/core/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/ui/select'
import {
  listMenuItems,
  togglePlatoDelDia,
  deleteMenuItem,
  createMenuItem,
  updateMenuItem,
} from '../api/admin-actions'
import { getMenuCategories } from '../api/actions'
import type { MenuItem, MenuCategory } from '../contracts/types'

/** Slug automático a partir del nombre — evita que el staff tenga que pensar en eso. */
function slugify(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function CartaAdmin() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)

  async function reload() {
    const [its, cats] = await Promise.all([listMenuItems(), getMenuCategories()])
    setItems(its)
    setCategories(cats)
  }

  useEffect(() => {
    async function load() {
      try {
        await reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function openCreate() {
    setEditing(null)
    setFormError(null)
    setIsDialogOpen(true)
  }

  function openEdit(item: MenuItem) {
    setEditing(item)
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleTogglePlatoDelDia = async (itemId: string) => {
    try {
      await togglePlatoDelDia({ menu_item_id: itemId })
      await reload()
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const formData = new FormData(e.currentTarget)
    const nombre = String(formData.get('nombre') ?? '').trim()

    const payload = {
      category_id: String(formData.get('category_id') ?? ''),
      slug: editing ? editing.slug : slugify(nombre),
      nombre,
      descripcion: String(formData.get('descripcion') ?? '').trim() || undefined,
      precio_muestra: Number(formData.get('precio_muestra')),
      disponible: formData.get('disponible') === 'on',
    }

    try {
      if (editing) {
        await updateMenuItem({ id: editing.id, ...payload })
      } else {
        await createMenuItem(payload)
      }
      setIsDialogOpen(false)
      await reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el plato')
    }
  }

  if (loading) {
    return <div className="text-center text-muted-foreground">Cargando...</div>
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 px-4 py-3 text-destructive">{error}</div>
    )
  }

  const itemsByCategory = categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} plato{items.length === 1 ? '' : 's'} en la carta.
        </p>
        <Button size="sm" onClick={openCreate} disabled={categories.length === 0}>
          <Plus className="size-4" />
          Nuevo plato
        </Button>
      </div>

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
                        <div className="text-sm text-muted-foreground">{item.descripcion}</div>
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
                        title="Editar"
                        className="size-8"
                        onClick={() => openEdit(item)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar plato' : 'Nuevo plato'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="category_id">Categoría</Label>
              <Select name="category_id" required defaultValue={editing?.category_id}>
                <SelectTrigger id="category_id">
                  <SelectValue placeholder="Elige una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" required defaultValue={editing?.nombre} maxLength={100} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Input id="descripcion" name="descripcion" defaultValue={editing?.descripcion ?? ''} maxLength={500} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="precio_muestra">Precio de ejemplo (COP)</Label>
              <Input
                id="precio_muestra"
                name="precio_muestra"
                type="number"
                min={0}
                step={500}
                required
                defaultValue={editing?.precio_muestra}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="disponible" defaultChecked={editing ? editing.disponible : true} />
              Disponible en la carta
            </label>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <Button type="submit" className="w-full">
              {editing ? 'Guardar cambios' : 'Crear plato'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <p className="text-center text-xs text-muted-foreground">
        Los precios son de ejemplo — se reemplazan por los reales cuando el propietario los confirme.
      </p>
    </div>
  )
}

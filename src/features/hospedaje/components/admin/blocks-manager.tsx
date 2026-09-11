'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { listRoomBlocks, listRooms, createRoomBlock, deleteRoomBlock } from '../../api/admin-actions'
import { Button } from '@/core/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import type { RoomBlock, Room, RoomType } from '../../contracts/types'

export function BlocksManager() {
  const [blocks, setBlocks] = useState<(RoomBlock & { rooms: Room })[]>([])
  const [rooms, setRooms] = useState<(Room & { room_types: RoomType })[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  // Cargar datos
  useState(() => {
    Promise.all([listRoomBlocks(), listRooms()]).then(([blocksData, roomsData]) => {
      setBlocks(blocksData)
      setRooms(roomsData)
      setLoading(false)
    })
  })

  const handleCreateBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      await createRoomBlock({
        room_id: formData.get('room_id') as string,
        fecha_inicio: formData.get('fecha_inicio') as string,
        fecha_fin: formData.get('fecha_fin') as string,
        motivo: formData.get('motivo') as string,
      })

      setIsDialogOpen(false)
      router.refresh()
      listRoomBlocks().then(setBlocks)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al crear bloqueo')
    }
  }

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('¿Eliminar este bloqueo?')) return

    try {
      await deleteRoomBlock(id)
      router.refresh()
      listRoomBlocks().then(setBlocks)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Cargando bloqueos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{blocks.length} bloqueo(s) activo(s)</p>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo bloqueo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear bloqueo de disponibilidad</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Habitación</label>
                <Select name="room_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una habitación" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.nombre} ({room.room_types.nombre})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Fecha inicio</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    required
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha fin</label>
                  <input
                    type="date"
                    name="fecha_fin"
                    required
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Motivo (opcional)</label>
                <input
                  type="text"
                  name="motivo"
                  placeholder="Ej: Mantenimiento programado"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-blue-50 p-3 text-sm dark:bg-blue-950">
        <p className="text-blue-900 dark:text-blue-100">
          ℹ️ Los bloqueos impiden que la habitación aparezca en la búsqueda pública durante el
          rango de fechas especificado.
        </p>
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No hay bloqueos configurados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block) => (
            <div key={block.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{block.rooms.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {block.during.replace('[', '').replace(')', '')}
                  </p>
                  {block.motivo && (
                    <p className="text-xs text-muted-foreground">Motivo: {block.motivo}</p>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  onClick={() => handleDeleteBlock(block.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

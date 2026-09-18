'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { listRooms, listRoomTypes, createRoom } from '../../api/admin-actions'
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
import { Badge } from '@/core/ui/badge'
import { Plus } from 'lucide-react'
import type { Room, RoomType } from '../../contracts/types'

export function RoomsManager() {
  const [rooms, setRooms] = useState<(Room & { room_types: RoomType })[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  // Cargar datos
  useEffect(() => {
    Promise.all([listRooms(), listRoomTypes()]).then(([roomsData, typesData]) => {
      setRooms(roomsData)
      setRoomTypes(typesData)
      setLoading(false)
    })
  }, [])

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      await createRoom({
        room_type_id: formData.get('room_type_id') as string,
        nombre: formData.get('nombre') as string,
        activa: true,
      })

      setIsDialogOpen(false)
      router.refresh()
      listRooms().then(setRooms)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al crear habitación')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Cargando habitaciones...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rooms.length} habitación(es) física(s)</p>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nueva habitación
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear habitación</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de habitación</label>
                <Select name="room_type_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Nombre / número</label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Habitación 101"
                  required
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

      <div className="rounded-lg border bg-amber-50 p-3 text-sm dark:bg-amber-950">
        <p className="text-amber-900 dark:text-amber-100">
          💡 Las habitaciones actuales son de ejemplo. Reemplázalas con los datos reales después
          de la presentación.
        </p>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No hay habitaciones todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div key={room.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{room.nombre}</p>
                    {room.activa ? (
                      <Badge className="bg-green-100 text-green-800">Activa</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Inactiva</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tipo: {room.room_types.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Capacidad máx: {room.room_types.capacidad_max} personas · Precio referencia:
                    ${room.room_types.precio_noche_muestra.toLocaleString()}/noche
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

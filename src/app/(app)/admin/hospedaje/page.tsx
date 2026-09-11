import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/ui/tabs'
import { ReservationsList } from '@/features/hospedaje/components/admin/reservations-list'
import { RoomsManager } from '@/features/hospedaje/components/admin/rooms-manager'
import { BlocksManager } from '@/features/hospedaje/components/admin/blocks-manager'

export const metadata = {
  title: 'Hospedaje · Panel · Loma Bonita',
  robots: 'noindex',
}

export default function AdminHospedajePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Hospedaje</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de reservas, habitaciones y bloqueos de disponibilidad
        </p>
      </div>

      <Tabs defaultValue="reservas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="habitaciones">Habitaciones</TabsTrigger>
          <TabsTrigger value="bloqueos">Bloqueos</TabsTrigger>
        </TabsList>

        <TabsContent value="reservas" className="mt-6">
          <ReservationsList />
        </TabsContent>

        <TabsContent value="habitaciones" className="mt-6">
          <RoomsManager />
        </TabsContent>

        <TabsContent value="bloqueos" className="mt-6">
          <BlocksManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

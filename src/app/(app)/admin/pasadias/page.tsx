import { createClient } from '@/core/adapters/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/ui/tabs'
import { TicketsList } from '@/features/pasadias/components/admin/tickets-list'
import { CapacityManager } from '@/features/pasadias/components/admin/capacity-manager'
import type { Experience } from '@/features/pasadias/contracts/types'

export const metadata = {
  title: 'Pasadías · Panel · Loma Bonita',
  robots: 'noindex',
}

export default async function AdminPasadiasPage() {
  const supabase = await createClient()
  const { data: experiences } = await supabase.from('experiences').select('slug, nombre')

  const experienceNames: Record<string, string> = {}
  for (const e of (experiences ?? []) as Pick<Experience, 'slug' | 'nombre'>[]) {
    experienceNames[e.slug] = e.nombre
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Pasadías</h1>
        <p className="text-sm text-muted-foreground">
          Tickets emitidos, check-in en la entrada y cupos por fecha
        </p>
      </div>

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="cupos">Cupos por fecha</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-6">
          <TicketsList experienceNames={experienceNames} />
        </TabsContent>

        <TabsContent value="cupos" className="mt-6">
          <CapacityManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

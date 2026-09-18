import Link from 'next/link'
import { ChefHat, ClipboardList, Utensils } from 'lucide-react'
import { buttonVariants } from '@/core/ui/button'
import { CartaAdmin } from '@/features/restaurante/components/carta-admin'
import { HistorialPedidos } from '@/features/restaurante/components/historial-pedidos'

export default function RestauranteAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Restaurante</h1>
        <Link
          href="/cocina"
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <ChefHat className="size-4" />
          Abrir KDS
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Utensils className="size-4" />
            <span className="text-sm font-medium">Carta</span>
          </div>
          <div className="mt-2 text-2xl font-bold">Gestionar</div>
          <p className="mt-1 text-xs text-muted-foreground">
            CRUD de ítems y plato del día
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="size-4" />
            <span className="text-sm font-medium">Historial</span>
          </div>
          <div className="mt-2 text-2xl font-bold">Pedidos</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Todos los pedidos procesados
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Carta</h2>
          <CartaAdmin />
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Historial de pedidos</h2>
          <HistorialPedidos />
        </section>
      </div>
    </div>
  )
}

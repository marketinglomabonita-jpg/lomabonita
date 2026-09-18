import type { Metadata } from 'next'
import { ColaKDS } from '@/features/restaurante/components/cola-kds'

export const metadata: Metadata = {
  title: 'Cocina — Loma Bonita',
  robots: 'noindex,nofollow',
}

export default function CocinaPage() {
  return (
    <div className="container max-w-7xl py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Cocina — Pedidos en tiempo real</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Los pedidos nuevos aparecen automáticamente. Avanza su estado con los botones.
        </p>
      </div>

      <ColaKDS />
    </div>
  )
}

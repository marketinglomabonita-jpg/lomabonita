import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PedidoForm } from '@/features/restaurante/components/pedido-form'

export const metadata: Metadata = {
  title: 'Pedido en mesa — Loma Bonita',
  robots: 'noindex,nofollow',
}

interface Props {
  params: Promise<{ numero: string }>
}

export default async function MesaPage({ params }: Props) {
  const { numero } = await params
  const mesaNumero = parseInt(numero, 10)

  if (isNaN(mesaNumero) || mesaNumero < 1 || mesaNumero > 50) {
    notFound()
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Mesa {mesaNumero}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Arma tu pedido y lo enviaremos directo a cocina
          </p>
        </div>

        <PedidoForm mesaNumero={mesaNumero} />
      </div>
    </div>
  )
}

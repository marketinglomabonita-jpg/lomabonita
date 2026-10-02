import type { Metadata } from 'next'
import { z } from 'zod'
import { getPlanesPasadia } from '@/features/calendario/api/dia'
import { getOcupacionMes, hoyColombia } from '@/features/calendario/api/queries'
import { CalendarioMes } from '@/features/calendario/components/calendario-mes'
import { DiaModalProvider } from '@/features/calendario/components/dia-modal'

export const metadata: Metadata = {
  title: 'Calendario · Panel · Loma Bonita',
  robots: 'noindex',
}

const mesParamSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mes inválido')

export default async function AdminCalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const mesParam = Array.isArray(params.mes) ? params.mes[0] : params.mes
  const parsed = mesParamSchema.safeParse(mesParam)

  const hoy = hoyColombia()
  // Default: el mes actual en hora de Colombia (UTC-5), como YYYY-MM.
  const mesISO = parsed.success ? parsed.data : hoy.slice(0, 7)
  const [anio, mes] = mesISO.split('-').map(Number)

  // Los planes alimentan el form de pasadía dentro del popup del día.
  const [dias, planes] = await Promise.all([getOcupacionMes(anio, mes), getPlanesPasadia()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Calendario</h1>
        <p className="text-sm text-muted-foreground">
          Panorama de ocupación de habitaciones y pasadías, día por día
        </p>
      </div>

      <DiaModalProvider planes={planes}>
        <CalendarioMes mes={mesISO} dias={dias} hoy={hoy} />
      </DiaModalProvider>
    </div>
  )
}

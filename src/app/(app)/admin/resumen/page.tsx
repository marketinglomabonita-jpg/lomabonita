import type { Metadata } from 'next'
import { z } from 'zod'
import { esFechaISOValida, getDetalleDia } from '@/features/calendario/api/dia'
import { hoyColombia } from '@/features/calendario/api/queries'
import { getResumenSemana } from '@/features/calendario/api/resumen'
import { ResumenVista } from '@/features/calendario/components/resumen-vista'

export const metadata: Metadata = {
  title: 'Resumen · Panel · Loma Bonita',
  robots: 'noindex',
}

const vistaSchema = z.enum(['semana', 'dia'])
// Fecha real YYYY-MM-DD (rechaza 2026-02-31): esFechaISOValida compara UTC puro.
const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
  .refine(esFechaISOValida, 'Fecha inexistente')

/** Primer valor si el param llegó repetido (?fecha=a&fecha=b). */
function primerParam(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor
}

/**
 * Vista de resumen del panel: cómo viene la semana y el día, de un vistazo.
 * Server-first: la vista y la fecha viven en el query param
 * (?vista=semana|dia&fecha=YYYY-MM-DD) y TODO dato se resuelve aquí — el
 * componente cliente solo recibe props. Defaults: semana de hoy / hoy.
 * Cualquier param basura cae a los defaults en vez de romper la página.
 */
export default async function AdminResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const hoy = hoyColombia()

  const fechaParsed = fechaSchema.safeParse(primerParam(params.fecha))
  const fecha = fechaParsed.success ? fechaParsed.data : hoy
  const vistaParsed = vistaSchema.safeParse(primerParam(params.vista))
  const vista = vistaParsed.success ? vistaParsed.data : 'semana'

  // La semana alimenta ambas vistas (toggle y contexto); el detalle solo pesa
  // cuando se está viendo un día.
  const [semana, detalle] = await Promise.all([
    getResumenSemana(fecha),
    vista === 'dia' ? getDetalleDia(fecha) : Promise.resolve(null),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Resumen</h1>
        <p className="text-sm text-muted-foreground">
          Cómo viene la semana y el día, de un vistazo — sin abrir cada fecha
        </p>
      </div>
      <ResumenVista vista={vista} fecha={fecha} hoy={hoy} semana={semana} detalle={detalle} />
    </div>
  )
}

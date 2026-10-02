import type { Metadata } from 'next'
import { hoyColombia } from '@/features/reportes/api/datos'
import { ReportesForm } from '@/features/reportes/components/reportes-form'

export const metadata: Metadata = {
  title: 'Reportes · Panel · Loma Bonita',
  robots: 'noindex',
}

/**
 * Sección de reportes del panel: elige un período (día/semana/mes) y una fecha
 * de referencia, y descarga el Excel con el análisis del rango. La generación
 * vive en el servidor (route handler /admin/reportes/export); esta página solo
 * monta el selector.
 */
export default function AdminReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Descarga el análisis del período en Excel: reservas, pasadías y pagos del rango
        </p>
      </div>
      <ReportesForm hoy={hoyColombia()} />
    </div>
  )
}

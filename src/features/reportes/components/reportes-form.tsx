'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { buttonVariants } from '@/core/ui/button'
import { Input } from '@/core/ui/input'
import { Label } from '@/core/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/ui/select'
import { cn } from '@/core/lib/utils'

type Periodo = 'dia' | 'semana' | 'mes'

const PERIODOS: Array<{ valor: Periodo; etiqueta: string }> = [
  { valor: 'dia', etiqueta: 'Día' },
  { valor: 'semana', etiqueta: 'Semana' },
  { valor: 'mes', etiqueta: 'Mes' },
]

type Props = {
  /** Hoy en Colombia (YYYY-MM-DD): default del input de fecha y respaldo. */
  hoy: string
}

/**
 * Selector del reporte: período + fecha de referencia y el enlace que dispara
 * la descarga. El Excel lo genera el servidor: el enlace apunta al route
 * handler con los query params y, al responder con
 * Content-Disposition: attachment, el navegador baja el archivo sin dejar la
 * página (mismo origen, así que `download` respeta el nombre del servidor).
 */
export function ReportesForm({ hoy }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>('dia')
  const [fecha, setFecha] = useState(hoy)

  // Respaldo defensivo: si el input quedó vacío o trajo basura, usa hoy.
  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : hoy
  const urlDescarga = `/admin/reportes/export?periodo=${periodo}&fecha=${fechaValida}`

  return (
    <div className="max-w-xl space-y-4 rounded-lg border bg-background p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reporte-periodo">Período</Label>
          <Select value={periodo} onValueChange={(valor) => setPeriodo(valor as Periodo)}>
            <SelectTrigger id="reporte-periodo" className="w-full">
              <SelectValue placeholder="Elige el período" />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => (
                <SelectItem key={p.valor} value={p.valor}>
                  {p.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reporte-fecha">Fecha de referencia</Label>
          <Input
            id="reporte-fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
      </div>
      <a href={urlDescarga} download className={cn(buttonVariants(), 'w-full sm:w-auto')}>
        <Download />
        Descargar Excel
      </a>
      <p className="text-xs text-muted-foreground">
        El rango se resuelve de la fecha: Día = ese día; Semana = lunes→domingo que la contiene;
        Mes = mes completo. El reporte trae reservas por llegada, pasadías por fecha y pagos
        registrados en el rango.
      </p>
    </div>
  )
}

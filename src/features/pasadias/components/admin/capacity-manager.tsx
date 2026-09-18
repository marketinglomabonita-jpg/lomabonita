'use client'

import { useEffect, useState } from 'react'
import { CalendarCog, Loader2 } from 'lucide-react'
import { listCapacity, setPassCapacity } from '../../api/admin-actions'
import { Badge } from '@/core/ui/badge'
import { Button } from '@/core/ui/button'
import { CAPACIDAD_DEFAULT_PASADIA } from '../../contracts/types'

export function CapacityManager() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listCapacity>>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  const [fecha, setFecha] = useState('')
  const [cupo, setCupo] = useState('60')

  const reload = () => {
    listCapacity().then((data) => {
      setRows(data)
      setLoading(false)
    })
  }

  useEffect(() => {
    reload()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    setSaving(true)
    try {
      const result = await setPassCapacity({ fecha, cupo_maximo: cupo })
      if (!result.success) {
        setFeedback({ ok: false, text: result.error ?? 'Datos inválidos' })
      } else {
        setFeedback({ ok: true, text: `Cupo de ${fecha} guardado: ${cupo} personas` })
        reload()
      }
    } catch (error) {
      setFeedback({
        ok: false,
        text: error instanceof Error ? error.message : 'Error al guardar el cupo',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSave}
        className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4"
      >
        <div>
          <label htmlFor="capacidad-fecha" className="mb-1.5 block text-sm font-medium">
            Fecha
          </label>
          <input
            type="date"
            id="capacidad-fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="capacidad-cupo" className="mb-1.5 block text-sm font-medium">
            Cupo máximo
          </label>
          <input
            type="number"
            id="capacidad-cupo"
            value={cupo}
            onChange={(e) => setCupo(e.target.value)}
            min={1}
            max={1000}
            required
            className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" disabled={saving || !fecha}>
          {saving ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CalendarCog className="mr-1 h-4 w-4" aria-hidden="true" />
          )}
          Guardar cupo
        </Button>
        {feedback && (
          <p className={`text-sm ${feedback.ok ? 'text-green-700' : 'text-destructive'}`}>
            {feedback.text}
          </p>
        )}
      </form>

      <p className="text-sm text-muted-foreground">
        Las fechas sin cupo configurado usan el default de {CAPACIDAD_DEFAULT_PASADIA} personas. Solo
        aparecen fechas con override o con tickets emitidos.
      </p>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Cargando cupos...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Sin fechas con cupo configurado todavía. Todas usan el default (
            {CAPACIDAD_DEFAULT_PASADIA}).
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cupo</th>
                <th className="px-4 py-3 font-medium">Usado</th>
                <th className="px-4 py-3 font-medium">Disponible</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.fecha} className="border-b last:border-0">
                  <td className="px-4 py-3">{row.fecha}</td>
                  <td className="px-4 py-3">
                    {row.cupo}{' '}
                    {row.esDefault && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        default
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">{row.usado}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.disponible <= 0
                          ? 'font-semibold text-destructive'
                          : row.disponible <= 10
                            ? 'font-semibold text-amber-600'
                            : 'text-green-700'
                      }
                    >
                      {row.disponible}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

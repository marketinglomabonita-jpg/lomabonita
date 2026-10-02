'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCop } from '@/core/lib/money'
import { Button } from '@/core/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/ui/select'
import { crearPasadia } from '../api/acciones'

export type PlanPasadia = {
  slug: string
  nombre: string
  precio: number
}

type Props = {
  /** Día de la pasadía (YYYY-MM-DD), fijo: es el día visto en la página. */
  fecha: string
  /** Planes reales (is_sample = false) con su precio por persona. */
  planes: PlanPasadia[]
}

type Mensaje = { tipo: 'ok' | 'error'; texto: string }

/**
 * Formulario de pasadía desde el día del calendario. El cupo lo garantiza el
 * trigger de la BD: si se supera, la action traduce CUPO_AGOTADO (P0001) al
 * mensaje visible y aquí solo se muestra lo que quedó.
 */
export function CrearPasadiaForm({ fecha, planes }: Props) {
  const router = useRouter()

  const [plan, setPlan] = useState('')
  const [personas, setPersonas] = useState(1)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)

  const planElegido = planes.find((p) => p.slug === plan)
  const totalEstimado = planElegido ? planElegido.precio * personas : null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    setOcupado(true)
    setMensaje(null)

    try {
      const resultado = await crearPasadia({
        fecha,
        plan,
        personas: formData.get('personas'),
        nombre: formData.get('nombre'),
        telefono: formData.get('telefono'),
      })

      if (resultado.success) {
        setMensaje({ tipo: 'ok', texto: 'Pasadía emitida.' })
        e.currentTarget.reset()
        setPlan('')
        setPersonas(1)
        // La página relee el cupo restante y la lista del día.
        router.refresh()
      } else {
        setMensaje({ tipo: 'error', texto: resultado.error })
        router.refresh()
      }
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error instanceof Error ? error.message : 'Error inesperado',
      })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mensaje && (
        <div
          aria-live="polite"
          className={
            mensaje.tipo === 'ok'
              ? 'rounded-lg border bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-100'
              : 'rounded-lg border bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100'
          }
        >
          {mensaje.texto}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Plan</label>
          <Select name="plan" value={plan} onValueChange={(v) => { setPlan(v); setMensaje(null) }} required>
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Selecciona un plan" />
            </SelectTrigger>
            <SelectContent>
              {planes.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>
                  {p.nombre} · {formatCop(p.precio)} por persona
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="pasadia-personas" className="text-sm font-medium">
            Personas
          </label>
          <input
            id="pasadia-personas"
            type="number"
            name="personas"
            required
            min={1}
            max={200}
            value={personas}
            onChange={(e) => setPersonas(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="pasadia-nombre" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="pasadia-nombre"
            type="text"
            name="nombre"
            required
            maxLength={120}
            placeholder="Ej: Familia Gómez"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="pasadia-telefono" className="text-sm font-medium">
            Teléfono
          </label>
          <input
            id="pasadia-telefono"
            type="tel"
            name="telefono"
            required
            maxLength={40}
            placeholder="Ej: 310 555 1234"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {totalEstimado !== null
            ? `Total estimado: ${formatCop(totalEstimado)}`
            : 'El total se calcula por personas × precio del plan'}
        </p>
        <Button type="submit" disabled={ocupado}>
          Agregar pasadía
        </Button>
      </div>
    </form>
  )
}

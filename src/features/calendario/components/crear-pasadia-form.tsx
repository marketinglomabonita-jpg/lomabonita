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
import { AbonoFields } from './abono-fields'

export type PlanPasadia = {
  slug: string
  nombre: string
  precio: number
}

type Props = {
  /** Día de la pasadía (YYYY-MM-DD): el día abierto en el calendario. */
  fecha: string
  /** Planes reales (is_sample = false) con su precio por persona. */
  planes: PlanPasadia[]
  /** Cierra el popup tras emitir con éxito (vivo dentro del modal del día). */
  onDone?: () => void
}

type Mensaje = { tipo: 'ok' | 'error'; texto: string }

/**
 * Formulario de pasadía: vive dentro del popup del día (R3.1a) o embebido en
 * la página del día. El cupo lo garantiza el trigger de la BD: si se supera,
 * la action traduce CUPO_AGOTADO (P0001) al mensaje visible. El total se
 * calcula por personas × precio del plan y alimenta el saldo en vivo de la
 * sección de Abono; sin plan elegido el saldo queda "por definir".
 */
export function CrearPasadiaForm({ fecha, planes, onDone }: Props) {
  const router = useRouter()

  const [plan, setPlan] = useState('')
  const [personas, setPersonas] = useState(1)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)

  const planElegido = planes.find((p) => p.slug === plan)
  const totalEstimado = planElegido ? planElegido.precio * personas : null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Referencia capturada ANTES del await: React anula e.currentTarget
    // después del despacho del evento, y el reset final la necesita.
    const form = e.currentTarget
    const formData = new FormData(form)

    setOcupado(true)
    setMensaje(null)

    try {
      // Abono opcional (R3.1a): mismo contrato que en el form de reserva.
      const abono = formData.get('abono_habilitado')
        ? {
            monto: formData.get('abono_monto'),
            medio: formData.get('abono_medio'),
            comprobante: formData.get('abono_comprobante'),
          }
        : undefined

      const resultado = await crearPasadia({
        fecha,
        plan,
        personas: formData.get('personas'),
        nombre: formData.get('nombre'),
        telefono: formData.get('telefono'),
        abono,
      })

      if (resultado.success) {
        router.refresh()
        if (resultado.aviso) {
          // Éxito parcial: el ticket existe pero el abono no se registró.
          // El popup queda abierto para que el aviso se lea.
          setMensaje({ tipo: 'ok', texto: resultado.aviso })
        } else {
          setMensaje({ tipo: 'ok', texto: 'Pasadía emitida.' })
          form.reset()
          setPlan('')
          setPersonas(1)
          onDone?.()
        }
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

      <AbonoFields valorTotal={totalEstimado} />

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

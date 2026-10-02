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

/** Una línea del grupo: plan elegido + cuántas personas van en él. */
type LineaForm = { plan: string; personas: number }

const LINEA_INICIAL: LineaForm = { plan: '', personas: 1 }

/** La rueda del mouse no cambia el número: suelta el foco y deja scrollear la página. */
const soltarFocoEnRueda = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()

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
 * Formulario de pasadía combinada (R4): un MISMO grupo puede llevar varias
 * líneas, cada una un plan + personas (ej. 3 Loma Relax + 2 Loma Racing), y
 * emite UN solo ticket con el total del grupo. El total mostrado aquí es una
 * ESTIMACIÓN en vivo (plan × personas por línea); la verdad la calcula la
 * action en el servidor con el precio real de pass_products. El cupo lo
 * garantiza el trigger de la BD: si se supera, traduce CUPO_AGOTADO (P0001).
 * El total del grupo alimenta el saldo en vivo de la sección de Abono.
 */
export function CrearPasadiaForm({ fecha, planes, onDone }: Props) {
  const router = useRouter()

  const [lineas, setLineas] = useState<LineaForm[]>([{ ...LINEA_INICIAL }])
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)

  const precioPorPlan = new Map(planes.map((p) => [p.slug, p]))
  const lineaCompleta = (l: LineaForm) => precioPorPlan.has(l.plan) && l.personas >= 1

  const subtotalDe = (l: LineaForm) => {
    const precio = precioPorPlan.get(l.plan)?.precio
    return precio !== undefined ? precio * l.personas : 0
  }
  const hayAlgunaCompleta = lineas.some(lineaCompleta)
  // null = ninguna línea armada: AbonoFields muestra el saldo "por definir".
  const totalEstimado = hayAlgunaCompleta ? lineas.reduce((s, l) => s + subtotalDe(l), 0) : null
  const personasTotales = lineas.reduce((s, l) => s + Math.max(l.personas, 0), 0)

  const actualizarLinea = (indice: number, cambios: Partial<LineaForm>) => {
    setMensaje(null)
    setLineas((prev) => prev.map((l, i) => (i === indice ? { ...l, ...cambios } : l)))
  }

  const agregarLinea = () => setLineas((prev) => [...prev, { ...LINEA_INICIAL }])

  const quitarLinea = (indice: number) => {
    setLineas((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== indice) : prev))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Referencia capturada ANTES del await: React anula e.currentTarget
    // después del despacho del evento, y el reset final la necesita.
    const form = e.currentTarget
    const formData = new FormData(form)

    if (!lineas.every(lineaCompleta)) {
      setMensaje({ tipo: 'error', texto: 'Cada línea necesita un plan y al menos 1 persona' })
      return
    }

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
        // Solo plan y personas: el total lo calcula el servidor.
        lineas: lineas.map((l) => ({ plan: l.plan, personas: l.personas })),
        nombre: formData.get('nombre'),
        telefono: formData.get('telefono'),
        email: formData.get('email'),
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
          setLineas([{ ...LINEA_INICIAL }])
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

      <div className="space-y-3">
        <p className="text-sm font-medium">Planes del grupo</p>

        {lineas.map((linea, indice) => (
          <div key={indice} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label className="text-sm text-muted-foreground">Plan {indice + 1}</label>
              <Select
                value={linea.plan}
                onValueChange={(v) => actualizarLinea(indice, { plan: v })}
                required
              >
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

            <div className="w-24 shrink-0">
              <label htmlFor={`pasadia-personas-${indice}`} className="text-sm text-muted-foreground">
                Personas
              </label>
              <input
                id={`pasadia-personas-${indice}`}
                type="number"
                required
                min={1}
                max={200}
                aria-label={`Personas del plan ${indice + 1}`}
                value={linea.personas}
                onChange={(e) => actualizarLinea(indice, { personas: Number(e.target.value) || 0 })}
                onWheel={soltarFocoEnRueda}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm no-spin"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => quitarLinea(indice)}
              disabled={lineas.length === 1 || ocupado}
              aria-label={`Quitar el plan ${indice + 1}`}
              className="shrink-0"
            >
              Quitar
            </Button>
          </div>
        ))}

        <Button type="button" variant="secondary" size="sm" onClick={agregarLinea} disabled={ocupado}>
          Agregar plan
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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

        <div>
          <label htmlFor="pasadia-email" className="text-sm font-medium">
            Correo electrónico{' '}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="pasadia-email"
            type="email"
            name="email"
            maxLength={120}
            placeholder="cliente@correo.com"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <AbonoFields valorTotal={totalEstimado} />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {totalEstimado !== null ? (
            <>
              Total del grupo: <span className="font-medium tabular-nums">{formatCop(totalEstimado)}</span> ·{' '}
              {personasTotales} {personasTotales === 1 ? 'persona' : 'personas'}
            </>
          ) : (
            'El total se calcula por las personas de cada plan'
          )}
        </p>
        <Button type="submit" disabled={ocupado}>
          Agregar pasadía
        </Button>
      </div>
    </form>
  )
}

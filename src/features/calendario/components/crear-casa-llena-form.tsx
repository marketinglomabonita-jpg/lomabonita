'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/core/ui/button'
import { crearCasaLlena } from '../api/grupos'
import { AbonoFields } from './abono-fields'

type Props = {
  /** Día de llegada por defecto (YYYY-MM-DD): el día abierto en el calendario. */
  fecha: string
  /** Salida inicial (= día siguiente de fecha, calculada por quien lo monta). */
  salidaInicial: string
  /** Habitaciones activas de la casa, solo para el aviso de alcance. */
  totalHabitaciones?: number
  /** Cierra el popup tras crear con éxito (vivo dentro del modal del día). */
  onDone?: () => void
}

type Mensaje = { tipo: 'ok' | 'error'; texto: string }

/** La rueda del mouse no cambia el número: suelta el foco y deja scrollear la página. */
const soltarFocoEnRueda = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()

/**
 * Formulario de CASA LLENA: reserva la casa completa a un solo titular — una
 * fila por cada habitación activa, enlazadas por su grupo. No elige
 * habitaciones: las ocupa TODAS en el rango [llegada, salida). Si cualquiera
 * está ocupada, la action rechaza el bloque entero (23P01) y aquí solo se
 * muestra el error sin romper el formulario.
 */
export function CrearCasaLlenaForm({ fecha, salidaInicial, totalHabitaciones, onDone }: Props) {
  const router = useRouter()

  const [llegada, setLlegada] = useState(fecha)
  const [salida, setSalida] = useState(salidaInicial)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)
  // Valor del grupo (opcional, editable): la casa completa se pacta a mano,
  // sin tarifa sugerida; vacío → null ("por definir") como en el hospedaje.
  const [valorTotalTexto, setValorTotalTexto] = useState('')

  const fechasValidas = llegada < salida

  // null = sin valor (o no numérico): AbonoFields muestra el saldo "por definir".
  const valorTotalNum = valorTotalTexto.trim() === '' ? null : Number(valorTotalTexto)
  const valorTotal = valorTotalNum !== null && Number.isFinite(valorTotalNum) ? valorTotalNum : null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    setOcupado(true)
    setMensaje(null)

    try {
      // Abono opcional: mismo armado que crear-reserva-form.tsx — AbonoFields
      // aporta los campos nombrados; con el toggle apagado no vienen y el
      // comprobante viaja como File dentro del objeto abono.
      const abono = formData.get('abono_habilitado')
        ? {
            monto: formData.get('abono_monto'),
            medio: formData.get('abono_medio'),
            comprobante: formData.get('abono_comprobante'),
          }
        : undefined

      const resultado = await crearCasaLlena({
        llegada,
        salida,
        nombre: formData.get('nombre'),
        telefono: formData.get('telefono'),
        email: formData.get('email'),
        valor_total: formData.get('valor_total'),
        abono,
      })

      if (resultado.success) {
        router.refresh()
        if (resultado.aviso) {
          // Éxito parcial: el grupo existe pero el abono no se registró.
          // El popup queda abierto para que el aviso se lea.
          setMensaje({ tipo: 'ok', texto: resultado.aviso })
        } else {
          setMensaje({ tipo: 'ok', texto: 'Casa llena creada: todas las habitaciones quedaron reservadas.' })
          onDone?.()
        }
      } else {
        setMensaje({ tipo: 'error', texto: resultado.error })
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

      <p className="rounded-lg bg-muted/50 p-3 text-sm">
        🏠 Reservas la casa completa:
        {typeof totalHabitaciones === 'number'
          ? ` se ocupan las ${totalHabitaciones} habitaciones activas`
          : ' se ocupan TODAS las habitaciones activas'}{' '}
        entre la llegada y la salida. Si alguna ya está reservada en esas fechas, no se crea nada.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="casa-llegada" className="text-sm font-medium">
            Llegada
          </label>
          <input
            id="casa-llegada"
            type="date"
            required
            value={llegada}
            onChange={(e) => {
              setLlegada(e.target.value)
              setMensaje(null)
            }}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="casa-salida" className="text-sm font-medium">
            Salida
          </label>
          <input
            id="casa-salida"
            type="date"
            required
            min={llegada}
            value={salida}
            onChange={(e) => {
              setSalida(e.target.value)
              setMensaje(null)
            }}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
          {!fechasValidas && (
            <p className="mt-1 text-xs text-red-900 dark:text-red-100">
              La salida debe ser posterior a la llegada
            </p>
          )}
        </div>

        <div>
          <label htmlFor="casa-nombre" className="text-sm font-medium">
            Nombre del titular
          </label>
          <input
            id="casa-nombre"
            type="text"
            name="nombre"
            required
            maxLength={120}
            placeholder="Ej: Empresa Andina"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="casa-telefono" className="text-sm font-medium">
            Teléfono <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="casa-telefono"
            type="tel"
            name="telefono"
            maxLength={40}
            placeholder="Ej: 310 555 1234"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="casa-email" className="text-sm font-medium">
            Correo electrónico <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="casa-email"
            type="email"
            name="email"
            maxLength={120}
            placeholder="titular@correo.com"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="casa-valor" className="text-sm font-medium">
            Valor total <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="casa-valor"
            type="number"
            name="valor_total"
            min={0}
            step="0.01"
            placeholder="Por definir"
            value={valorTotalTexto}
            onChange={(e) => {
              setValorTotalTexto(e.target.value)
              setMensaje(null)
            }}
            onWheel={soltarFocoEnRueda}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm no-spin"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Valor pactado por la casa completa; ajustable después desde el bloque del grupo
          </p>
        </div>
      </div>

      <AbonoFields valorTotal={valorTotal} />

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={ocupado || !fechasValidas}>
          Reservar casa llena
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/core/ui/button'
import { crearReservaAlojamiento, consultarHabitacionesLibres } from '../api/acciones'
import type { HabitacionLibre } from '../api/dia'
import { AbonoFields } from './abono-fields'

type Props = {
  /** Día de llegada por defecto (YYYY-MM-DD): el día abierto en el calendario. */
  fecha: string
  /** Salida inicial (= día siguiente de fecha, calculada por quien lo monta). */
  salidaInicial: string
  /** Habitaciones libres para [fecha, salidaInicial), armadas por quien lo monta. */
  habitacionesLibres: HabitacionLibre[]
  /** Cierra el popup tras crear con éxito (vivo dentro del modal del día). */
  onDone?: () => void
}

type Mensaje = { tipo: 'ok' | 'error'; texto: string }

/**
 * Formulario de reserva de alojamiento: vive dentro del popup del día
 * (R3.1a) o embebido en la página del día. El selector solo ofrece
 * habitaciones LIBRES para el rango elegido; si aun así alguien la ocupa a
 * la vez, la restricción de exclusión de la BD rechaza el insert y la action
 * traduce el error 23P01 al mensaje visible. Incluye valor total y la
 * sección de Abono con saldo en vivo (AbonoFields).
 */
export function CrearReservaForm({ fecha, salidaInicial, habitacionesLibres, onDone }: Props) {
  const router = useRouter()
  const consultaId = useRef(0)

  const [llegada, setLlegada] = useState(fecha)
  const [salida, setSalida] = useState(salidaInicial)
  const [libres, setLibres] = useState<HabitacionLibre[]>(habitacionesLibres)
  const [recargando, setRecargando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)
  const [valorTotalTexto, setValorTotalTexto] = useState('')

  const fechasValidas = llegada < salida

  // null = sin valor (o no numérico): AbonoFields muestra el saldo "por definir".
  const valorTotalNum = valorTotalTexto.trim() === '' ? null : Number(valorTotalTexto)
  const valorTotal = valorTotalNum !== null && Number.isFinite(valorTotalNum) ? valorTotalNum : null

  // Reconsulta las libres cuando cambia el rango (cuenta de consultas para
  // ignorar respuestas viejas si el usuario sigue editando).
  const recargarLibres = async (checkIn: string, checkOut: string) => {
    if (!(checkIn < checkOut)) return

    const id = ++consultaId.current
    setRecargando(true)
    try {
      const nuevas = await consultarHabitacionesLibres(checkIn, checkOut)
      if (id === consultaId.current) setLibres(nuevas)
    } catch {
      if (id === consultaId.current) setLibres([])
    } finally {
      if (id === consultaId.current) setRecargando(false)
    }
  }

  const handleLlegada = (valor: string) => {
    setLlegada(valor)
    setMensaje(null)
    void recargarLibres(valor, salida)
  }

  const handleSalida = (valor: string) => {
    setSalida(valor)
    setMensaje(null)
    void recargarLibres(llegada, valor)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    setOcupado(true)
    setMensaje(null)

    try {
      // Abono opcional (R3.1a): AbonoFields aporta los campos nombrados; si
      // el toggle quedó apagado no vienen y se envía undefined. El monto y
      // el medio los valida la action con Zod.
      const abono = formData.get('abono_habilitado')
        ? {
            monto: formData.get('abono_monto'),
            medio: formData.get('abono_medio'),
            comprobante: formData.get('abono_comprobante'),
          }
        : undefined

      const resultado = await crearReservaAlojamiento({
        room_id: formData.get('room_id'),
        llegada,
        salida,
        adultos: formData.get('adultos'),
        ninos: formData.get('ninos'),
        nombre: formData.get('nombre'),
        telefono: formData.get('telefono'),
        valor_total: formData.get('valor_total'),
        abono,
      })

      if (resultado.success) {
        router.refresh()
        if (resultado.aviso) {
          // Éxito parcial: la reserva existe pero el abono no se registró.
          // El popup queda abierto para que el aviso se lea.
          setMensaje({ tipo: 'ok', texto: resultado.aviso })
          await recargarLibres(llegada, salida)
        } else {
          setMensaje({ tipo: 'ok', texto: 'Reserva creada y confirmada.' })
          onDone?.()
          await recargarLibres(llegada, salida)
        }
      } else {
        setMensaje({ tipo: 'error', texto: resultado.error })
        router.refresh()
        await recargarLibres(llegada, salida)
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
        <div>
          <label htmlFor="reserva-llegada" className="text-sm font-medium">
            Llegada
          </label>
          <input
            id="reserva-llegada"
            type="date"
            required
            value={llegada}
            onChange={(e) => handleLlegada(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="reserva-salida" className="text-sm font-medium">
            Salida
          </label>
          <input
            id="reserva-salida"
            type="date"
            required
            min={llegada}
            value={salida}
            onChange={(e) => handleSalida(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="reserva-adultos" className="text-sm font-medium">
            Adultos
          </label>
          <input
            id="reserva-adultos"
            type="number"
            name="adultos"
            required
            min={1}
            max={50}
            defaultValue={2}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="reserva-ninos" className="text-sm font-medium">
            Niños
          </label>
          <input
            id="reserva-ninos"
            type="number"
            name="ninos"
            min={0}
            max={50}
            defaultValue={0}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="reserva-nombre" className="text-sm font-medium">
            Nombre del huésped
          </label>
          <input
            id="reserva-nombre"
            type="text"
            name="nombre"
            required
            maxLength={120}
            placeholder="Ej: Familia Pérez"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="reserva-telefono" className="text-sm font-medium">
            Teléfono
          </label>
          <input
            id="reserva-telefono"
            type="tel"
            name="telefono"
            required
            maxLength={40}
            placeholder="Ej: 310 555 1234"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="reserva-valor" className="text-sm font-medium">
            Valor total (opcional)
          </label>
          <input
            id="reserva-valor"
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
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="reserva-habitacion" className="text-sm font-medium">
            Habitación {recargando ? '(actualizando…)' : ''}
          </label>
          <select
            id="reserva-habitacion"
            name="room_id"
            required
            disabled={recargando || !fechasValidas}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {!fechasValidas ? (
              <option value="">Corrige las fechas</option>
            ) : libres.length === 0 ? (
              <option value="">Sin habitaciones libres en esas fechas</option>
            ) : (
              libres.map((h) => (
                <option key={h.id} value={h.id}>
                  Hab. {h.numero} · {h.nombre}
                  {h.capacidad ? ` (hasta ${h.capacidad} personas)` : ''}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <AbonoFields valorTotal={valorTotal} />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {fechasValidas
            ? `${libres.length} habitación(es) libre(s) del ${llegada} al ${salida}`
            : 'La salida debe ser posterior a la llegada'}
        </p>
        <Button type="submit" disabled={ocupado || recargando || !fechasValidas}>
          Crear reserva
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCop } from '@/core/lib/money'
import { Button } from '@/core/ui/button'
import { FREE_CHILD_AGE, PERSON_RATE } from '@/features/hospedaje/data/rooms'
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

const ADULTOS_INICIALES = 2
const NINOS_INICIALES = 0

/** Noches entre dos fechas ISO por partes UTC; 0 si el rango no es válido. */
function nochesEntre(llegada: string, salida: string): number {
  if (!(llegada < salida)) return 0
  const [ai, mi, di] = llegada.split('-').map(Number)
  const [as, ms, ds] = salida.split('-').map(Number)
  return Math.round((Date.UTC(as, ms - 1, ds) - Date.UTC(ai, mi - 1, di)) / 86_400_000)
}

/** Sugerencia por tarifa (R4): personas × PERSON_RATE × noches; null si el rango o la gente no alcanzan para calcularla. */
function sugerenciaDe(llegada: string, salida: string, adultos: number, ninos: number): number | null {
  const personas = adultos + ninos
  if (!(llegada < salida) || personas <= 0) return null
  return personas * PERSON_RATE * nochesEntre(llegada, salida)
}

/**
 * Formulario de reserva de alojamiento: vive dentro del popup del día
 * (R3.1a) o embebido en la página del día. El selector solo ofrece
 * habitaciones LIBRES para el rango elegido; si aun así alguien la ocupa a
 * la vez, la restricción de exclusión de la BD rechaza el insert y la action
 * traduce el error 23P01 al mensaje visible. El valor total se PRE-RELLENA en
 * vivo con la tarifa (personas × PERSON_RATE × noches) y queda editable
 * (R4: menores de 5 gratis, el admin ajusta); alimenta el saldo en vivo de la
 * sección de Abono (AbonoFields). El servidor guarda el valor enviado.
 */
export function CrearReservaForm({ fecha, salidaInicial, habitacionesLibres, onDone }: Props) {
  const router = useRouter()
  const consultaId = useRef(0)

  const [llegada, setLlegada] = useState(fecha)
  const [salida, setSalida] = useState(salidaInicial)
  const [adultos, setAdultos] = useState(ADULTOS_INICIALES)
  const [ninos, setNinos] = useState(NINOS_INICIALES)
  const [libres, setLibres] = useState<HabitacionLibre[]>(habitacionesLibres)
  const [recargando, setRecargando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)
  // Pre-relleno por tarifa (R4): arranca sugiriendo con los valores iniciales
  // y se recalcula en cada evento que la afecta (personas o fechas). El campo
  // queda EDITABLE: menores de FREE_CHILD_AGE no pagan y el admin ajusta a
  // mano antes de guardar; lo escrito dura hasta el próximo cambio de la
  // sugerencia. Event-driven, sin effect (set-state-in-effect del linter).
  const [valorTotalTexto, setValorTotalTexto] = useState(() => {
    const inicial = sugerenciaDe(fecha, salidaInicial, ADULTOS_INICIALES, NINOS_INICIALES)
    return inicial !== null ? String(inicial) : ''
  })

  const fechasValidas = llegada < salida

  /** Re-llena el campo con la tarifa sugerida para los valores NUEVOS dados. */
  const aplicarSugerencia = (l: string, s: string, ad: number, ni: number) => {
    const sugerida = sugerenciaDe(l, s, ad, ni)
    if (sugerida !== null) setValorTotalTexto(String(sugerida))
  }

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
    aplicarSugerencia(valor, salida, adultos, ninos)
    void recargarLibres(valor, salida)
  }

  const handleSalida = (valor: string) => {
    setSalida(valor)
    setMensaje(null)
    aplicarSugerencia(llegada, valor, adultos, ninos)
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
            value={adultos}
            onChange={(e) => {
              const valor = Number(e.target.value) || 0
              setAdultos(valor)
              setMensaje(null)
              aplicarSugerencia(llegada, salida, valor, ninos)
            }}
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
            value={ninos}
            onChange={(e) => {
              const valor = Number(e.target.value) || 0
              setNinos(valor)
              setMensaje(null)
              aplicarSugerencia(llegada, salida, adultos, valor)
            }}
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
            Valor total
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
          <p className="mt-1 text-xs text-muted-foreground">
            Sugerido por tarifa ({formatCop(PERSON_RATE)} por persona por noche); ajusta si hay
            menores de {FREE_CHILD_AGE} años (gratis)
          </p>
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

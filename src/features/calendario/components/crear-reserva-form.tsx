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

/** La rueda del mouse no cambia el número: suelta el foco y deja scrollear la página. */
const soltarFocoEnRueda = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()

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
 * Experiencias sumables a una reserva (R4.A): toda reserva ya incluye Loma
 * Relax (áreas comunes) y solo Balsaje/Cascadas se pueden sumar (Racing queda
 * fuera: tarifa sin definir). El precioBase espeja pass_products (0020) y es
 * solo el PREFIJO del campo: el precio final es editable ("tarifa por
 * confirmar") y lo respeta el servidor.
 */
const EXTRAS_RESERVA = [
  { plan: 'loma-aventura-balsaje', nombre: 'Balsaje', precioBase: 110_000 },
  { plan: 'loma-aventura-cascadas', nombre: 'Cascadas', precioBase: 100_000 },
] as const

type ExtraSlug = (typeof EXTRAS_RESERVA)[number]['plan']

/** Estado de un extra en el formulario: activable, con gente y precio editable. */
type ExtraEnForma = { activo: boolean; personas: number; precioTexto: string }

function extrasIniciales(): Record<ExtraSlug, ExtraEnForma> {
  return Object.fromEntries(
    EXTRAS_RESERVA.map((extra) => [
      extra.plan,
      { activo: false, personas: 2, precioTexto: String(extra.precioBase) },
    ]),
  ) as Record<ExtraSlug, ExtraEnForma>
}

/** Suma de subtotales (personas × precio) de los extras ACTIVOS; un precio no numérico o negativo aporta 0. */
function sumaExtrasDe(estado: Record<ExtraSlug, ExtraEnForma>): number {
  return EXTRAS_RESERVA.reduce((total, { plan }) => {
    const extra = estado[plan]
    if (!extra.activo) return total
    const precio = Number(extra.precioTexto)
    if (!Number.isFinite(precio) || precio < 0) return total
    return total + extra.personas * precio
  }, 0)
}

/**
 * Formulario de reserva de alojamiento: vive dentro del popup del día
 * (R3.1a) o embebido en la página del día. El selector de habitación es el
 * PRIMER campo (las fechas quedan debajo) y solo ofrece habitaciones
 * LIBRES para el rango elegido; si aun así alguien la ocupa a
 * la vez, la restricción de exclusión de la BD rechaza el insert y la action
 * traduce el error 23P01 al mensaje visible. El valor total se PRE-RELLENA en
 * vivo con la tarifa (personas × PERSON_RATE × noches) MÁS los extras
 * marcados (R4.A: Balsaje/Cascadas con precio editable) y queda editable
 * (R4: menores de 5 gratis, el admin ajusta); alimenta el saldo en vivo de la
 * sección de Abono (AbonoFields). El servidor guarda el valor enviado y el
 * desglose de extras en reservations.extras.
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
  // Extras (R4.A): arrancan inactivos con el precio prefijado; cada cambio
  // re-aplica la sugerencia del total (la suma de extras es parte de ella).
  const [extras, setExtras] = useState<Record<ExtraSlug, ExtraEnForma>>(extrasIniciales)

  const fechasValidas = llegada < salida

  /** Suma de extras vigente, para mostrarla en vivo junto al total. */
  const sumaExtras = sumaExtrasDe(extras)

  /** Re-llena el campo con la tarifa sugerida + extras para los valores NUEVOS dados. */
  const aplicarSugerencia = (l: string, s: string, ad: number, ni: number, conExtras = 0) => {
    const sugerida = sugerenciaDe(l, s, ad, ni)
    if (sugerida !== null) setValorTotalTexto(String(sugerida + conExtras))
  }

  /** Actualiza un extra (toggle, personas o precio) y re-aplica el total sugerido con la nueva suma. */
  const actualizarExtra = (plan: ExtraSlug, cambios: Partial<ExtraEnForma>) => {
    const nuevos = { ...extras, [plan]: { ...extras[plan], ...cambios } }
    setExtras(nuevos)
    setMensaje(null)
    aplicarSugerencia(llegada, salida, adultos, ninos, sumaExtrasDe(nuevos))
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
    // Los extras activos NO cambian aquí, pero el total sugerido los incluye.
    aplicarSugerencia(valor, salida, adultos, ninos, sumaExtras)
    void recargarLibres(valor, salida)
  }

  const handleSalida = (valor: string) => {
    setSalida(valor)
    setMensaje(null)
    aplicarSugerencia(llegada, valor, adultos, ninos, sumaExtras)
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

      // Extras activos (R4.A): el valor_total del form ya los trae sumados; el
      // nombre y el subtotal los arma el servidor. Vacío → undefined.
      const extrasActivos = EXTRAS_RESERVA.filter(({ plan }) => extras[plan].activo).map(
        ({ plan }) => ({
          plan,
          personas: extras[plan].personas,
          precio: Number(extras[plan].precioTexto),
        }),
      )

      const resultado = await crearReservaAlojamiento({
        room_id: formData.get('room_id'),
        llegada,
        salida,
        adultos: formData.get('adultos'),
        ninos: formData.get('ninos'),
        nombre: formData.get('nombre'),
        telefono: formData.get('telefono'),
        email: formData.get('email'),
        valor_total: formData.get('valor_total'),
        extras: extrasActivos.length > 0 ? extrasActivos : undefined,
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

      {/* Habitación primero: la lista es la de libres para el rango de fechas
          que se elige más abajo; cambiar llegada/salida la reconsulta. */}
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
        <p className="mt-1 text-xs text-muted-foreground">
          Disponibles para las fechas de abajo ·{' '}
          {fechasValidas
            ? `${libres.length} habitación(es) libre(s) del ${llegada} al ${salida}`
            : 'la salida debe ser posterior a la llegada'}
        </p>
      </div>

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
              aplicarSugerencia(llegada, salida, valor, ninos, sumaExtras)
            }}
            onWheel={soltarFocoEnRueda}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm no-spin"
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
              aplicarSugerencia(llegada, salida, adultos, valor, sumaExtras)
            }}
            onWheel={soltarFocoEnRueda}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm no-spin"
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
          <label htmlFor="reserva-email" className="text-sm font-medium">
            Correo electrónico{' '}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="reserva-email"
            type="email"
            name="email"
            maxLength={120}
            placeholder="cliente@correo.com"
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
            onWheel={soltarFocoEnRueda}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm no-spin"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Sugerido por tarifa ({formatCop(PERSON_RATE)} por persona por noche) más los extras
            marcados; ajusta si hay menores de {FREE_CHILD_AGE} años (gratis)
          </p>
        </div>
      </div>

      {/* Experiencias adicionales (R4.A): Relax va incluido; Balsaje/Cascadas
          activables con gente y precio editable. Los subtotales se muestran en
          vivo y ya viajan sumados dentro del campo valor_total. */}
      <fieldset className="space-y-3 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">Experiencias adicionales (opcional)</legend>

        <p className="text-xs text-muted-foreground">
          Toda reserva incluye Loma Relax (áreas comunes). Puedes sumar:
        </p>

        {EXTRAS_RESERVA.map((extra) => {
          const estado = extras[extra.plan]
          const precio = Number(estado.precioTexto)
          const precioValido = Number.isFinite(precio) && precio >= 0
          return (
            <div key={extra.plan} className="space-y-2 rounded-md border p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={estado.activo}
                  onChange={(e) => actualizarExtra(extra.plan, { activo: e.target.checked })}
                  className="h-4 w-4"
                />
                {extra.nombre} · {formatCop(extra.precioBase)} por persona
              </label>

              {estado.activo && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`extra-personas-${extra.plan}`} className="text-sm font-medium">
                      Personas
                    </label>
                    <input
                      id={`extra-personas-${extra.plan}`}
                      type="number"
                      min={1}
                      max={50}
                      value={estado.personas}
                      onChange={(e) =>
                        actualizarExtra(extra.plan, { personas: Number(e.target.value) || 0 })
                      }
                      onWheel={soltarFocoEnRueda}
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm no-spin"
                    />
                  </div>

                  <div>
                    <label htmlFor={`extra-precio-${extra.plan}`} className="text-sm font-medium">
                      Precio por persona{' '}
                      <span className="text-xs font-normal text-amber-700 dark:text-amber-400">
                        (tarifa por confirmar)
                      </span>
                    </label>
                    <input
                      id={`extra-precio-${extra.plan}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={estado.precioTexto}
                      onChange={(e) =>
                        actualizarExtra(extra.plan, { precioTexto: e.target.value })
                      }
                      onWheel={soltarFocoEnRueda}
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm no-spin"
                    />
                  </div>

                  <p className="text-sm sm:col-span-2">
                    Subtotal:{' '}
                    <span className="font-medium tabular-nums">
                      {formatCop(precioValido ? estado.personas * precio : 0)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )
        })}

        {sumaExtras > 0 && (
          <p aria-live="polite" className="rounded-md bg-muted/50 p-2 text-sm">
            Extras:{' '}
            <span className="font-medium tabular-nums">{formatCop(sumaExtras)}</span> (ya sumados
            al valor total)
          </p>
        )}
      </fieldset>

      <AbonoFields valorTotal={valorTotal} />

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={ocupado || recargando || !fechasValidas}>
          Crear reserva
        </Button>
      </div>
    </form>
  )
}

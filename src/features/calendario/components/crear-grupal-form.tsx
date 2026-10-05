'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/core/ui/button'
import { consultarHabitacionesLibres } from '../api/acciones'
import type { HabitacionLibre } from '../api/dia'
import { crearReservaGrupal } from '../api/grupos'
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

const PARTICIPANTES_INICIALES = 1

/** La rueda del mouse no cambia el número: suelta el foco y deja scrollear la página. */
const soltarFocoEnRueda = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()

/**
 * Formulario de RESERVA GRUPAL: varias habitaciones de un mismo titular bajo
 * un mismo bloque. El grupo elige habitaciones con checkboxes de la lista de
 * LIBRES para el rango (consultarHabitacionesLibres) — cambiar llegada/salida
 * reconsulta desde los handlers (mismo patrón que crear-reserva-form.tsx) y
 * las habitaciones que quedaron ocupadas desaparecen (y se desmarcan si
 * estaban elegidas). El nº de participantes y el dinero del grupo viven en la
 * fila representante; aquí solo se envían valor_total y abono.
 */
export function CrearGrupalForm({ fecha, salidaInicial, habitacionesLibres, onDone }: Props) {
  const router = useRouter()
  const consultaId = useRef(0)

  const [llegada, setLlegada] = useState(fecha)
  const [salida, setSalida] = useState(salidaInicial)
  const [participantes, setParticipantes] = useState(PARTICIPANTES_INICIALES)
  const [libres, setLibres] = useState<HabitacionLibre[]>(habitacionesLibres)
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [recargando, setRecargando] = useState(false)
  const [falloCarga, setFalloCarga] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)
  // Valor del grupo (opcional, editable): se pacta a mano, sin tarifa sugerida.
  const [valorTotalTexto, setValorTotalTexto] = useState('')

  const fechasValidas = llegada < salida

  // null = sin valor (o no numérico): AbonoFields muestra el saldo "por definir".
  const valorTotalNum = valorTotalTexto.trim() === '' ? null : Number(valorTotalTexto)
  const valorTotal = valorTotalNum !== null && Number.isFinite(valorTotalNum) ? valorTotalNum : null

  /**
   * Reconsulta las libres del rango (la cuenta de consultas ignora respuestas
   * viejas si el usuario sigue editando las fechas). Al llegar la lista nueva,
   * las elegidas que desaparecieron (ocupadas en el nuevo rango) se desmarcan.
   */
  const recargarLibres = async (checkIn: string, checkOut: string) => {
    if (!(checkIn < checkOut)) return

    const id = ++consultaId.current
    setRecargando(true)
    try {
      const nuevas = await consultarHabitacionesLibres(checkIn, checkOut)
      if (id !== consultaId.current) return
      setLibres(nuevas)
      setFalloCarga(false)
      const ids = new Set(nuevas.map((h) => h.id))
      setSeleccion((prev) => (prev.size === 0 ? prev : new Set([...prev].filter((x) => ids.has(x)))))
    } catch {
      if (id !== consultaId.current) return
      setLibres([])
      setFalloCarga(true)
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

  const toggleHabitacion = (id: string) => {
    setSeleccion((prev) => {
      const nuevos = new Set(prev)
      if (nuevos.has(id)) nuevos.delete(id)
      else nuevos.add(id)
      return nuevos
    })
    setMensaje(null)
  }

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

      const resultado = await crearReservaGrupal({
        llegada,
        salida,
        roomIds: [...seleccion],
        participantes,
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
          setMensaje({ tipo: 'ok', texto: 'Reserva grupal creada y confirmada.' })
          onDone?.()
        }
      } else {
        setMensaje({ tipo: 'error', texto: resultado.error })
        // La causa más común del error es un solape: recargar las libres
        // muestra la lista real (la habitación ocupada desaparece).
        void recargarLibres(llegada, salida)
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

  const puedeGuardar = fechasValidas && seleccion.size > 0 && participantes >= 1

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

      {/* Habitaciones primero (checkboxes, no un select múltiple: en móvil se
          revisa habitación por habitación y se ve la capacidad de cada una);
          la lista es la de libres para el rango de fechas que se elige abajo. */}
      <fieldset className="space-y-2 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">
          Habitaciones {recargando ? '(actualizando…)' : ''}
        </legend>

        {!fechasValidas ? (
          <p className="text-sm text-muted-foreground">Corrige las fechas para ver habitaciones.</p>
        ) : falloCarga ? (
          <p className="text-sm text-red-900 dark:text-red-100">
            No se pudieron cargar las habitaciones. Cambia las fechas o cierra el popup e intenta de
            nuevo.
          </p>
        ) : libres.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay habitaciones libres en esas fechas.</p>
        ) : (
          <div className="space-y-1">
            {libres.map((h) => (
              <label
                key={h.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={seleccion.has(h.id)}
                  onChange={() => toggleHabitacion(h.id)}
                  className="h-4 w-4"
                />
                <span>
                  Hab. {h.numero} · {h.nombre}
                  {h.capacidad ? ` (hasta ${h.capacidad} personas)` : ''}
                </span>
              </label>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {seleccion.size} elegida(s) ·{' '}
          {fechasValidas
            ? `${libres.length} habitación(es) libre(s) del ${llegada} al ${salida}`
            : 'la salida debe ser posterior a la llegada'}
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="grupal-llegada" className="text-sm font-medium">
            Llegada
          </label>
          <input
            id="grupal-llegada"
            type="date"
            required
            value={llegada}
            onChange={(e) => handleLlegada(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="grupal-salida" className="text-sm font-medium">
            Salida
          </label>
          <input
            id="grupal-salida"
            type="date"
            required
            min={llegada}
            value={salida}
            onChange={(e) => handleSalida(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
          {!fechasValidas && (
            <p className="mt-1 text-xs text-red-900 dark:text-red-100">
              La salida debe ser posterior a la llegada
            </p>
          )}
        </div>

        <div>
          <label htmlFor="grupal-participantes" className="text-sm font-medium">
            Participantes
          </label>
          <input
            id="grupal-participantes"
            type="number"
            required
            min={1}
            max={200}
            value={participantes}
            onChange={(e) => {
              setParticipantes(Number(e.target.value) || 0)
              setMensaje(null)
            }}
            onWheel={soltarFocoEnRueda}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm no-spin"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Personas del grupo (no por habitación)
          </p>
        </div>

        <div>
          <label htmlFor="grupal-nombre" className="text-sm font-medium">
            Nombre del titular
          </label>
          <input
            id="grupal-nombre"
            type="text"
            name="nombre"
            required
            maxLength={120}
            placeholder="Ej: Fundación Semillas"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="grupal-telefono" className="text-sm font-medium">
            Teléfono <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="grupal-telefono"
            type="tel"
            name="telefono"
            maxLength={40}
            placeholder="Ej: 310 555 1234"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="grupal-email" className="text-sm font-medium">
            Correo electrónico <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="grupal-email"
            type="email"
            name="email"
            maxLength={120}
            placeholder="titular@correo.com"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="grupal-valor" className="text-sm font-medium">
            Valor total <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="grupal-valor"
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
            Valor pactado por todo el grupo; ajustable después desde el bloque
          </p>
        </div>
      </div>

      <AbonoFields valorTotal={valorTotal} />

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={ocupado || recargando || !puedeGuardar}>
          Crear reserva grupal
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Pencil, Trash2 } from 'lucide-react'
import { formatCop } from '@/core/lib/money'
import { Badge } from '@/core/ui/badge'
import { Button } from '@/core/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/ui/dialog'
import { consultarHabitacionesLibres } from '../api/acciones'
import type { HabitacionLibre, ReservaDelDia } from '../api/dia'
import type { Resultado } from '../api/comunes'
import { cancelarReserva, editarReserva, eliminarReserva } from '../api/gestion'
import {
  AgregarAbonoDialog,
  ComprobanteLink,
  ConfirmarDialog,
  MensajeFeedback,
  type Mensaje,
} from './gestion-ui'

/**
 * Gestión de una reserva de alojamiento EXISTENTE en el detalle del día (R5):
 * contacto, dinero (total/abonado/saldo, el saldo salta a la vista) y las
 * acciones — abonar, ver comprobantes, editar fechas/habitación, cancelar y
 * eliminar. Toda escritura pasa por las server actions de api/gestion.ts.
 */

type Props = {
  reserva: ReservaDelDia
  /** Habitación donde cuelga hoy (para el selector de edición); null si ya no está activa. */
  habitacionActual: { id: string; numero: number; nombre: string } | null
  /** Día abierto (YYYY-MM-DD): fallback de fechas si el during no parte limpio. */
  fecha: string
}

/** Copia client-safe de diaSiguiente (api/dia.ts importa el cliente de servidor). */
function diaSiguienteDe(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia + 1)).toISOString().slice(0, 10)
}

/** Noches entre dos fechas ISO por partes UTC; 0 si el rango no es válido. */
function nochesEntre(llegada: string, salida: string): number {
  if (!(llegada < salida)) return 0
  const [ai, mi, di] = llegada.split('-').map(Number)
  const [as, ms, ds] = salida.split('-').map(Number)
  return Math.round((Date.UTC(as, ms - 1, ds) - Date.UTC(ai, mi - 1, di)) / 86_400_000)
}

export function GestionReserva({ reserva, habitacionActual, fecha }: Props) {
  const router = useRouter()
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)

  /** Resultado uniforme de las acciones: éxito → mensaje + refresh; fallo → mensaje. */
  const notificar = (resultado: Resultado, exito: string) => {
    if (resultado.success) {
      setMensaje({ tipo: 'ok', texto: resultado.aviso ?? exito })
      router.refresh()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  const noches = reserva.llegada && reserva.salida ? nochesEntre(reserva.llegada, reserva.salida) : 0
  const contacto = [
    reserva.telefono ? `Tel: ${reserva.telefono}` : null,
    reserva.email ? reserva.email : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-3">
      <MensajeFeedback mensaje={mensaje} />

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">{reserva.nombre}</p>
        <Badge
          className={
            reserva.estado === 'confirmada'
              ? 'bg-green-100 text-green-800'
              : 'bg-amber-100 text-amber-800'
          }
        >
          {reserva.estado === 'confirmada' ? 'Confirmada' : 'Solicitada'}
        </Badge>
        {reserva.codigo && (
          <span className="text-xs tabular-nums text-muted-foreground">{reserva.codigo}</span>
        )}
        {!habitacionActual && (
          <Badge className="bg-amber-100 text-amber-800">Sin habitación activa</Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {reserva.llegada && reserva.salida ? (
          <>
            {reserva.llegada} → {reserva.salida} ({noches} {noches === 1 ? 'noche' : 'noches'})
          </>
        ) : (
          'Fechas ilegibles'
        )}
        {contacto && ` · ${contacto}`}
      </p>

      {/* El dinero: total, abonado y el SALDO destacado (verde pagado, ámbar pendiente). */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="text-sm font-medium tabular-nums">
            {reserva.valor_total === null ? 'Por definir' : formatCop(reserva.valor_total)}
          </p>
        </div>
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Abonado</p>
          <p className="text-sm font-medium tabular-nums">{formatCop(reserva.abonado)}</p>
        </div>
        <div
          className={
            reserva.saldo === null
              ? 'rounded-md bg-muted/50 p-2'
              : reserva.saldo === 0
                ? 'rounded-md bg-green-100 p-2 dark:bg-green-950'
                : 'rounded-md bg-amber-100 p-2 dark:bg-amber-950'
          }
        >
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Saldo</p>
          <p className="text-sm font-semibold tabular-nums">
            {reserva.saldo === null
              ? 'Por definir'
              : reserva.saldo === 0
                ? 'Pagado'
                : formatCop(reserva.saldo)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <AgregarAbonoDialog
          destino={{ reservationId: reserva.id }}
          codigo={reserva.codigo ?? 'reserva'}
          saldo={reserva.saldo}
          onResultado={(r) => notificar(r, 'Abono registrado.')}
        />
        <EditarReservaDialog
          reserva={reserva}
          habitacionActual={habitacionActual}
          fecha={fecha}
          notificar={notificar}
        />
        {reserva.comprobantes.map((path, indice) => (
          <ComprobanteLink key={path} path={path} indice={indice + 1} />
        ))}
        <ConfirmarDialog
          etiqueta="Cancelar"
          icono={<Ban aria-hidden />}
          clasesTrigger="text-red-700 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950"
          titulo="¿Cancelar esta reserva?"
          descripcion={`La habitación queda libre de inmediato y el cupo se libera solo. La reserva pasa a «cancelada» y queda en el historial (no se borra).`}
          textoConfirmar="Sí, cancelar"
          onConfirmar={() => cancelarReserva({ id: reserva.id })}
          onResultado={(r) => notificar(r, 'Reserva cancelada. La habitación quedó libre.')}
        />
        <ConfirmarDialog
          fuerte
          etiqueta="Eliminar"
          icono={<Trash2 aria-hidden />}
          clasesTrigger="text-red-700 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950"
          titulo="Eliminar definitivamente"
          descripcion="Borra la reserva y sus abonos de la base de datos. Solo para limpiar datos de prueba: usa «Cancelar» para liberar la habitación conservando el historial."
          textoConfirmar="Eliminar definitivamente"
          onConfirmar={() => eliminarReserva({ id: reserva.id })}
          onResultado={(r) => notificar(r, 'Reserva eliminada.')}
        />
      </div>
    </div>
  )
}

/**
 * Popup de edición de una reserva: habitación + llegada + salida prefijadas
 * con los valores actuales (la action recibe el trío completo, sin ambigüedad
 * de qué conservar). El selector ofrece las libres del rango y SIEMPRE la
 * habitación actual aunque "no esté libre" — la ocupa esta misma reserva. Si
 * el cambio cruza otra reserva, la BD lanza 23P01, la action lo traduce y el
 * mensaje se muestra AQUÍ sin cerrar el popup ni romper nada.
 */
function EditarReservaDialog({
  reserva,
  habitacionActual,
  fecha,
  notificar,
}: {
  reserva: ReservaDelDia
  habitacionActual: { id: string; numero: number; nombre: string } | null
  fecha: string
  notificar: (resultado: Resultado, exito: string) => void
}) {
  // ids únicos por instancia (en la página del día viven varios popups a la vez).
  const prefijoId = useId()
  const idLlegada = `${prefijoId}-llegada`
  const idSalida = `${prefijoId}-salida`
  const idHabitacion = `${prefijoId}-habitacion`

  const [abierto, setAbierto] = useState(false)
  const [llegada, setLlegada] = useState(reserva.llegada ?? fecha)
  const [salida, setSalida] = useState(reserva.salida ?? diaSiguienteDe(fecha))
  // La selección inicial es la habitación listada como actual; si la reserva
  // cuelga de una habitación inactiva (sin habitación), se fuerza a elegir una
  // libre — el room_id huérfano no se reenvía en silencio.
  const [roomId, setRoomId] = useState(habitacionActual?.id ?? '')
  const [libres, setLibres] = useState<HabitacionLibre[]>([])
  const [cargando, setCargando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const consultaId = useRef(0)

  const fechasValidas = llegada < salida

  /** Reconsulta las libres del rango (cuenta de consultas para ignorar respuestas viejas). */
  const cargarLibres = async (checkIn: string, checkOut: string) => {
    if (!(checkIn < checkOut)) return
    const id = ++consultaId.current
    setCargando(true)
    try {
      const nuevas = await consultarHabitacionesLibres(checkIn, checkOut)
      if (id === consultaId.current) setLibres(nuevas)
    } catch {
      if (id === consultaId.current) setLibres([])
    } finally {
      if (id === consultaId.current) setCargando(false)
    }
  }

  const manejarOpen = (valor: boolean) => {
    if (valor) {
      // Prefijado con los valores actuales en cada apertura (los props pudieron cambiar).
      const llegadaInicial = reserva.llegada ?? fecha
      const salidaInicial = reserva.salida ?? diaSiguienteDe(llegadaInicial)
      setLlegada(llegadaInicial)
      setSalida(salidaInicial)
      setRoomId(habitacionActual?.id ?? '')
      setLibres([])
      setError(null)
      void cargarLibres(llegadaInicial, salidaInicial)
    }
    setAbierto(valor)
  }

  const manejarLlegada = (valor: string) => {
    setLlegada(valor)
    setError(null)
    void cargarLibres(valor, salida)
  }

  const manejarSalida = (valor: string) => {
    setSalida(valor)
    setError(null)
    void cargarLibres(llegada, valor)
  }

  const guardar = async () => {
    if (!fechasValidas || roomId === '') return
    setOcupado(true)
    setError(null)
    try {
      const resultado = await editarReserva({ id: reserva.id, room_id: roomId, llegada, salida })
      if (resultado.success) {
        setAbierto(false)
        notificar(resultado, 'Reserva actualizada.')
      } else {
        // p.ej. el cruce con otra reserva (23P01 traducido): se queda abierto para corregir.
        setError(resultado.error)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setOcupado(false)
    }
  }

  // La habitación actual siempre es opción válida (la ocupa esta reserva), aunque
  // consultarHabitacionesLibres no la listaría por estar "ocupada" por ella misma.
  const actualEnLibres = habitacionActual !== null && libres.some((h) => h.id === habitacionActual.id)

  return (
    <Dialog open={abierto} onOpenChange={manejarOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Pencil aria-hidden />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Editar reserva · {reserva.codigo ?? reserva.nombre}</DialogTitle>
          <DialogDescription>
            Mueve fechas o habitación. Si el cambio cruza otra reserva, te avisamos sin perder nada.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg border bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={idLlegada} className="text-sm font-medium">
              Llegada
            </label>
            <input
              id={idLlegada}
              type="date"
              required
              value={llegada}
              onChange={(e) => manejarLlegada(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor={idSalida} className="text-sm font-medium">
              Salida
            </label>
            <input
              id={idSalida}
              type="date"
              required
              min={llegada}
              value={salida}
              onChange={(e) => manejarSalida(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor={idHabitacion} className="text-sm font-medium">
              Habitación {cargando ? '(actualizando…)' : ''}
            </label>
            <select
              id={idHabitacion}
              required
              value={roomId}
              disabled={cargando || !fechasValidas}
              onChange={(e) => setRoomId(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {!fechasValidas ? (
                <option value="">Corrige las fechas</option>
              ) : (
                <>
                  {roomId === '' && <option value="">Elige la habitación</option>}
                  {habitacionActual && !actualEnLibres && (
                    <option value={habitacionActual.id}>
                      Hab. {habitacionActual.numero} · {habitacionActual.nombre} (actual)
                    </option>
                  )}
                  {libres.map((h) => (
                    <option key={h.id} value={h.id}>
                      Hab. {h.numero} · {h.nombre}
                      {h.capacidad ? ` (hasta ${h.capacidad} personas)` : ''}
                    </option>
                  ))}
                </>
              )}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {fechasValidas
                ? `${libres.length} libre(s) en esas fechas${
                    habitacionActual && !actualEnLibres ? ' + la habitación actual' : ''
                  }`
                : 'La salida debe ser posterior a la llegada'}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAbierto(false)}>
            Volver
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={guardar}
            disabled={ocupado || cargando || !fechasValidas || roomId === ''}
          >
            {ocupado ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

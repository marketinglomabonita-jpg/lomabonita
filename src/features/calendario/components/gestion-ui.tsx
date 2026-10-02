'use client'

import { useId, useState } from 'react'
import { Banknote, Check, FileText, LogIn, Undo2 } from 'lucide-react'
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
import { registrarAbono, urlComprobante } from '../api/acciones'
import type { Resultado } from '../api/comunes'

/**
 * Piezas compartidas por la gestión de reservas y pasadías existentes (R5):
 * caja de feedback, enlace a comprobante por URL firmada, control de llegada
 * (check-in), popup de abono y popup de confirmación (con modo "fuerte" para
 * el eliminar definitivo). Toda escritura pasa por las server actions; aquí
 * solo se orquesta la UI.
 */

/** Mensaje uniforme de las acciones de gestión (mismo patrón que los formularios de crear). */
export type Mensaje = { tipo: 'ok' | 'error'; texto: string }

/** Caja de feedback verde/roja, idéntica a la de los formularios de crear. */
export function MensajeFeedback({ mensaje }: { mensaje: Mensaje | null }) {
  if (!mensaje) return null
  return (
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
  )
}

/**
 * Enlace a un comprobante del bucket privado: al hacer clic pide la URL
 * firmada (dura 2 minutos) y la abre en pestaña nueva. La pestaña se abre EN
 * el gesto del clic y se navega después del await — window.open tras un await
 * pierde la activación del usuario y los navegadores lo bloquean como popup.
 */
export function ComprobanteLink({ path, indice }: { path: string; indice: number }) {
  const [ocupado, setOcupado] = useState(false)
  const [fallo, setFallo] = useState(false)

  const abrir = async () => {
    setOcupado(true)
    setFallo(false)
    const pestana = window.open('', '_blank')
    try {
      const url = await urlComprobante(path)
      if (url && pestana) {
        pestana.opener = null
        pestana.location.href = url
      } else {
        pestana?.close()
        setFallo(true)
      }
    } catch {
      pestana?.close()
      setFallo(true)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-start">
      <Button type="button" variant="outline" size="sm" onClick={abrir} disabled={ocupado}>
        <FileText aria-hidden />
        {ocupado ? 'Abriendo…' : `Comprobante ${indice}`}
      </Button>
      {fallo && (
        <span className="mt-1 text-xs text-red-700 dark:text-red-200">
          No se pudo abrir el comprobante
        </span>
      )}
    </span>
  )
}

/** Hora local del check-in ("03:47 p. m."); con día y mes si no fue hoy. */
function momentoLlegadaLegible(checkinAt: string): string {
  const momento = new Date(checkinAt)
  if (Number.isNaN(momento.getTime())) return ''
  const hoy = new Date()
  const esHoy =
    momento.getFullYear() === hoy.getFullYear() &&
    momento.getMonth() === hoy.getMonth() &&
    momento.getDate() === hoy.getDate()
  return esHoy
    ? momento.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : momento.toLocaleString('es-CO', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
}

/**
 * Control de llegada (check-in) compartido por reservas y pasadías: si nadie
 * ha llegado, un botón «Marcar llegada» relleno — estado operativo del día,
 * distinto de las acciones de dinero que van en outline. Si ya llegó, el
 * badge verde «Llegó» con la hora y un «Deshacer llegada» discreto para
 * revertir una marca puesta por error. Las server actions llegan como
 * callbacks (la reserva o la pasadía saben cuál es la suya) y el resultado
 * sube por `onResultado` al MensajeFeedback de la tarjeta, que refresca.
 */
export function ControlLlegada({
  checkinAt,
  onMarcar,
  onDeshacer,
  onResultado,
}: {
  /** Momento ISO de la llegada real; null si aún no ha llegado. */
  checkinAt: string | null
  onMarcar: () => Promise<Resultado>
  onDeshacer: () => Promise<Resultado>
  onResultado: (resultado: Resultado, accion: 'marcar' | 'deshacer') => void
}) {
  const [ocupado, setOcupado] = useState(false)

  const ejecutar = async (accion: 'marcar' | 'deshacer') => {
    if (ocupado) return
    setOcupado(true)
    try {
      onResultado(accion === 'marcar' ? await onMarcar() : await onDeshacer(), accion)
    } catch (e) {
      onResultado(
        { success: false, error: e instanceof Error ? e.message : 'Error inesperado' },
        accion,
      )
    } finally {
      setOcupado(false)
    }
  }

  if (checkinAt === null) {
    return (
      <Button type="button" size="sm" onClick={() => ejecutar('marcar')} disabled={ocupado}>
        <LogIn aria-hidden />
        {ocupado ? 'Marcando…' : 'Marcar llegada'}
      </Button>
    )
  }

  const hora = momentoLlegadaLegible(checkinAt)
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge className="bg-green-100 text-green-800">
        <Check aria-hidden className="mr-1 size-3.5" />
        Llegó{hora && ` · ${hora}`}
      </Badge>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => ejecutar('deshacer')}
        disabled={ocupado}
      >
        <Undo2 aria-hidden />
        {ocupado ? 'Deshaciendo…' : 'Deshacer llegada'}
      </Button>
    </span>
  )
}

/** Medios de pago del abono; espejo del enum validado en api/acciones.ts. */
const MEDIOS_ABONO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'datáfono', label: 'Datáfono' },
  { value: 'otro', label: 'Otro' },
] as const

/** La rueda del mouse no cambia el número: suelta el foco y deja scrollear la página. */
const soltarFocoEnRueda = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()

/** Un abono apunta a una reserva O a una pasadía (XOR que valida registrarAbono). */
export type DestinoAbono = { reservationId: string } | { ticketId: string }

/**
 * Popup "Agregar abono" para una reserva o pasadía EXISTENTE: monto + medio,
 * comprobante opcional y el saldo que quedaría, en vivo. El comprobante viaja
 * como File a registrarAbono, que lo sube al bucket privado (misma ruta que el
 * abono al crear).
 */
export function AgregarAbonoDialog({
  destino,
  codigo,
  saldo,
  onResultado,
}: {
  destino: DestinoAbono
  /** Código legible del destino (R-XXXXXX / PD-XXXXXX) para el título. */
  codigo: string
  /** Saldo pendiente actual; null = sin valor total definido. */
  saldo: number | null
  onResultado: (resultado: Resultado) => void
}) {
  const idMonto = useId()
  const idMedio = useId()
  const idComprobante = useId()
  const [abierto, setAbierto] = useState(false)
  const [montoTexto, setMontoTexto] = useState('')
  const [medio, setMedio] = useState<string>('efectivo')
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const montoNum = Number(montoTexto)
  const montoValido = montoTexto.trim() !== '' && Number.isFinite(montoNum) && montoNum > 0
  const resto =
    saldo === null ? null : Math.round((saldo - (montoValido ? montoNum : 0)) * 100) / 100

  const manejarOpen = (valor: boolean) => {
    if (valor) {
      setMontoTexto('')
      setMedio('efectivo')
      setComprobante(null)
      setError(null)
    }
    setAbierto(valor)
  }

  const guardar = async () => {
    if (!montoValido) return
    setOcupado(true)
    setError(null)
    try {
      const resultado = await registrarAbono({
        ...destino,
        monto: montoNum,
        medio,
        comprobante,
      })
      if (resultado.success) {
        setAbierto(false)
        onResultado(resultado)
      } else {
        setError(resultado.error)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={manejarOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Banknote aria-hidden />
          Abonar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Agregar abono · {codigo}</DialogTitle>
          <DialogDescription>
            Registra un pago a esta {'reservationId' in destino ? 'reserva' : 'pasadía'}; el saldo
            se actualiza al guardar.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg border bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor={idMonto} className="text-sm font-medium">
              Monto del abono
            </label>
            <input
              id={idMonto}
              type="number"
              min="0.01"
              step="0.01"
              required
              inputMode="decimal"
              placeholder="Ej: 100000"
              value={montoTexto}
              onChange={(e) => {
                setMontoTexto(e.target.value)
                setError(null)
              }}
              onWheel={soltarFocoEnRueda}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm no-spin"
            />
          </div>

          <div>
            <label htmlFor={idMedio} className="text-sm font-medium">
              Medio de pago
            </label>
            <select
              id={idMedio}
              value={medio}
              onChange={(e) => setMedio(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {MEDIOS_ABONO.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={idComprobante} className="text-sm font-medium">
              Comprobante{' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <input
              id={idComprobante}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => {
                setComprobante(e.target.files?.[0] ?? null)
                setError(null)
              }}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Imagen o PDF del pago (máx. 5 MB). Se guarda en el bucket privado.
            </p>
          </div>

          <p aria-live="polite" className="rounded-md bg-muted/50 p-2 text-sm">
            {saldo === null ? (
              'Sin valor total definido: el saldo seguirá por definir.'
            ) : resto !== null && resto < 0 ? (
              <>Este abono supera el saldo pendiente por {formatCop(-resto)}</>
            ) : (
              <>
                Saldo quedaría:{' '}
                <span className="font-medium tabular-nums">{formatCop(resto ?? saldo)}</span>
              </>
            )}
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAbierto(false)}>
            Volver
          </Button>
          <Button type="button" size="sm" onClick={guardar} disabled={ocupado || !montoValido}>
            {ocupado ? 'Guardando…' : 'Registrar abono'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Confirmación en popup para las acciones delicadas (cancelar / eliminar).
 * Con `fuerte` (eliminar definitivo) se exige marcar un checkbox que habilita
 * el botón rojo: la confirmación de borrar de verdad cuesta más que un clic.
 */
export function ConfirmarDialog({
  etiqueta,
  clasesTrigger,
  icono,
  titulo,
  descripcion,
  textoConfirmar,
  fuerte = false,
  onConfirmar,
  onResultado,
}: {
  etiqueta: string
  clasesTrigger?: string
  icono?: React.ReactNode
  titulo: string
  descripcion: string
  textoConfirmar: string
  fuerte?: boolean
  onConfirmar: () => Promise<Resultado>
  onResultado: (resultado: Resultado) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [marcado, setMarcado] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const manejarOpen = (valor: boolean) => {
    if (valor) {
      setMarcado(false)
      setError(null)
    }
    setAbierto(valor)
  }

  const confirmar = async () => {
    setOcupado(true)
    setError(null)
    try {
      const resultado = await onConfirmar()
      if (resultado.success) {
        setAbierto(false)
        onResultado(resultado)
      } else {
        setError(resultado.error)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={manejarOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className={clasesTrigger}>
          {icono}
          {etiqueta}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className={fuerte ? 'text-red-700 dark:text-red-200' : undefined}>
            {titulo}
          </DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg border bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
            {error}
          </p>
        )}

        {fuerte && (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={marcado}
              onChange={(e) => setMarcado(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            Entiendo que se borra definitivamente y no se puede deshacer
          </label>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAbierto(false)}>
            Volver
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={confirmar}
            disabled={ocupado || (fuerte && !marcado)}
            className={
              fuerte ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600' : undefined
            }
          >
            {ocupado ? 'Procesando…' : textoConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

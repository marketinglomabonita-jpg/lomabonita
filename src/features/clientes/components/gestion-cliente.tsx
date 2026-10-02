'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
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
import type { Resultado } from '@/features/calendario/api/comunes'
import { editarCliente, eliminarCliente } from '../api/actions'
import type { Cliente } from '../api/queries'

/**
 * Gestión de un cliente del directorio (Habeas Data, Ley 1581 de 2012):
 * corregir sus datos de contacto (popup de edición) o suprimirlo con todo su
 * historial (popup de confirmación fuerte: la eliminación es permanente y se
 * exige marcar un checkbox para habilitar el botón rojo). Toda escritura pasa
 * por las server actions de api/actions.ts (staff + Zod + auditoría); aquí
 * solo se orquesta la UI.
 */

/** Mensaje uniforme de las acciones (mismo patrón que el calendario). */
type Mensaje = { tipo: 'ok' | 'error'; texto: string }

/** "1 reserva de hospedaje" / "3 reservas de hospedaje". */
function plural(n: number, singular: string, plural_: string): string {
  return `${n} ${n === 1 ? singular : plural_}`
}

export function GestionCliente({ cliente }: { cliente: Cliente }) {
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

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <EditarClienteDialog
          cliente={cliente}
          onResultado={(resultado) => notificar(resultado, 'Cliente actualizado')}
        />
        <EliminarClienteDialog
          cliente={cliente}
          onResultado={(resultado) => notificar(resultado, 'Cliente eliminado')}
        />
      </div>
      {mensaje && (
        <span
          aria-live="polite"
          className={
            mensaje.tipo === 'ok'
              ? 'text-xs text-green-700 dark:text-green-300'
              : 'text-xs text-red-700 dark:text-red-200'
          }
        >
          {mensaje.texto}
        </span>
      )}
    </div>
  )
}

/** Popup de edición: corrige nombre/correo/teléfono de TODO el grupo del cliente. */
function EditarClienteDialog({
  cliente,
  onResultado,
}: {
  cliente: Cliente
  onResultado: (resultado: Resultado) => void
}) {
  const idNombre = useId()
  const idEmail = useId()
  const idTelefono = useId()
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState(cliente.nombre)
  const [email, setEmail] = useState(cliente.email ?? '')
  const [telefono, setTelefono] = useState(cliente.telefono ?? '')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const manejarOpen = (valor: boolean) => {
    if (valor) {
      setNombre(cliente.nombre)
      setEmail(cliente.email ?? '')
      setTelefono(cliente.telefono ?? '')
      setError(null)
    }
    setAbierto(valor)
  }

  const guardar = async () => {
    if (!nombre.trim()) return
    setOcupado(true)
    setError(null)
    try {
      const resultado = await editarCliente({ clave: cliente.clave, nombre, email, telefono })
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

  const piezas = [
    cliente.reservas > 0 ? plural(cliente.reservas, 'reserva de hospedaje', 'reservas de hospedaje') : null,
    cliente.pasadias > 0 ? plural(cliente.pasadias, 'pasadía', 'pasadías') : null,
  ].filter(Boolean)

  return (
    <Dialog open={abierto} onOpenChange={manejarOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Pencil aria-hidden />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>
            Corrige los datos de {cliente.nombre}. El cambio se aplica a su{' '}
            {piezas.join(' y ')} de una vez.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg border bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor={idNombre} className="text-sm font-medium">
              Nombre
            </label>
            <input
              id={idNombre}
              type="text"
              required
              autoComplete="off"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                setError(null)
              }}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor={idEmail} className="text-sm font-medium">
              Correo{' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <input
              id={idEmail}
              type="email"
              autoComplete="off"
              placeholder="cliente@correo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor={idTelefono} className="text-sm font-medium">
              Teléfono <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <input
              id={idTelefono}
              type="tel"
              autoComplete="off"
              inputMode="tel"
              placeholder="Ej: 311 111 1111"
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value)
                setError(null)
              }}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Dejar el correo o el teléfono vacíos los borra también de todo su historial.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAbierto(false)}>
            Volver
          </Button>
          <Button type="button" size="sm" onClick={guardar} disabled={ocupado || !nombre.trim()}>
            {ocupado ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Popup de supresión (Habeas Data): confirmación fuerte, checkbox obligatorio. */
function EliminarClienteDialog({
  cliente,
  onResultado,
}: {
  cliente: Cliente
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
      const resultado = await eliminarCliente({ clave: cliente.clave })
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

  const piezas = [
    cliente.reservas > 0 ? plural(cliente.reservas, 'reserva de hospedaje', 'reservas de hospedaje') : null,
    cliente.pasadias > 0 ? plural(cliente.pasadias, 'pasadía', 'pasadías') : null,
  ].filter(Boolean)

  return (
    <Dialog open={abierto} onOpenChange={manejarOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-200 dark:hover:bg-red-950"
        >
          <Trash2 aria-hidden />
          Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-red-700 dark:text-red-200">
            Eliminar a {cliente.nombre}
          </DialogTitle>
          <DialogDescription>
            Solicitud de supresión (Habeas Data, Ley 1581 de 2012). Esta acción borra de forma
            permanente todos los datos personales de este cliente y su historial completo.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg border bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
            {error}
          </p>
        )}

        <div className="space-y-1 rounded-lg border bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
          <p className="font-medium">Se eliminarán para siempre:</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {piezas.map((pieza) => (
              <li key={pieza}>Sus {pieza}.</li>
            ))}
            <li>Todos los pagos registrados de ese historial.</li>
          </ul>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={marcado}
            onChange={(e) => setMarcado(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          Entiendo que esta eliminación es permanente y no se puede deshacer
        </label>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAbierto(false)}>
            Volver
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={confirmar}
            disabled={ocupado || !marcado}
            className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
          >
            {ocupado ? 'Eliminando…' : 'Eliminar definitivamente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

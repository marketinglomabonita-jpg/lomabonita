'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Trash2 } from 'lucide-react'
import { formatCop } from '@/core/lib/money'
import { Badge } from '@/core/ui/badge'
import type { PasadiaDelDia } from '../api/dia'
import type { Resultado } from '../api/comunes'
import { cancelarTicket, eliminarTicket } from '../api/gestion'
import {
  AgregarAbonoDialog,
  ComprobanteLink,
  ConfirmarDialog,
  MensajeFeedback,
  type Mensaje,
} from './gestion-ui'

/**
 * Gestión de una pasadía EXISTENTE en el detalle del día (R5): desglose del
 * grupo, dinero (total/abonado/saldo destacado) y las acciones — abonar, ver
 * comprobantes, cancelar (libera el cupo) y eliminar (datos de prueba). No hay
 * edición: las pasadías no se mueven de fecha ni de plan desde aquí.
 */
export function GestionPasadia({ pasadia }: { pasadia: PasadiaDelDia }) {
  const router = useRouter()
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)

  const notificar = (resultado: Resultado, exito: string) => {
    if (resultado.success) {
      setMensaje({ tipo: 'ok', texto: resultado.aviso ?? exito })
      router.refresh()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  const desglose = pasadia.lineas.map((l) => `${l.nombre} ×${l.personas}`).join(' · ')
  const contacto = [
    pasadia.telefono ? `Tel: ${pasadia.telefono}` : null,
    pasadia.email ? pasadia.email : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-3">
      <MensajeFeedback mensaje={mensaje} />

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">{pasadia.nombre}</p>
        <Badge
          className={
            pasadia.estado === 'usado'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-blue-100 text-blue-800'
          }
        >
          {pasadia.estado === 'usado' ? 'Usado' : 'Emitido'}
        </Badge>
        <span className="text-xs tabular-nums text-muted-foreground">{pasadia.codigo}</span>
      </div>

      <p className="text-xs text-muted-foreground">
        {pasadia.personas} {pasadia.personas === 1 ? 'persona' : 'personas'}
        {desglose && ` · ${desglose}`}
        {contacto && ` · ${contacto}`}
      </p>

      {/* El dinero: total, abonado y el SALDO destacado (verde pagado, ámbar pendiente). */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="text-sm font-medium tabular-nums">{formatCop(pasadia.total)}</p>
        </div>
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Abonado</p>
          <p className="text-sm font-medium tabular-nums">{formatCop(pasadia.abonado)}</p>
        </div>
        <div
          className={
            pasadia.saldo === null
              ? 'rounded-md bg-muted/50 p-2'
              : pasadia.saldo === 0
                ? 'rounded-md bg-green-100 p-2 dark:bg-green-950'
                : 'rounded-md bg-amber-100 p-2 dark:bg-amber-950'
          }
        >
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Saldo</p>
          <p className="text-sm font-semibold tabular-nums">
            {pasadia.saldo === null
              ? 'Por definir'
              : pasadia.saldo === 0
                ? 'Pagado'
                : formatCop(pasadia.saldo)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <AgregarAbonoDialog
          destino={{ ticketId: pasadia.id }}
          codigo={pasadia.codigo}
          saldo={pasadia.saldo}
          onResultado={(r) => notificar(r, 'Abono registrado.')}
        />
        {pasadia.comprobantes.map((path, indice) => (
          <ComprobanteLink key={path} path={path} indice={indice + 1} />
        ))}
        <ConfirmarDialog
          etiqueta="Cancelar"
          icono={<Ban aria-hidden />}
          clasesTrigger="text-red-700 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950"
          titulo="¿Cancelar esta pasadía?"
          descripcion={`El cupo de ${pasadia.personas} ${
            pasadia.personas === 1 ? 'persona' : 'personas'
          } se libera de inmediato. La pasadía pasa a «cancelada» y queda en el historial (no se borra).`}
          textoConfirmar="Sí, cancelar"
          onConfirmar={() => cancelarTicket({ id: pasadia.id })}
          onResultado={(r) => notificar(r, 'Pasadía cancelada. El cupo quedó libre.')}
        />
        <ConfirmarDialog
          fuerte
          etiqueta="Eliminar"
          icono={<Trash2 aria-hidden />}
          clasesTrigger="text-red-700 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950"
          titulo="Eliminar definitivamente"
          descripcion="Borra la pasadía y sus abonos de la base de datos. Solo para limpiar datos de prueba: usa «Cancelar» para liberar el cupo conservando el historial."
          textoConfirmar="Eliminar definitivamente"
          onConfirmar={() => eliminarTicket({ id: pasadia.id })}
          onResultado={(r) => notificar(r, 'Pasadía eliminada.')}
        />
      </div>
    </div>
  )
}

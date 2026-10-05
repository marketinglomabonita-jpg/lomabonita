'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Trash2 } from 'lucide-react'
import { formatCop } from '@/core/lib/money'
import { Badge } from '@/core/ui/badge'
import { cancelarGrupo, eliminarGrupo } from '../api/grupos'
import type { Resultado } from '../api/comunes'
import {
  AgregarAbonoDialog,
  ConfirmarDialog,
  MensajeFeedback,
  type Mensaje,
} from './gestion-ui'

/**
 * Resumen de un BLOQUE (Casa llena / Grupal) presente en el día: una ficha
 * única por grupo con su tipo, titular, cuántas habitaciones ocupa hoy, las
 * personas (si es grupal) y el saldo del bloque — que vive en su fila
 * representante (la de menor número), como el dinero en general. Las acciones
 * son de bloque: cancelar TODO por estado (reversible-ish) o eliminar TODO
 * (definitivo, confirmación fuerte); las filas individuales del grupo ya no
 * ofrecen cancelar/eliminar/editar. El abono también es de bloque: apunta a
 * la fila representante, la única que lleva el valor del grupo.
 */

/** Lo que la página del día calcula por cada grupo presente ese día. */
export type BloqueDelDia = {
  grupoId: string
  tipo: 'casa_llena' | 'grupal'
  titular: string
  /** Filas del grupo presentes el día: una por habitación + las sin habitación. */
  habitaciones: number
  /** Personas del grupo; solo lo trae la fila representante de un grupal. */
  participantes: number | null
  /** valor_total − abonado de la fila representante; null = por definir. */
  saldo: number | null
  /** Fila representante (habitación de menor número): destino único de abonos. */
  representanteId: string | null
  representanteCodigo: string | null
  /** "llegada → salida" legible; null si el during no partió limpio. */
  rango: string | null
}

export function GestionBloque({ bloque }: { bloque: BloqueDelDia }) {
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

  const etiquetaTipo = bloque.tipo === 'casa_llena' ? 'Casa llena' : 'Grupo'
  const plural = bloque.habitaciones === 1 ? 'habitación' : 'habitaciones'

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <MensajeFeedback mensaje={mensaje} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-violet-100 text-violet-800">{etiquetaTipo}</Badge>
        <p className="text-sm font-medium">{bloque.titular}</p>
        <span className="text-xs text-muted-foreground">
          {bloque.habitaciones} {plural} este día
          {bloque.participantes !== null && ` · ${bloque.participantes} participantes`}
          {bloque.rango && ` · ${bloque.rango}`}
        </span>
      </div>

      {/* El saldo del bloque (vive en la fila representante), con el mismo
          código de color que el saldo de las reservas individuales. */}
      <div
        className={
          bloque.saldo === null
            ? 'rounded-md bg-muted/50 p-2 text-center'
            : bloque.saldo === 0
              ? 'rounded-md bg-green-100 p-2 text-center dark:bg-green-950'
              : 'rounded-md bg-amber-100 p-2 text-center dark:bg-amber-950'
        }
      >
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Saldo del bloque
        </p>
        <p className="text-sm font-semibold tabular-nums">
          {bloque.saldo === null
            ? 'Por definir'
            : bloque.saldo === 0
              ? 'Pagado'
              : formatCop(bloque.saldo)}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        {/* El dinero del grupo vive en la representante: UN solo botón de abono
            para todo el bloque, no uno por habitación. */}
        {bloque.representanteId && (
          <AgregarAbonoDialog
            destino={{ reservationId: bloque.representanteId }}
            codigo={bloque.representanteCodigo ?? 'bloque'}
            saldo={bloque.saldo}
            onResultado={(r) => notificar(r, 'Abono registrado.')}
          />
        )}
        <ConfirmarDialog
          etiqueta="Cancelar bloque"
          icono={<Ban aria-hidden />}
          clasesTrigger="text-red-700 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950"
          titulo={`¿Cancelar este bloque (${etiquetaTipo.toLowerCase()})?`}
          descripcion="Todo el bloque pasa a «cancelada»: sus habitaciones quedan libres de inmediato y el historial se conserva (no se borra)."
          textoConfirmar="Sí, cancelar bloque"
          onConfirmar={() => cancelarGrupo({ grupo_id: bloque.grupoId })}
          onResultado={(r) => notificar(r, 'Bloque cancelado. Las habitaciones quedaron libres.')}
        />
        <ConfirmarDialog
          fuerte
          etiqueta="Eliminar bloque"
          icono={<Trash2 aria-hidden />}
          clasesTrigger="text-red-700 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950"
          titulo="Eliminar bloque definitivamente"
          descripcion="Borra TODAS las reservas del bloque y sus abonos de la base de datos. Solo para limpiar datos de prueba: usa «Cancelar bloque» para liberar las habitaciones conservando el historial."
          textoConfirmar="Eliminar bloque definitivamente"
          onConfirmar={() => eliminarGrupo({ grupo_id: bloque.grupoId })}
          onResultado={(r) => notificar(r, 'Bloque eliminado.')}
        />
      </div>
    </div>
  )
}

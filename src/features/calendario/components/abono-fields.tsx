'use client'

import { useState } from 'react'
import { formatCop } from '@/core/lib/money'

/** Medios de pago del abono; espejo del enum validado en api/acciones.ts. */
const MEDIOS_ABONO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'datáfono', label: 'Datáfono' },
  { value: 'otro', label: 'Otro' },
] as const

type Props = {
  /** Valor pactado de la reserva o total calculado de la pasadía; null = por definir. */
  valorTotal: number | null
}

/**
 * Bloque reutilizable de abono (R3.1a): toggle "¿ya registró un abono?",
 * monto y medio. El saldo en vivo (valor total − abono) se muestra mientras
 * se escribe; con valor total null muestra "por definir", nunca 0 ni negativo.
 *
 * Autocontenido: los campos van nombrados (abono_habilitado / abono_monto /
 * abono_medio) para que el formulario los lea de los datos del submit; no hay
 * estado compartido con el padre. Sin input de archivo: el comprobante es la
 * pieza siguiente.
 */
export function AbonoFields({ valorTotal }: Props) {
  const [activo, setActivo] = useState(false)
  const [montoTexto, setMontoTexto] = useState('')
  const [medio, setMedio] = useState<string>('efectivo')

  // Con toggle apagado los campos no se renderizan: los datos del submit no
  // los traen y la action recibe abono: undefined.
  const total = valorTotal !== null && Number.isFinite(valorTotal) ? valorTotal : null
  const montoNum = Number(montoTexto)
  const montoValido = montoTexto.trim() !== '' && Number.isFinite(montoNum) && montoNum > 0
  const saldo = total === null ? null : total - (montoValido ? montoNum : 0)

  return (
    <fieldset className="space-y-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">Abono</legend>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="abono_habilitado"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="h-4 w-4"
        />
        ¿Ya registró un abono?
      </label>

      {activo && (
        <>
          <div>
            <label htmlFor="abono-monto" className="text-sm font-medium">
              Monto del abono
            </label>
            <input
              id="abono-monto"
              type="number"
              name="abono_monto"
              min="0.01"
              step="0.01"
              required
              placeholder="Ej: 100000"
              value={montoTexto}
              onChange={(e) => setMontoTexto(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="abono-medio" className="text-sm font-medium">
              Medio de pago
            </label>
            <select
              id="abono-medio"
              name="abono_medio"
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

          <p aria-live="polite" className="rounded-md bg-muted/50 p-2 text-sm">
            {total === null ? (
              'Saldo: por definir (sin valor total)'
            ) : saldo !== null && saldo < 0 ? (
              <>El abono supera el valor total por {formatCop(-saldo)}</>
            ) : (
              <>
                Saldo pendiente:{' '}
                <span className="font-medium tabular-nums">{formatCop(saldo ?? total)}</span>
              </>
            )}
          </p>
        </>
      )}
    </fieldset>
  )
}

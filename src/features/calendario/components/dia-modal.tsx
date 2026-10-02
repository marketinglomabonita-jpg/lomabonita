'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/core/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/core/ui/dialog'
import { consultarHabitacionesLibres } from '../api/acciones'
import type { HabitacionLibre, PlanPasadia } from '../api/dia'
import type { DiaOcupacion } from '../api/queries'
import { CrearPasadiaForm } from './crear-pasadia-form'
import { CrearReservaForm } from './crear-reserva-form'

type Vista = 'menu' | 'hospedaje' | 'pasadia'

type DiaModalContextValue = {
  abrir: (dia: DiaOcupacion) => void
}

const DiaModalContext = createContext<DiaModalContextValue | null>(null)

export function useDiaModal(): DiaModalContextValue {
  const ctx = useContext(DiaModalContext)
  if (!ctx) {
    throw new Error('useDiaModal debe usarse dentro de <DiaModalProvider>')
  }
  return ctx
}

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

const DIAS_SEMANA_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/**
 * Copias client-safe de los helpers de api/dia.ts: ese módulo importa el
 * cliente de servidor de Supabase y no puede entrar al bundle del navegador.
 */
function diaSiguienteDe(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia + 1)).toISOString().slice(0, 10)
}

function fechaLegibleCorta(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()
  return `${DIAS_SEMANA_ES[diaSemana]} ${dia} de ${MESES_ES[mes - 1]}`
}

/** Primer paso del popup: resumen corto del día y los dos botones grandes. */
function MenuDia({ dia, onElegir }: { dia: DiaOcupacion; onElegir: (vista: Vista) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        🛏 {dia.roomsOcupadas} de {dia.totalRooms} habitaciones ocupadas · 🎟 {dia.pasadiaPersonas}{' '}
        de {dia.cupo} personas de pasadía
      </p>

      <div className="grid gap-3">
        <Button type="button" size="lg" onClick={() => onElegir('hospedaje')}>
          Reservar hospedaje
        </Button>
        <Button type="button" size="lg" variant="secondary" onClick={() => onElegir('pasadia')}>
          Reservar pasadía
        </Button>
      </div>

      <Link
        href={`/admin/calendario/dia/${dia.fecha}`}
        className="block text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Ver el detalle completo del día
      </Link>
    </div>
  )
}

/**
 * Paso de hospedaje: carga las habitaciones libres del día recién abierto
 * (rango [fecha, fecha+1)) con la action de lectura y luego monta el
 * formulario; el form mismo reconsulta si el usuario cambia las fechas.
 */
function VistaHospedaje({ fecha, onDone }: { fecha: string; onDone: () => void }) {
  const salidaInicial = diaSiguienteDe(fecha)
  const [libres, setLibres] = useState<HabitacionLibre[] | null>(null)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    // El guard `vivo` ignora respuestas viejas; el estado arranca limpio en
    // cada apertura porque el contenido se remonta con key={nonce}.
    let vivo = true
    consultarHabitacionesLibres(fecha, salidaInicial)
      .then((r) => {
        if (vivo) setLibres(r)
      })
      .catch(() => {
        if (vivo) setFallo(true)
      })
    return () => {
      vivo = false
    }
  }, [fecha, salidaInicial])

  if (fallo) {
    return (
      <p className="text-sm text-red-900 dark:text-red-100">
        No se pudieron cargar las habitaciones libres. Cierra el popup e intenta de nuevo.
      </p>
    )
  }
  if (!libres) {
    return <p className="text-sm text-muted-foreground">Buscando habitaciones libres…</p>
  }

  return (
    <CrearReservaForm
      fecha={fecha}
      salidaInicial={salidaInicial}
      habitacionesLibres={libres}
      onDone={onDone}
    />
  )
}

/**
 * Ventana emergente del día (R3.1a): clic en un día del calendario abre el
 * popup SIN navegar — resumen corto, dos botones ("Reservar hospedaje" /
 * "Reservar pasadía") y el formulario elegido DENTRO del mismo popup.
 *
 * Mismo patrón del cotizador corporativo: Context + Provider + hook, el
 * contenido en un Dialog de Radix (foco atrapado, Escape, scroll bloqueado)
 * responsive con `max-h-[90dvh] overflow-y-auto`. El `nonce` fuerza un
 * remount del contenido en cada apertura: el formulario arranca limpio.
 * El estado vive aquí (cliente); la página sigue siendo Server Component.
 */
export function DiaModalProvider({
  children,
  planes,
}: {
  children: React.ReactNode
  planes: PlanPasadia[]
}) {
  const [open, setOpen] = useState(false)
  const [dia, setDia] = useState<DiaOcupacion | null>(null)
  const [vista, setVista] = useState<Vista>('menu')
  const [nonce, setNonce] = useState(0)

  const abrir = useCallback((d: DiaOcupacion) => {
    setDia(d)
    setVista('menu')
    setNonce((n) => n + 1)
    setOpen(true)
  }, [])

  const cerrar = useCallback(() => setOpen(false), [])

  return (
    <DiaModalContext.Provider value={{ abrir }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto p-5 sm:p-6">
          <DialogTitle className="pr-8 text-lg capitalize">
            {dia ? fechaLegibleCorta(dia.fecha) : 'Día'}
          </DialogTitle>
          {open && dia && (
            <div key={nonce} className="space-y-4">
              {vista === 'menu' && <MenuDia dia={dia} onElegir={setVista} />}
              {vista === 'hospedaje' && <VistaHospedaje fecha={dia.fecha} onDone={cerrar} />}
              {vista === 'pasadia' && (
                <CrearPasadiaForm fecha={dia.fecha} planes={planes} onDone={cerrar} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DiaModalContext.Provider>
  )
}

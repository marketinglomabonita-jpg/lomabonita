'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, type TouchEvent } from 'react'
import type { DiaOcupacion } from '../api/queries'
import { useDiaModal } from './dia-modal'

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

/** Semana de lunes a domingo. */
const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/** Distancia mínima (px) del arrastre para considerarlo un cambio de mes. */
const UMBRAL_SWIPE = 50

/** YYYY-MM desplazado delta meses (maneja el relevo de año). */
function mesDesplazado(mes: string, delta: number): string {
  const [anio, m] = mes.split('-').map(Number)
  const total = anio * 12 + (m - 1) + delta
  const y = Math.floor(total / 12)
  const nm = (total % 12) + 1
  return `${y}-${String(nm).padStart(2, '0')}`
}

function tituloDe(mes: string): string {
  const [anio, m] = mes.split('-').map(Number)
  return `${MESES_ES[m - 1]} ${anio}`
}

/**
 * Cuántas celdas vacías van antes del día 1 para alinear la rejilla
 * (lunes primero). Date.UTC + getUTCDay leen componentes UTC: sin desfase.
 */
function rellenoInicial(mes: string): number {
  const [anio, m] = mes.split('-').map(Number)
  const diaSemana = new Date(Date.UTC(anio, m - 1, 1)).getUTCDay() // 0 = domingo
  return (diaSemana + 6) % 7
}

type Presion = 'baja' | 'media' | 'alta'

/** Misma convención de color del panel: paleta + variantes dark. */
const CLASES_PRESION: Record<Presion, string> = {
  baja: 'border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-900 dark:bg-green-950 dark:hover:bg-green-900/60',
  media:
    'border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:hover:bg-amber-900/60',
  alta:
    'border-red-200 bg-red-100 hover:bg-red-200/70 dark:border-red-900 dark:bg-red-950 dark:hover:bg-red-900/60',
}

/**
 * Semáforo del día:
 *  - verde (baja): el día está libre — 0 habitaciones ocupadas y 0 pasadías.
 *  - rojo (alta): está a tope — habitaciones llenas O cupo de pasadías lleno.
 *  - naranja (media): hay algo reservado (alojamiento o pasadías) pero no está lleno.
 */
function presionDe(dia: DiaOcupacion): Presion {
  const hayActividad = dia.roomsOcupadas > 0 || dia.pasadiaPersonas > 0
  if (!hayActividad) return 'baja'

  const roomsLleno = dia.totalRooms > 0 && dia.roomsOcupadas >= dia.totalRooms
  const pasadiaLleno = dia.cupo > 0 && dia.pasadiaPersonas >= dia.cupo
  if (roomsLleno || pasadiaLleno) return 'alta'

  return 'media'
}

export function CalendarioMes({ mes, dias, hoy }: { mes: string; dias: DiaOcupacion[]; hoy: string }) {
  // R3.1a: el clic en un día ya no navega a /admin/calendario/dia/[fecha]:
  // abre el popup del día (resumen + reservar hospedaje/pasadía dentro).
  const { abrir } = useDiaModal()
  const router = useRouter()
  const inicioToque = useRef<{ x: number; y: number } | null>(null)

  /** Swipe horizontal en móvil: izquierda → mes siguiente, derecha → mes anterior. */
  function alIniciarToque(e: TouchEvent<HTMLDivElement>) {
    const t = e.touches[0]
    inicioToque.current = { x: t.clientX, y: t.clientY }
  }

  /**
   * Evalúa el arrastre al soltar el dedo: exige distancia mínima Y que el
   * movimiento sea predominantemente horizontal, para no confundir el gesto
   * con el scroll vertical de la página ni con el tap que abre un día.
   * Sin preventDefault: el scroll vertical queda 100% nativo.
   */
  function alTerminarToque(e: TouchEvent<HTMLDivElement>) {
    const inicio = inicioToque.current
    inicioToque.current = null
    if (!inicio) return
    const t = e.changedTouches[0]
    const dx = t.clientX - inicio.x
    const dy = t.clientY - inicio.y
    if (Math.abs(dx) < UMBRAL_SWIPE || Math.abs(dx) < Math.abs(dy) * 1.5) return
    router.push(`/admin/calendario?mes=${mesDesplazado(mes, dx < 0 ? 1 : -1)}`)
  }

  function descartarToque() {
    inicioToque.current = null
  }

  return (
    <div
      className="space-y-3"
      onTouchStart={alIniciarToque}
      onTouchEnd={alTerminarToque}
      onTouchCancel={descartarToque}
    >
      {/* Cabecera: mes + navegación (botones táctiles de 44px) */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/admin/calendario?mes=${mesDesplazado(mes, -1)}`}
          aria-label="Mes anterior"
          className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border bg-card px-3 text-2xl leading-none hover:bg-muted active:bg-muted"
        >
          ‹ <span className="hidden text-sm capitalize sm:inline">{tituloDe(mesDesplazado(mes, -1))}</span>
        </Link>
        <h2 className="text-center text-lg font-medium capitalize">{tituloDe(mes)}</h2>
        <Link
          href={`/admin/calendario?mes=${mesDesplazado(mes, 1)}`}
          aria-label="Mes siguiente"
          className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border bg-card px-3 text-2xl leading-none hover:bg-muted active:bg-muted"
        >
          <span className="hidden text-sm capitalize sm:inline">{tituloDe(mesDesplazado(mes, 1))}</span> ›
        </Link>
      </div>

      {/* Pista sutil (solo móvil) de que el calendario se puede deslizar */}
      <p className="text-center text-[10px] text-muted-foreground sm:hidden">
        ‹ desliza para cambiar de mes ›
      </p>

      {/* Rejilla del mes (7 columnas, lunes a domingo) */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium text-muted-foreground sm:text-xs"
          >
            {d}
          </div>
        ))}

        {Array.from({ length: rellenoInicial(mes) }).map((_, i) => (
          <div
            key={`vacio-${i}`}
            aria-hidden
            className="min-h-[52px] rounded-md bg-muted/30 sm:min-h-[72px]"
          />
        ))}

        {dias.map((dia) => {
          const esHoy = dia.fecha === hoy
          return (
            <button
              key={dia.fecha}
              type="button"
              onClick={() => abrir(dia)}
              aria-label={`Día ${dia.fecha}: ${dia.roomsOcupadas} de ${dia.totalRooms} habitaciones ocupadas, ${dia.pasadiaPersonas} de ${dia.cupo} personas de pasadía. Abrir para reservar`}
              className={`flex min-h-[52px] min-w-0 cursor-pointer flex-col justify-between overflow-hidden rounded-md border p-1 text-left sm:min-h-[72px] ${CLASES_PRESION[presionDe(dia)]} ${
                esHoy ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
              }`}
            >
              <span className="text-[10px] font-semibold sm:text-xs">
                {Number(dia.fecha.slice(-2))}
              </span>
              <span className="whitespace-nowrap text-[9px] leading-tight tracking-tight tabular-nums sm:text-[11px]">
                🛏 {dia.roomsOcupadas}/{dia.totalRooms}
              </span>
              <span className="whitespace-nowrap text-[9px] leading-tight tracking-tight tabular-nums sm:text-[11px]">
                🎟 {dia.pasadiaPersonas}/{dia.cupo}
              </span>
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-green-300 bg-green-100 dark:border-green-900 dark:bg-green-950" />
          Libre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-amber-300 bg-amber-100 dark:border-amber-900 dark:bg-amber-950" />
          Con reservas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-red-300 bg-red-200 dark:border-red-900 dark:bg-red-950" />
          Lleno
        </span>
        <span>🛏 habitaciones · 🎟 pasadía</span>
      </div>
    </div>
  )
}

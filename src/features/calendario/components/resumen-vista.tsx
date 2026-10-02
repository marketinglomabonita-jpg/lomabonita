'use client'

import Link from 'next/link'
import { formatCop } from '@/core/lib/money'
// Imports solo-tipo de módulos de servidor: se borran al compilar y no
// arrastran el cliente de Supabase al bundle del navegador.
import type { DetalleDia } from '../api/dia'
import type { SemanaResumen } from '../api/resumen'
import type { DiaOcupacion } from '../api/queries'

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
 * Copias client-safe de los helpers de api/ (mismo criterio que dia-modal):
 * aritmética Date.UTC pura, determinista entre servidor y navegador.
 */
function desplazarDias(fecha: string, delta: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia + delta)).toISOString().slice(0, 10)
}

function nombreDia(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return DIAS_SEMANA_ES[new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()]
}

function fechaCorta(fecha: string): string {
  const [, mes, dia] = fecha.split('-').map(Number)
  return `${Number(dia)} de ${MESES_ES[mes - 1]}`
}

function fechaLarga(fecha: string): string {
  const [anio] = fecha.split('-').map(Number)
  return `${nombreDia(fecha)} ${fechaCorta(fecha)} de ${anio}`
}

/** "Semana del 6 al 12 de octubre de 2026" (o cruzando mes: "…28 de septiembre al 4 de octubre…"). */
function tituloSemana(lunes: string): string {
  const domingo = desplazarDias(lunes, 6)
  const [anioL, mesL, diaL] = lunes.split('-').map(Number)
  const [anioD, mesD, diaD] = domingo.split('-').map(Number)
  if (mesL === mesD && anioL === anioD) {
    return `Semana del ${diaL} al ${diaD} de ${MESES_ES[mesL - 1]} de ${anioL}`
  }
  return `Semana del ${fechaCorta(lunes)} al ${fechaCorta(domingo)} de ${anioD}`
}

type Presion = 'baja' | 'media' | 'alta'

/** Misma convención de color del calendario: paleta + variantes dark. */
const CLASES_PRESION: Record<Presion, string> = {
  baja: 'border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-900 dark:bg-green-950 dark:hover:bg-green-900/60',
  media:
    'border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:hover:bg-amber-900/60',
  alta:
    'border-red-200 bg-red-100 hover:bg-red-200/70 dark:border-red-900 dark:bg-red-950 dark:hover:bg-red-900/60',
}

/**
 * Mismo semáforo del calendario (components/calendario-mes.tsx):
 * verde = día libre, rojo = lleno (habitaciones O cupo de pasadía), naranja = algo reservado sin llenar.
 */
function presionDe(dia: DiaOcupacion): Presion {
  const hayActividad = dia.roomsOcupadas > 0 || dia.pasadiaPersonas > 0
  if (!hayActividad) return 'baja'

  const roomsLleno = dia.totalRooms > 0 && dia.roomsOcupadas >= dia.totalRooms
  const pasadiaLleno = dia.cupo > 0 && dia.pasadiaPersonas >= dia.cupo
  if (roomsLleno || pasadiaLleno) return 'alta'

  return 'media'
}

const CLASES_FLECHA =
  'shrink-0 rounded-md border bg-card px-2 py-1.5 text-sm hover:bg-muted sm:px-3'

export type ResumenVistaProps = {
  vista: 'semana' | 'dia'
  /** Fecha ancla: la semana que la contiene (vista semana) o el día mostrado (vista día). */
  fecha: string
  hoy: string
  semana: SemanaResumen
  /** Solo llega poblado cuando vista === 'dia'; la página lo resuelve en el servidor. */
  detalle: DetalleDia | null
}

/** Botón-toggle Semana/Día: navegación server-first por query param. */
function ToggleVista({ vista, hrefSemana, hrefDia }: { vista: string; hrefSemana: string; hrefDia: string }) {
  const clases = (activa: boolean) =>
    `rounded-[5px] px-3 py-1.5 ${activa ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`
  return (
    <div className="inline-flex rounded-md border bg-card p-0.5 text-sm" role="tablist" aria-label="Vista del resumen">
      <Link href={hrefSemana} role="tab" aria-selected={vista === 'semana'} className={clases(vista === 'semana')}>
        Semana
      </Link>
      <Link href={hrefDia} role="tab" aria-selected={vista === 'dia'} className={clases(vista === 'dia')}>
        Día
      </Link>
    </div>
  )
}

function Leyenda() {
  return (
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
  )
}

/** (A) Los 7 días de una semana navegable, con totales del encabezado. */
function VistaSemana({ semana, hoy }: { semana: SemanaResumen; hoy: string }) {
  const lunes = semana.lunes
  const anterior = desplazarDias(lunes, -7)
  const siguiente = desplazarDias(lunes, 7)

  return (
    <div className="space-y-3">
      {/* Cabecera: semana + navegación */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/admin/resumen?vista=semana&fecha=${anterior}`}
          aria-label="Semana anterior"
          className={CLASES_FLECHA}
        >
          ‹
        </Link>
        <h2 className="text-center text-lg font-medium capitalize">{tituloSemana(lunes)}</h2>
        <Link
          href={`/admin/resumen?vista=semana&fecha=${siguiente}`}
          aria-label="Semana siguiente"
          className={CLASES_FLECHA}
        >
          ›
        </Link>
      </div>

      {/* Totales de la semana */}
      <p className="text-sm text-muted-foreground">
        🛏 {semana.nochesHabitacion} {semana.nochesHabitacion === 1 ? 'noche-habitación' : 'noches-habitación'}{' '}
        ocupadas · 🎟 {semana.pasadiaPersonas}{' '}
        {semana.pasadiaPersonas === 1 ? 'persona' : 'personas'} de pasadía
      </p>

      {/* Los 7 días: cada tarjeta abre ese día en la vista Día */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {semana.dias.map((dia) => {
          const esHoy = dia.fecha === hoy
          const presion = presionDe(dia)
          return (
            <Link
              key={dia.fecha}
              href={`/admin/resumen?vista=dia&fecha=${dia.fecha}`}
              aria-label={`Día ${dia.fecha}: ${dia.roomsOcupadas} de ${dia.totalRooms} habitaciones ocupadas, ${dia.pasadiaPersonas} de ${dia.cupo} personas de pasadía. Abrir detalle`}
              className={`flex min-h-[76px] flex-col justify-between gap-1 rounded-md border p-2 ${CLASES_PRESION[presion]} ${
                esHoy ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
              }`}
            >
              <span className="text-xs font-semibold capitalize">
                {nombreDia(dia.fecha)} {Number(dia.fecha.slice(-2))}
                {presion === 'baja' && (
                  <span className="ml-1 font-medium text-muted-foreground">· libre</span>
                )}
              </span>
              <span className="space-y-0.5 text-xs tabular-nums">
                <span className="block whitespace-nowrap">🛏 {dia.roomsOcupadas}/{dia.totalRooms}</span>
                <span className="block whitespace-nowrap">🎟 {dia.pasadiaPersonas}/{dia.cupo}</span>
              </span>
            </Link>
          )
        })}
      </div>

      <Leyenda />
    </div>
  )
}

/** (B) Detalle de un día: habitaciones con huésped, pasadías con desglose y totales. */
function VistaDia({ fecha, detalle }: { fecha: string; detalle: DetalleDia | null }) {
  const anterior = desplazarDias(fecha, -1)
  const siguiente = desplazarDias(fecha, 1)
  const ocupadas = detalle?.habitaciones.filter((h) => h.ocupadaPor !== null) ?? []
  const libres = detalle ? detalle.habitaciones.length - ocupadas.length : 0
  const personas = detalle?.pasadiaPersonas ?? 0
  const recaudo = detalle?.pasadias.reduce((suma, p) => suma + p.total, 0) ?? 0

  return (
    <div className="space-y-4">
      {/* Cabecera: día + navegación */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/admin/resumen?vista=dia&fecha=${anterior}`}
          aria-label="Día anterior"
          className={CLASES_FLECHA}
        >
          ‹
        </Link>
        <h2 className="text-center text-lg font-medium capitalize">{fechaLarga(fecha)}</h2>
        <Link
          href={`/admin/resumen?vista=dia&fecha=${siguiente}`}
          aria-label="Día siguiente"
          className={CLASES_FLECHA}
        >
          ›
        </Link>
      </div>

      {!detalle ? (
        <p className="text-sm text-muted-foreground">No se pudo cargar el detalle del día.</p>
      ) : (
        <>
          {/* Habitaciones */}
          <section className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h3 className="font-medium">Habitaciones</h3>
              <p className="text-sm text-muted-foreground">
                🛏 {ocupadas.length}/{detalle.habitaciones.length} ocupadas · {libres}{' '}
                {libres === 1 ? 'libre' : 'libres'}
              </p>
            </div>
            <ul className="grid gap-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {detalle.habitaciones.map((h) => (
                <li
                  key={h.id}
                  className={
                    h.ocupadaPor
                      ? 'rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 dark:border-amber-900 dark:bg-amber-950'
                      : 'rounded-md border border-green-200 bg-green-50 px-2.5 py-1.5 text-muted-foreground dark:border-green-900 dark:bg-green-950'
                  }
                >
                  <span className="font-medium">
                    {h.numero}. {h.nombre}
                  </span>
                  <span className="block truncate text-xs">
                    {h.ocupadaPor ?? 'Libre'}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Pasadías */}
          <section className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h3 className="font-medium">Pasadías</h3>
              <p className="text-sm text-muted-foreground">
                🎟 {personas} {personas === 1 ? 'persona' : 'personas'} · {formatCop(recaudo)}
              </p>
            </div>
            {detalle.pasadias.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin pasadías este día.</p>
            ) : (
              <ul className="space-y-2">
                {detalle.pasadias.map((p) => (
                  <li key={p.id} className="rounded-md border px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="font-medium">
                        {p.nombre} <span className="text-xs text-muted-foreground">#{p.codigo}</span>
                      </span>
                      <span className="tabular-nums">
                        {p.personas} {p.personas === 1 ? 'persona' : 'personas'} · {formatCop(p.total)}
                      </span>
                    </div>
                    {p.lineas.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {p.lineas.map((l) => (
                          <li key={`${p.id}-${l.plan}`} className="tabular-nums">
                            {l.nombre}: {l.personas} × {formatCop(l.precio_persona)} = {formatCop(l.subtotal)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Totales + enlace al calendario */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              🛏 {ocupadas.length}/{detalle.habitaciones.length} habitaciones · 🎟 {personas}/
              {personas + detalle.cupoRestante} de cupo · cupo restante: {detalle.cupoRestante}
            </p>
            <Link
              href={`/admin/calendario?mes=${fecha.slice(0, 7)}`}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              Abrir en el calendario →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export function ResumenVista({ vista, fecha, hoy, semana, detalle }: ResumenVistaProps) {
  // Toggle server-first: a Día se salta con hoy si está en la semana vista
  // (o con el lunes de ella si se navega a otra semana); a Semana se vuelve
  // con la semana del día que se esté viendo.
  const fechaDia = semana.dias.some((d) => d.fecha === hoy) ? hoy : semana.lunes
  const hrefSemana = `/admin/resumen?vista=semana&fecha=${fecha}`
  const hrefDia = `/admin/resumen?vista=dia&fecha=${fechaDia}`

  return (
    <div className="space-y-4">
      <ToggleVista vista={vista} hrefSemana={hrefSemana} hrefDia={hrefDia} />
      {vista === 'semana' ? (
        <VistaSemana semana={semana} hoy={hoy} />
      ) : (
        <VistaDia fecha={fecha} detalle={detalle} />
      )}
    </div>
  )
}

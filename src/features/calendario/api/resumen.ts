import { CUPO_DEFAULT_PASADIA, getOcupacionMes, type DiaOcupacion } from './queries'

/**
 * Resumen de una semana (lunes→domingo) para la vista Semana del panel de
 * resumen. Construido SOBRE getOcupacionMes: no reescribe queries, solo
 * resuelve el rango de 7 días (que puede cruzar el borde de mes/año).
 */
export type SemanaResumen = {
  /** Lunes de la semana (YYYY-MM-DD). */
  lunes: string
  /** Los 7 días en orden lunes→domingo. */
  dias: DiaOcupacion[]
  /** Suma de roomsOcupadas de los 7 días (noches-habitación ocupadas). */
  nochesHabitacion: number
  /** Personas de pasadía sumadas de los 7 días. */
  pasadiaPersonas: number
}

/** YYYY-MM-DD desplazado ±n días, por partes UTC (sin desfase de zona). */
export function desplazarDias(fecha: string, delta: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia + delta)).toISOString().slice(0, 10)
}

/** Lunes (YYYY-MM-DD) de la semana que contiene `fecha`. Date.UTC puro. */
export function lunesDe(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay() // 0 = domingo
  return desplazarDias(fecha, -((diaSemana + 6) % 7))
}

/** Fila defensiva para un día que no apareciera en la respuesta (no debería pasar). */
function diaVacio(fecha: string): DiaOcupacion {
  return {
    fecha,
    roomsOcupadas: 0,
    totalRooms: 0,
    pasadiaPersonas: 0,
    cupo: CUPO_DEFAULT_PASADIA,
  }
}

/**
 * Los 7 días de la semana que contiene `fechaDentro` (cualquier día de ella
 * sirve: se resuelve su lunes). Una semana puede cruzar el borde de mes —o de
 * año—, así que se piden los meses que toca, sin duplicar, y se indexa la
 * respuesta por fecha para filtrar exactamente los 7 días.
 */
export async function getResumenSemana(fechaDentro: string): Promise<SemanaResumen> {
  const lunes = lunesDe(fechaDentro)
  const fechas = Array.from({ length: 7 }, (_, i) => desplazarDias(lunes, i))

  const meses = [...new Set(fechas.map((f) => f.slice(0, 7)))]
  const porMes = await Promise.all(
    meses.map((m) => {
      const [anio, mes] = m.split('-').map(Number)
      return getOcupacionMes(anio, mes)
    }),
  )
  const porFecha = new Map(porMes.flat().map((d) => [d.fecha, d]))

  const dias = fechas.map((fecha) => porFecha.get(fecha) ?? diaVacio(fecha))

  return {
    lunes,
    dias,
    nochesHabitacion: dias.reduce((suma, d) => suma + d.roomsOcupadas, 0),
    pasadiaPersonas: dias.reduce((suma, d) => suma + d.pasadiaPersonas, 0),
  }
}

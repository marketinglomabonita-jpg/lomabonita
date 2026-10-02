import ExcelJS from 'exceljs'
import type { DatosReporte, FilaPago, FilaPasadia, FilaReserva } from './datos'

/**
 * Construye el libro Excel del reporte (4 hojas: Resumen, Reservas, Pasadías,
 * Pagos) a partir de los datos ya calculados por datos.ts. Puro formato: aquí
 * no se toca la BD ni se recalcula dinero — solo se presenta.
 *
 * Depende exclusivamente de exceljs + tipos (import type, borrado en runtime),
 * así se puede probar suelto con datos de mentira sin levantar el servidor.
 */

const VERDE = 'FF1F5138' // verde del panel (themeColor del layout admin)
const GRIS = 'FF8A8A8A'
const FORMATO_COP = '"$"#,##0'

const ETIQUETA_PERIODO: Record<string, string> = { dia: 'Día', semana: 'Semana', mes: 'Mes' }

/** Fila de encabezados con el look del panel y el panel congelado. */
function ponerEncabezado(hoja: ExcelJS.Worksheet, columnas: string[]): void {
  const fila = hoja.addRow(columnas)
  fila.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } }
    celda.alignment = { vertical: 'middle' }
  })
  hoja.views = [{ state: 'frozen', ySplit: 1 }]
}

function definirAnchos(hoja: ExcelJS.Worksheet, anchos: number[]): void {
  anchos.forEach((ancho, i) => {
    hoja.getColumn(i + 1).width = ancho
  })
}

/** Celda de dinero: número con formato COP (o texto cuando el valor no existe). */
function celdaDinero(hoja: ExcelJS.Worksheet, fila: number, columna: number, valor: number | null): void {
  const celda = hoja.getCell(fila, columna)
  if (valor === null) {
    celda.value = 'Por definir'
    celda.font = { italic: true, color: { argb: GRIS } }
  } else {
    celda.value = valor
    celda.numFmt = FORMATO_COP
  }
}

/** Fila "Sin datos" cuando el rango no trajo nada para la hoja. */
function ponerSinDatos(hoja: ExcelJS.Worksheet): void {
  const fila = hoja.addRow(['Sin datos'])
  fila.getCell(1).font = { italic: true, color: { argb: GRIS } }
}

/** Marca en gris el estado cancelado/rechazado (la fila queda, el dinero no suma). */
function marcarEstadoInactivo(hoja: ExcelJS.Worksheet, fila: number, columna: number, estado: string): void {
  if (estado === 'cancelada' || estado === 'cancelado' || estado === 'rechazada') {
    hoja.getCell(fila, columna).font = { italic: true, color: { argb: GRIS } }
  }
}

function hojaResumen(libro: ExcelJS.Workbook, datos: DatosReporte): void {
  const hoja = libro.addWorksheet('Resumen')
  definirAnchos(hoja, [52, 24])

  const titulo = hoja.addRow(['Reporte Loma Bonita'])
  titulo.getCell(1).font = { bold: true, size: 14, color: { argb: VERDE } }

  const periodo = ETIQUETA_PERIODO[datos.rango.periodo] ?? datos.rango.periodo
  hoja.addRow(['Período', `${periodo} (${datos.rango.inicio} a ${datos.rango.fin})`])
  hoja.addRow(['Generado', `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`])
  hoja.addRow([])

  const cantidades: Array<[string, number]> = [
    ['Reservas de alojamiento (llegadas en el rango)', datos.resumen.reservas],
    ['Pasadías (fecha en el rango)', datos.resumen.pasadias],
    ['Personas de pasadía (tickets no cancelados)', datos.resumen.personasPasadia],
  ]
  for (const [concepto, valor] of cantidades) {
    hoja.addRow([concepto, valor])
  }

  const dineros: Array<[string, number]> = [
    ['Ingresos esperados (reservas activas + pasadías no canceladas)', datos.resumen.ingresosEsperados],
    ['Total abonado (pagos registrados en el rango)', datos.resumen.abonadoEnRango],
    ['Saldo pendiente (ingresos esperados − abonado del rango)', datos.resumen.saldoPendiente],
    ['Saldo por cobrar del rango (saldos de reservas y pasadías activas)', datos.resumen.saldoPorCobrarRango],
  ]
  hoja.addRow([])
  for (const [concepto, valor] of dineros) {
    const fila = hoja.addRow([concepto])
    celdaDinero(hoja, fila.number, 2, valor)
    fila.getCell(1).alignment = { wrapText: true }
  }

  hoja.addRow([])
  const nota = hoja.addRow([
    'Reservas por fecha de llegada, pasadías por su fecha y pagos por fecha de registro. ' +
      'Las canceladas/rechazadas se listan marcadas y no suman a ingresos.',
  ])
  nota.getCell(1).font = { italic: true, size: 9, color: { argb: GRIS } }
  hoja.mergeCells(nota.number, 1, nota.number, 2)
}

function hojaReservas(libro: ExcelJS.Workbook, reservas: FilaReserva[]): void {
  const hoja = libro.addWorksheet('Reservas')
  definirAnchos(hoja, [14, 26, 30, 22, 12, 12, 12, 14, 14, 14])
  ponerEncabezado(hoja, [
    'Código',
    'Nombre',
    'Contacto',
    'Habitación',
    'Llegada',
    'Salida',
    'Estado',
    'Valor total',
    'Abonado',
    'Saldo',
  ])
  if (reservas.length === 0) {
    ponerSinDatos(hoja)
    return
  }
  for (const r of reservas) {
    const fila = hoja.addRow([
      r.codigo,
      r.nombre,
      r.contacto,
      r.habitacion,
      r.llegada,
      r.salida,
      r.estado,
      null,
      null,
      null,
    ])
    celdaDinero(hoja, fila.number, 8, r.valorTotal)
    celdaDinero(hoja, fila.number, 9, r.abonado)
    celdaDinero(hoja, fila.number, 10, r.saldo)
    marcarEstadoInactivo(hoja, fila.number, 7, r.estado)
  }
}

function hojaPasadias(libro: ExcelJS.Workbook, pasadias: FilaPasadia[]): void {
  const hoja = libro.addWorksheet('Pasadías')
  definirAnchos(hoja, [14, 26, 30, 12, 10, 10, 14, 14, 14, 48])
  ponerEncabezado(hoja, [
    'Código',
    'Nombre',
    'Contacto',
    'Fecha',
    'Personas',
    'Estado',
    'Total',
    'Abonado',
    'Saldo',
    'Planes',
  ])
  if (pasadias.length === 0) {
    ponerSinDatos(hoja)
    return
  }
  for (const p of pasadias) {
    const fila = hoja.addRow([
      p.codigo,
      p.nombre,
      p.contacto,
      p.fecha,
      p.personas,
      p.estado,
      null,
      null,
      null,
      p.planes,
    ])
    celdaDinero(hoja, fila.number, 7, p.total)
    celdaDinero(hoja, fila.number, 8, p.abonado)
    celdaDinero(hoja, fila.number, 9, p.saldo)
    marcarEstadoInactivo(hoja, fila.number, 6, p.estado)
  }
}

function hojaPagos(libro: ExcelJS.Workbook, pagos: FilaPago[]): void {
  const hoja = libro.addWorksheet('Pagos')
  definirAnchos(hoja, [12, 16, 18, 12, 14])
  ponerEncabezado(hoja, ['Fecha', 'Monto', 'Medio', 'Destino', 'Código'])
  if (pagos.length === 0) {
    ponerSinDatos(hoja)
    return
  }
  for (const p of pagos) {
    const fila = hoja.addRow([p.fecha, null, p.medio, p.destino, p.codigo])
    celdaDinero(hoja, fila.number, 2, p.monto)
  }
}

/**
 * Libro completo como Buffer de Node, listo para la respuesta del route
 * handler (Content-Disposition: attachment).
 */
export async function construirXlsxReporte(datos: DatosReporte): Promise<Buffer> {
  const libro = new ExcelJS.Workbook()
  libro.creator = 'Loma Bonita · Panel'
  libro.created = new Date()

  hojaResumen(libro, datos)
  hojaReservas(libro, datos.reservas)
  hojaPasadias(libro, datos.pasadias)
  hojaPagos(libro, datos.pagos)

  return Buffer.from(await libro.xlsx.writeBuffer())
}

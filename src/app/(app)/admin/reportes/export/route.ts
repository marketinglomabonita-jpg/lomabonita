import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/core/adapters/supabase/server'
import { esFechaISOValida, getDatosReporte, hoyColombia } from '@/features/reportes/api/datos'
import { construirXlsxReporte } from '@/features/reportes/api/excel'

/**
 * Descarga del reporte Excel (.xlsx) del período. SOLO lectura: valida query
 * params con Zod, revalida staff contra la sesión (la cookie del middleware
 * no basta) y devuelve el libro generado en el servidor como attachment.
 */

// exceljs es una librería de Node pura (streaming de zip): runtime nodejs.
export const runtime = 'nodejs'

/**
 * Roles que pueden descargar reportes: los mismos que gestionan la agenda
 * (owner/admin/gerente/comercial/recepción — negocio). Cocina y anfitrión
 * operan otras superficies y no consumen análisis financieros.
 */
const ROLES_REPORTES = ['owner', 'admin', 'gerente', 'comercial', 'recepcion']

const querySchema = z.object({
  periodo: z.enum(['dia', 'semana', 'mes']).default('dia'),
  // Sin .default(hoyColombia()): el default se evalúa al cargar el módulo y
  // un servidor vivo cruzando medianoche serviría "ayer". Se resuelve abajo.
  fecha: z
    .string({ invalid_type_error: 'Fecha inválida' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe ser YYYY-MM-DD')
    .refine(esFechaISOValida, 'Fecha inexistente (se espera YYYY-MM-DD real)')
    .optional(),
})

/**
 * Revalidación de staff para un route handler (patrón de requerirStaff del
 * calendario, adaptado): devuelve 401/403 en vez de lanzar, para responder
 * HTTP correcto y no un 500.
 */
async function estadoStaff(): Promise<number | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 401

  const { data: perfil } = await supabase
    .from('profiles')
    .select('role, activo')
    .eq('id', user.id)
    .single()

  const autorizado =
    Boolean(perfil?.activo) && ROLES_REPORTES.includes((perfil?.role as string) ?? '')
  return autorizado ? null : 403
}

export async function GET(request: NextRequest) {
  const fallo = await estadoStaff()
  if (fallo !== null) {
    return NextResponse.json({ error: 'No autorizado' }, { status: fallo })
  }

  const parseado = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parseado.success) {
    return NextResponse.json(
      { error: `Parámetros inválidos: ${parseado.error.issues[0]?.message ?? 'revisa periodo y fecha'}` },
      { status: 400 },
    )
  }

  const periodo = parseado.data.periodo
  const fecha = parseado.data.fecha ?? hoyColombia()

  try {
    const datos = await getDatosReporte(periodo, fecha)
    const xlsx = await construirXlsxReporte(datos)
    const nombre = `reporte-loma-bonita-${datos.rango.periodo}-${datos.rango.inicio}_${datos.rango.fin}.xlsx`

    return new Response(new Uint8Array(xlsx), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombre}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar el reporte' },
      { status: 500 },
    )
  }
}

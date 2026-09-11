'use server'

import { createClient } from '@/core/adapters/supabase/server'
import { createTicketSchema, type CreateTicketInput, type Experience } from '../contracts/types'
import { todayISO } from '../lib/format'

type CreateTicketResult =
  | { success: true; codigo: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Emite un ticket de pasadía (sin pago).
 *
 * Autoridad de precio: el total se calcula SIEMPRE en el servidor con los
 * precios de pass_products/experiences en BD; nunca se confía en un total
 * del cliente. El cupo se valida aquí y, como guarda anti-carrera, el
 * trigger on_ticket_insert_check_capacity revalida el agregado dentro de la
 * BD con advisory lock (aborta con CUPO_AGOTADO si dos solicitudes
 * concurrentes exceden el cupo).
 */
export async function createTicket(input: CreateTicketInput): Promise<CreateTicketResult> {
  try {
    // 1. Validar con Zod
    const parsed = createTicketSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Revisa los datos del formulario',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const data = parsed.data

    // 2. Validación de negocio: fecha no pasada
    if (data.fecha < todayISO()) {
      return { success: false, error: 'La fecha de la pasadía no puede ser pasada' }
    }

    // Slugs únicos de addons
    const addonSlugs = [...new Set(data.addons)]

    const supabase = await createClient()

    // 3. Cargar producto y experiencias desde BD (fuente de precios)
    const [{ data: product, error: productError }, { data: experiences, error: expError }] =
      await Promise.all([
        supabase.from('pass_products').select('*').eq('slug', data.product_slug).single(),
        supabase.from('experiences').select('*'),
      ])

    if (productError || !product) {
      return { success: false, error: 'El plan de pasadía elegido no existe' }
    }
    if (expError) {
      return { success: false, error: 'Error al cargar las experiencias' }
    }

    const experienceList = (experiences ?? []) as Experience[]
    const chosenExperiences = addonSlugs.map((slug) =>
      experienceList.find((e) => e.slug === slug),
    )
    if (chosenExperiences.some((e) => !e)) {
      return { success: false, error: 'Una de las experiencias elegidas no existe' }
    }

    // 4. Total calculado en servidor (autoridad de precio)
    const precioPersona =
      product.precio_persona_muestra +
      chosenExperiences.reduce((sum, e) => sum + (e?.precio_persona_muestra ?? 0), 0)
    const total = Math.round(precioPersona * data.personas * 100) / 100

    // 5. Validar cupo vía RPC (security definer; anon no puede leer tickets)
    const { data: disponible, error: cupoError } = await supabase.rpc('ticket_cupo_disponible', {
      p_fecha: data.fecha,
    })

    if (cupoError) {
      return { success: false, error: 'Error al validar el cupo de la fecha' }
    }
    if ((disponible ?? 0) < data.personas) {
      return {
        success: false,
        error: `Cupo agotado para esa fecha: quedan ${Math.max(disponible ?? 0, 0)} lugar(es) y solicitas ${data.personas}`,
      }
    }

    // 6. Insertar (reintento único si el código aleatorio choca por azar)
    for (let attempt = 0; attempt < 2; attempt++) {
      const codigo = generateTicketCode()

      const { error: insertError } = await supabase.from('tickets').insert({
        codigo,
        fecha: data.fecha,
        personas: data.personas,
        addons: addonSlugs,
        total_muestra: total,
        nombre: data.nombre,
        email: data.email || null,
        telefono: data.telefono || null,
        estado: 'emitido',
      })

      if (!insertError) {
        return { success: true, codigo }
      }

      // Unique violation en codigo → reintentar con otro código
      if (insertError.code === '23505') continue

      // Guarda del trigger: cupo revalidado dentro de la BD (condición de carrera)
      if (insertError.message.includes('CUPO_AGOTADO')) {
        return {
          success: false,
          error: 'El cupo de esa fecha se agotó justo ahora (otra solicitud fue más rápida). Elige otra fecha.',
        }
      }

      console.error('Error inserting ticket:', insertError)
      return { success: false, error: 'Error al emitir el ticket' }
    }

    return { success: false, error: 'Error al generar el código del ticket, intenta de nuevo' }
  } catch (err) {
    console.error('Unexpected error in createTicket:', err)
    return { success: false, error: 'Error inesperado al procesar la solicitud' }
  }
}

/** Código único tipo "PD-XXXXXX" (6 dígitos aleatorios). */
function generateTicketCode(): string {
  const random = Math.floor(100000 + Math.random() * 900000)
  return `PD-${random}`
}

'use server'

import { headers } from 'next/headers'
import { createClient } from '@/core/adapters/supabase/server'
import {
  createCorpLeadSchema,
  type CorpExperienceType,
  type CorpAddon,
} from '../contracts/types'

/**
 * Lee tipos de experiencia corporativa (público).
 */
export async function getExperienceTypes(): Promise<CorpExperienceType[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('corp_experience_types')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Error al leer tipos: ${error.message}`)

  return data as CorpExperienceType[]
}

/**
 * Lee addons por categoría (público).
 */
export async function getAddons(categoria?: 'incluir' | 'experiencia' | 'destino'): Promise<CorpAddon[]> {
  const supabase = await createClient()

  let query = supabase
    .from('corp_addons')
    .select('*')
    .order('created_at', { ascending: true })

  if (categoria) {
    query = query.eq('categoria', categoria)
  }

  const { data, error } = await query

  if (error) throw new Error(`Error al leer addons: ${error.message}`)

  return data as CorpAddon[]
}

/**
 * Calcula el valor estimado de una configuración (antes de enviar).
 *
 * El cliente llama esta función para actualizar el valor en vivo mientras
 * selecciona. El servidor la re-ejecuta en createCorpLead para validar.
 */
export async function calcularValorEstimado(params: {
  incluir: string[]
  experiencias: string[]
  destinos: string[]
  personas: number
}): Promise<number> {
  const supabase = await createClient()

  const allSlugs = [...params.incluir, ...params.experiencias, ...params.destinos]
  if (allSlugs.length === 0) return 0

  const { data: addons, error } = await supabase
    .from('corp_addons')
    .select('slug, precio_persona_muestra, precio_fijo_muestra')
    .in('slug', allSlugs)

  if (error) throw new Error(`Error al calcular valor: ${error.message}`)

  let total = 0
  for (const addon of addons) {
    if (addon.precio_persona_muestra !== null) {
      total += addon.precio_persona_muestra * params.personas
    } else if (addon.precio_fijo_muestra !== null) {
      total += addon.precio_fijo_muestra
    }
  }

  return total
}

/**
 * Crea un lead corporativo.
 *
 * Rate-limit: 3/hora/IP enforced por trigger BD. La RPC `corp_lead_puede_enviar`
 * permite mostrar un mensaje antes de insertar, pero la BD es la autoridad
 * (advisory lock anti-carrera).
 */
export async function createCorpLead(
  input: unknown,
): Promise<
  | { success: true; lead_id: string }
  | { success: false; error: string; code?: string }
> {
  const parsed = createCorpLeadSchema.parse(input)
  const supabase = await createClient()

  // IP del request (Vercel x-forwarded-for, fallback x-real-ip)
  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const origen_ip = forwarded?.split(',')[0].trim() || realIp || 'unknown'

  // Pre-check de rate-limit para mensaje claro (la BD es la autoridad)
  const { data: puedeEnviar } = await supabase.rpc('corp_lead_puede_enviar', {
    p_ip: origen_ip,
  })

  if (!puedeEnviar) {
    return {
      success: false,
      error: 'Has alcanzado el límite de solicitudes. Intenta de nuevo en unos minutos.',
      code: 'RATE_LIMIT',
    }
  }

  // Re-calcular valor en servidor (nunca confiar en cliente)
  const valor_estimado = await calcularValorEstimado({
    incluir: parsed.incluir,
    experiencias: parsed.experiencias,
    destinos: parsed.destinos,
    personas: parsed.personas,
  })

  // Insertar (trigger de rate-limit + notificación)
  const { data, error } = await supabase
    .from('corp_leads')
    .insert({
      tipo_experiencia: parsed.tipo_experiencia,
      personas: parsed.personas,
      fecha_tentativa: parsed.fecha_tentativa || null,
      incluir: parsed.incluir,
      experiencias: parsed.experiencias,
      destinos: parsed.destinos,
      valor_estimado,
      nombre: parsed.nombre,
      empresa: parsed.empresa || null,
      email: parsed.email,
      whatsapp: parsed.whatsapp || null,
      estado: 'nuevo',
      origen_ip,
    })
    .select('id')
    .single()

  if (error) {
    // Trigger LEAD_RATE_LIMIT devuelve P0001
    if (error.message.includes('LEAD_RATE_LIMIT')) {
      return {
        success: false,
        error: 'Has alcanzado el límite de solicitudes. Intenta de nuevo en unos minutos.',
        code: 'RATE_LIMIT',
      }
    }
    throw new Error(`Error al crear lead: ${error.message}`)
  }

  return { success: true, lead_id: data.id }
}

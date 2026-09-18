'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/core/adapters/supabase/server'
import {
  setLeadEstadoSchema,
  type CorpLead,
  type CorpLeadEstado,
} from '../contracts/types'

/**
 * Lista leads corporativos con filtro opcional (solo staff).
 */
export async function listCorpLeads(filtro?: { estado?: CorpLeadEstado }): Promise<CorpLead[]> {
  const supabase = await createClient()

  let query = supabase
    .from('corp_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (filtro?.estado) {
    query = query.eq('estado', filtro.estado)
  }

  const { data, error } = await query

  if (error) throw new Error(`Error al listar leads: ${error.message}`)

  return data as CorpLead[]
}

/**
 * Cambia el estado de un lead (solo staff).
 */
export async function setLeadEstado(
  input: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = setLeadEstadoSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase
    .from('corp_leads')
    .update({ estado: parsed.estado })
    .eq('id', parsed.lead_id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/leads')

  return { success: true }
}

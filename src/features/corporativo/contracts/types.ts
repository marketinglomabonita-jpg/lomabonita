import { z } from 'zod'

/** Tope de personas por solicitud de cotización corporativa. */
export const MAX_PERSONAS_CORP = 500

/** Máximo de addons seleccionables por categoría (incluir/experiencias/destinos). */
export const MAX_ADDONS_POR_CATEGORIA = 20

/** Rate-limit de leads: mismo umbral que el trigger BD y la RPC (3/hora/IP). */
export const RATE_LIMIT_LEADS_HORA = 3

export type CorpAddonCategoria = 'incluir' | 'experiencia' | 'destino'

export const CORP_ADDON_CATEGORIAS: CorpAddonCategoria[] = ['incluir', 'experiencia', 'destino']

/** Tipo de experiencia corporativa (paso 1 del wizard) */
export type CorpExperienceType = {
  id: string
  slug: string
  nombre: string
  descripcion: string | null
  is_sample: boolean
  created_at: string
}

/** Addon seleccionable del wizard; exactamente una modalidad de precio */
export type CorpAddon = {
  id: string
  categoria: CorpAddonCategoria
  slug: string
  nombre: string
  descripcion: string | null
  precio_persona_muestra: number | null
  precio_fijo_muestra: number | null
  is_sample: boolean
  created_at: string
}

/** Estado de un lead en el panel */
export type CorpLeadEstado = 'nuevo' | 'contactado' | 'cerrado' | 'descartado'

export const CORP_LEAD_ESTADOS: CorpLeadEstado[] = ['nuevo', 'contactado', 'cerrado', 'descartado']

/** Lead corporativo (fila de corp_leads) */
export type CorpLead = {
  id: string
  tipo_experiencia: string
  personas: number
  fecha_tentativa: string | null
  incluir: string[]
  experiencias: string[]
  destinos: string[]
  valor_estimado: number
  nombre: string
  empresa: string | null
  email: string
  whatsapp: string | null
  estado: CorpLeadEstado
  origen_ip: string | null
  created_at: string
}

/**
 * Mismo regex de email que la policy RLS de corp_leads
 * (email ~* '^[^@]+@[^@]+\.[^@]+$') — lo que pasa Zod pasa la policy.
 */
const EMAIL_CORP_RE = /^[^@]+@[^@]+\.[^@]+$/

const fechaTentativaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
  .optional()
  .or(z.literal(''))

const slugsSchema = z.array(z.string().min(1)).max(MAX_ADDONS_POR_CATEGORIA).default([])

/** Esquema del envío del wizard (paso 5) */
export const createCorpLeadSchema = z.object({
  tipo_experiencia: z.string().min(1, 'Elige un tipo de experiencia'),
  personas: z
    .number({ message: 'Indica el número de personas' })
    .int()
    .min(1, 'Debe haber al menos 1 persona')
    .max(MAX_PERSONAS_CORP, `Máximo ${MAX_PERSONAS_CORP} personas por solicitud`),
  fecha_tentativa: fechaTentativaSchema,
  incluir: slugsSchema,
  experiencias: slugsSchema,
  destinos: slugsSchema,
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  empresa: z.string().optional(),
  email: z.string().regex(EMAIL_CORP_RE, 'Correo inválido'),
  whatsapp: z.string().optional(),
})

export type CreateCorpLeadInput = z.infer<typeof createCorpLeadSchema>

/** Campos de contacto del paso 5 (se combinan con el estado de los pasos 1-4) */
export const leadContactSchema = createCorpLeadSchema.pick({
  nombre: true,
  empresa: true,
  email: true,
  whatsapp: true,
})

export type LeadContactInput = z.infer<typeof leadContactSchema>

/** Esquema del cambio de estado desde el panel */
export const setLeadEstadoSchema = z.object({
  lead_id: z.string().uuid(),
  estado: z.enum(['nuevo', 'contactado', 'cerrado', 'descartado']),
})

export type SetLeadEstadoInput = z.infer<typeof setLeadEstadoSchema>

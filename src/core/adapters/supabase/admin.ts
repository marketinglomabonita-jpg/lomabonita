import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service role. IGNORA RLS.
 *
 * `import 'server-only'` hace que el build falle si este modulo se importa desde
 * un componente cliente (`'use client'`). La clave nunca debe llegar al bundle del navegador.
 *
 * Usar SOLO en Server Actions / Route Handlers para operaciones de staff verificado
 * (confirmar reservas, mover estado de pedidos, leer leads). Nunca para leer datos
 * de un visitante anonimo — para eso va `./server` con RLS.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

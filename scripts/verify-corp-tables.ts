#!/usr/bin/env tsx
/**
 * Script temporal para verificar estado de tablas corporativas
 * (migraciones 0011/0012 aplicadas por GLM)
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !key) {
  console.error('Faltan credenciales de Supabase')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
})

async function main() {
  console.log('=== Verificando tablas corporativas ===\n')

  // Verificar que las tablas existen
  const { data: tables, error: tablesError } = await supabase.rpc('pg_catalog.pg_tables' as any)

  // Mejor usar queries directas
  const { data: types, error: typesError } = await supabase.from('corp_experience_types').select('*', { count: 'exact', head: true })
  const { data: addons, error: addonsError } = await supabase.from('corp_addons').select('*', { count: 'exact', head: true })
  const { data: leads, error: leadsError } = await supabase.from('corp_leads').select('*', { count: 'exact', head: true })

  console.log('Tabla corp_experience_types:', typesError ? `ERROR: ${typesError.message}` : '✓ existe')
  console.log('Tabla corp_addons:', addonsError ? `ERROR: ${addonsError.message}` : '✓ existe')
  console.log('Tabla corp_leads:', leadsError ? `ERROR: ${leadsError.message}` : '✓ existe')

  // Contar seed data
  if (!typesError) {
    const { count } = await supabase.from('corp_experience_types').select('*', { count: 'exact', head: true })
    console.log(`\nTipos de experiencia: ${count}`)
  }

  if (!addonsError) {
    const { count } = await supabase.from('corp_addons').select('*', { count: 'exact', head: true })
    console.log(`Addons: ${count}`)
  }

  if (!leadsError) {
    const { count } = await supabase.from('corp_leads').select('*', { count: 'exact', head: true })
    console.log(`Leads existentes: ${count}`)
  }

  // Verificar función de rate-limit
  const { data: rlData, error: rlError } = await supabase.rpc('corp_lead_puede_enviar', { p_ip: '127.0.0.1' })
  console.log(`\nRPC corp_lead_puede_enviar:`, rlError ? `ERROR: ${rlError.message}` : `✓ funciona (resultado: ${rlData})`)
}

main().catch(console.error)

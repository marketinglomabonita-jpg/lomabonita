#!/usr/bin/env tsx
/**
 * Aplicar migración 0013 — fix RLS para corp_leads
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(url, key, {
  auth: { persistSession: false },
})

async function main() {
  const sql = readFileSync('supabase/migrations/0013_fase6_fix_rls.sql', 'utf-8')

  console.log('Aplicando migración 0013...')

  // Ejecutar las sentencias una por una
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))

  for (const stmt of statements) {
    const { error } = await supabase.rpc('exec', { sql: stmt + ';' }).single()
    if (error) {
      // Intentar directo con query
      const result = await fetch(`${url}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: stmt + ';' }),
      })
      if (!result.ok) {
        console.error('Error:', await result.text())
      }
    }
  }

  console.log('✓ Migración aplicada')

  // Verificar la policy
  const { data: policies } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'corp_leads')

  console.log('\nPolicies de corp_leads:')
  console.log(policies)
}

main().catch(console.error)

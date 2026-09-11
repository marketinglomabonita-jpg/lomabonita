#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(url, key)

async function main() {
  // Consultar policies directamente de pg_policies
  const query = `
    select
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    from pg_policies
    where tablename = 'corp_leads'
    order by policyname;
  `

  const { data, error } = await supabase.rpc('exec' as any, { sql: query })

  if (error) {
    console.log('Intentando query directo...')
    // Usar SQL directo si RPC no funciona
    const res = await fetch(`${url}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query })
    })
    const result = await res.json()
    console.log('Policies de corp_leads:')
    console.log(JSON.stringify(result, null, 2))
    return
  }

  console.log('Policies:',data)
}

main().catch(console.error)

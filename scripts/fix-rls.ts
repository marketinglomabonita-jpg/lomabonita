#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(url, key, {
  auth: { persistSession: false },
  db: { schema: 'public' },
})

async function main() {
  console.log('Eliminando policy antigua...')

  // Drop old policy
  await supabase.rpc('exec' as any, {
    sql: `drop policy if exists "corp_leads: anon insert" on public.corp_leads;`
  })

  console.log('Creando nueva policy...')

  // Create new policy
  await supabase.rpc('exec' as any, {
    sql: `
      create policy "corp_leads: public insert"
        on public.corp_leads for insert
        to anon, authenticated
        with check (
          estado = 'nuevo'
          and personas > 0
          and email ~* '^[^@]+@[^@]+\\.[^@]+$'
        );
    `
  })

  console.log('✓ Policies actualizadas')

  // Verificar
  const { data } = await supabase
    .from('corp_leads')
    .select('id')
    .limit(0)

  console.log('✓ Tabla accesible')
}

main().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})

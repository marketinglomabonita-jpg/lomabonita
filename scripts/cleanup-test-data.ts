#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(url, serviceKey)

async function main() {
  // Borrar leads de prueba
  const { data: leads } = await supabase
    .from('corp_leads')
    .delete()
    .or('email.eq.prueba@test.com,email.eq.test-fase6@example.com,email.eq.test@example.com')
    .select()

  console.log('✓ Leads de prueba borrados:', leads?.length || 0)

  // Borrar notificaciones huérfanas
  if (leads && leads.length > 0) {
    const ids = leads.map(l => l.id)
    await supabase
      .from('notifications')
      .delete()
      .eq('tipo', 'lead')
      .in('ref_id', ids)
    console.log('✓ Notificaciones de prueba borradas')
  }

  // Contar finales
  const { count } = await supabase
    .from('corp_leads')
    .select('*', { count: 'exact', head: true })

  console.log('\nLeads restantes:', count)
}

main().catch(console.error)

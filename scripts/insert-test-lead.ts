#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role bypassa RLS
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('Insertando lead de prueba con service role (bypass RLS)...\n')

  const { data, error } = await supabase
    .from('corp_leads')
    .insert({
      tipo_experiencia: 'pasadia-corporativo',
      personas: 30,
      fecha_tentativa: null,
      incluir: ['acceso-instalaciones', 'almuerzo'],
      experiencias: ['balsaje'],
      destinos: [],
      valor_estimado: 4350000,
      nombre: 'Lead de Prueba',
      empresa: 'Empresa Test',
      email: 'prueba@test.com',
      whatsapp: '+57 300 999 8888',
      estado: 'nuevo',
      origen_ip: '127.0.0.1',
    })
    .select()
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('✓ Lead creado:', data.id)
  console.log('  Nombre:', data.nombre)
  console.log('  Email:', data.email)
  console.log('  Personas:', data.personas)
  console.log('  Valor estimado:', data.valor_estimado)

  // Verificar notificación
  const { data: notif } = await supabase
    .from('notifications')
    .select('*')
    .eq('tipo', 'lead')
    .eq('ref_id', data.id)
    .single()

  if (notif) {
    console.log('\n✓ Notificación creada:')
    console.log('  Título:', notif.titulo)
    console.log('  Cuerpo:', notif.cuerpo)
  } else {
    console.log('\n✗ No se creó notificación')
  }

  // Contar total
  const { count } = await supabase
    .from('corp_leads')
    .select('*', { count: 'exact', head: true })

  console.log('\nTotal leads en BD:', count)
}

main().catch(console.error)

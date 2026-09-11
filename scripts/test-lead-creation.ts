#!/usr/bin/env tsx
/**
 * Test de creación de lead corporativo (simulando Server Action)
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente con anon key (simula usuario no autenticado)
const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
})

async function testLeadCreation() {
  console.log('=== Test de creación de lead ===\n')

  // 1. Verificar que puede leer tipos y addons
  const { data: types } = await supabase.from('corp_experience_types').select('slug').limit(1)
  console.log('✓ Lectura de tipos:', types?.[0]?.slug)

  // 2. Verificar rate-limit
  const { data: canSend } = await supabase.rpc('corp_lead_puede_enviar', { p_ip: 'test-ip' })
  console.log('✓ Rate-limit check:', canSend)

  // 3. Intentar crear lead
  const leadData = {
    tipo_experiencia: 'pasadia-corporativo',
    personas: 30,
    fecha_tentativa: null,
    incluir: ['acceso-instalaciones', 'almuerzo'],
    experiencias: ['balsaje'],
    destinos: [],
    valor_estimado: 4350000, // 30*(25000+25000+95000)
    nombre: 'Test Lead',
    empresa: 'Test Company',
    email: 'test@example.com',
    whatsapp: '+57 300 123 4567',
    estado: 'nuevo',
    origen_ip: 'test-ip-127.0.0.1',
  }

  console.log('\nInsertando lead con rol anon...')
  const { data: lead, error } = await supabase
    .from('corp_leads')
    .insert(leadData)
    .select('id')
    .single()

  if (error) {
    console.error('✗ Error:', error.message)
    console.error('  Code:', error.code)
    console.error('  Details:', error.details)
    return
  }

  console.log('✓ Lead creado:', lead.id)

  // 4. Verificar que se creó la notificación
  const { data: notif } = await supabase
    .from('notifications')
    .select('*')
    .eq('tipo', 'lead')
    .eq('ref_id', lead.id)
    .single()

  console.log('✓ Notificación creada:', notif?.id)

  // 5. Contar leads
  const { count } = await supabase
    .from('corp_leads')
    .select('*', { count: 'exact', head: true })

  console.log('\nTotal leads:', count)
}

testLeadCreation().catch(console.error)

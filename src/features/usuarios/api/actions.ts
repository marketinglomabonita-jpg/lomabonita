'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/core/adapters/supabase/server'
import { createAdminClient } from '@/core/adapters/supabase/admin'
import {
  invitarUsuarioSchema,
  cambiarRolSchema,
  cambiarActivoSchema,
  ROLES_GESTORES,
} from '../contracts/types'

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Revalidación de permisos EN SERVIDOR, antes de actuar. Nunca confiamos en que
 * la UI ocultó los controles: cada action vuelve a leer la sesión y el perfil
 * del actor con el cliente de sesión (RLS) y aborta si no es owner/admin/gerente
 * activo — espejo en código de public.can_manage_users().
 */
async function requerirGestor() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Sesión no encontrada')

  const { data: perfil } = await supabase
    .from('profiles')
    .select('role, activo')
    .eq('id', user.id)
    .single()

  const esGestor =
    Boolean(perfil?.activo) &&
    (ROLES_GESTORES as readonly string[]).includes((perfil?.role as string) ?? '')

  if (!esGestor) throw new Error('No tienes permiso para gestionar usuarios')

  // Service-role solo DESPUÉS de la revalidación anterior.
  return { supabase, admin: createAdminClient(), userId: user.id, email: user.email ?? '' }
}

/** Lee el perfil del afectado: necesario para auditar y para proteger al owner. */
async function leerPerfilObjetivo(admin: AdminClient, usuarioId: string) {
  const { data } = await admin.from('profiles').select('role').eq('id', usuarioId).single()

  if (!data) throw new Error('El usuario no tiene perfil en el sistema')

  return { role: (data.role as string) ?? null }
}

/** El rol dueño está protegido: no se reasigna ni se modifica desde el panel. */
function rechazarSiObjetivoEsOwner(objetivo: { role: string | null }) {
  if (objetivo.role === 'owner') {
    throw new Error('La cuenta dueño está protegida y no puede modificarse desde el panel')
  }
}

/**
 * Auditoría con el cliente de sesión: la policy "audit_log: staff insert" vuelve
 * a validar en la BD que el actor es staff. Sin .select() (gotcha del proyecto).
 */
async function registrarEnAuditoria(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campos: {
    actorId: string
    actorEmail: string
    action: string
    entityId: string
    summary: Record<string, unknown>
  },
) {
  const { error } = await supabase.from('audit_log').insert({
    actor_id: campos.actorId,
    actor_email: campos.actorEmail,
    action: campos.action,
    entity: 'profile',
    entity_id: campos.entityId,
    summary: campos.summary,
  })

  if (error) throw new Error(`Error al registrar en auditoría: ${error.message}`)
}

/** Busca un usuario de auth por correo, paginando listUsers (equipo pequeño). */
async function buscarUsuarioPorEmail(admin: AdminClient, emailBuscado: string) {
  const email = emailBuscado.toLowerCase()
  const PER_PAGE = 200
  const MAX_PAGINAS = 50 // cota de seguridad contra un bucle infinito

  for (let page = 1; page <= MAX_PAGINAS; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE })

    if (error) throw new Error(`Error al buscar usuarios: ${error.message}`)

    const found = data.users.find((u) => (u.email ?? '').toLowerCase() === email)
    if (found) return { id: found.id }
    if (data.users.length < PER_PAGE) return null
  }

  return null
}

/** Invita a alguien por correo con un rol. Reinvitar a un existente no falla. */
export async function invitarUsuario(input: unknown) {
  const parsed = invitarUsuarioSchema.parse(input)
  const { supabase, admin, userId, email: actorEmail } = await requerirGestor()

  const existente = await buscarUsuarioPorEmail(admin, parsed.email)

  if (existente) {
    // Reinvitarse a sí mismo sería un cambio de rol propio por la puerta trasera.
    if (existente.id === userId) throw new Error('No puedes invitarte a ti mismo')

    // Un owner ya existente jamás se reescribe vía reinvitación.
    const perfil = await leerPerfilObjetivo(admin, existente.id)
    rechazarSiObjetivoEsOwner(perfil)
  }

  const email = parsed.email.toLowerCase()
  let usuarioId: string

  if (existente) {
    usuarioId = existente.id
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true, // el login es por código OTP; no se maneja contraseña
      user_metadata: { full_name: parsed.full_name },
    })

    if (error) throw new Error(`Error al invitar al usuario: ${error.message}`)

    usuarioId = data.user.id
  }

  // Upsert del perfil: rol dado + activo. El trigger handle_new_user crea la
  // fila inactiva; aquí queda habilitada con su rol de inmediato.
  const { error: errorPerfil } = await admin.from('profiles').upsert({
    id: usuarioId,
    full_name: parsed.full_name,
    role: parsed.rol,
    activo: true,
  })

  if (errorPerfil) throw new Error(`Error al guardar el perfil: ${errorPerfil.message}`)

  await registrarEnAuditoria(supabase, {
    actorId: userId,
    actorEmail,
    action: 'usuario.invitar',
    entityId: usuarioId,
    summary: { email, rol: parsed.rol, full_name: parsed.full_name, ya_existia: Boolean(existente) },
  })

  revalidatePath('/admin/usuarios')
  return { success: true }
}

/** Cambia el rol de un miembro del equipo. */
export async function cambiarRol(input: unknown) {
  const parsed = cambiarRolSchema.parse(input)
  const { supabase, admin, userId, email: actorEmail } = await requerirGestor()

  // Nadie cambia su propio rol.
  if (parsed.usuario_id === userId) throw new Error('No puedes cambiar tu propio rol')

  const objetivo = await leerPerfilObjetivo(admin, parsed.usuario_id)
  rechazarSiObjetivoEsOwner(objetivo)

  const { error } = await admin
    .from('profiles')
    .update({ role: parsed.rol })
    .eq('id', parsed.usuario_id)

  if (error) throw new Error(`Error al cambiar el rol: ${error.message}`)

  await registrarEnAuditoria(supabase, {
    actorId: userId,
    actorEmail,
    action: 'usuario.cambiar_rol',
    entityId: parsed.usuario_id,
    summary: { rol_anterior: objetivo.role, rol_nuevo: parsed.rol },
  })

  revalidatePath('/admin/usuarios')
  return { success: true }
}

/** Activa o desactiva el acceso de un miembro del equipo. */
export async function cambiarActivo(input: unknown) {
  const parsed = cambiarActivoSchema.parse(input)
  const { supabase, admin, userId, email: actorEmail } = await requerirGestor()

  // Nadie se desactiva a sí mismo.
  if (!parsed.activo && parsed.usuario_id === userId) {
    throw new Error('No puedes desactivarte a ti mismo')
  }

  const objetivo = await leerPerfilObjetivo(admin, parsed.usuario_id)
  rechazarSiObjetivoEsOwner(objetivo)

  const { error } = await admin
    .from('profiles')
    .update({ activo: parsed.activo })
    .eq('id', parsed.usuario_id)

  if (error) throw new Error(`Error al cambiar el estado: ${error.message}`)

  await registrarEnAuditoria(supabase, {
    actorId: userId,
    actorEmail,
    action: parsed.activo ? 'usuario.activar' : 'usuario.desactivar',
    entityId: parsed.usuario_id,
    summary: { activo: parsed.activo },
  })

  revalidatePath('/admin/usuarios')
  return { success: true }
}

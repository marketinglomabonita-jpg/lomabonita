import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/core/adapters/supabase/server'
import { esFechaISOValida } from './dia'

/**
 * Guardas compartidos por las acciones del calendario (acciones.ts crea;
 * gestion.ts edita/cancela/elimina). Vive FUERA de los archivos 'use server'
 * porque exporta valores no-función (esquemas, roles, tipos): un 'use server'
 * solo puede exportar funciones async.
 */

/**
 * Roles que gestionan la agenda (crear reservas y pasadías desde el calendario):
 * dueño, admin, gerente, comercial y recepción. Cocina y anfitrión quedan fuera
 * de la creación de reservas (operan otras superficies). Alinea el panel con el
 * diseño de roles del propietario.
 */
export const ROLES_AGENDA = ['owner', 'admin', 'gerente', 'comercial', 'recepcion']

/**
 * Resultado uniforme para las acciones llamadas desde los formularios.
 * `aviso` comunica un éxito parcial (la reserva se creó pero el abono no
 * alcanzó a registrarse): la UI lo muestra en lugar de cerrar y perderlo.
 */
export type Resultado = { success: true; aviso?: string } | { success: false; error: string }

export const fechaISO = z
  .string({ required_error: 'La fecha es obligatoria' })
  .refine(esFechaISOValida, 'Fecha inválida (se espera YYYY-MM-DD)')

/**
 * Revalidación de permisos EN SERVIDOR, antes de actuar (patrón de
 * features/usuarios/api/actions.ts): vuelve a leer la sesión y el perfil del
 * actor con el cliente de sesión (RLS) y aborta si no tiene el rol.
 */
export async function requerirStaff(rolesPermitidos: readonly string[]) {
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

  const autorizado =
    Boolean(perfil?.activo) &&
    (rolesPermitidos as readonly string[]).includes((perfil?.role as string) ?? '')

  if (!autorizado) throw new Error('No tienes permiso para hacer este cambio en el calendario')

  return { supabase, userId: user.id, email: user.email ?? '' }
}

/**
 * Auditoría con el cliente de sesión: la policy "audit_log: staff insert"
 * vuelve a validar en la BD que el actor es staff. Sin .select() (gotcha del
 * proyecto): el entity_id es el código único de la fila creada.
 */
export async function registrarEnAuditoria(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campos: {
    actorId: string
    actorEmail: string
    action: string
    entity: string
    entityId: string
    summary: Record<string, unknown>
  },
) {
  const { error } = await supabase.from('audit_log').insert({
    actor_id: campos.actorId,
    actor_email: campos.actorEmail,
    action: campos.action,
    entity: campos.entity,
    entity_id: campos.entityId,
    summary: campos.summary,
  })

  if (error) throw new Error(`Error al registrar en auditoría: ${error.message}`)
}

/** Revalida la vista Mes y la página del día donde se hizo el cambio. */
export function revalidarCalendario(fecha: string) {
  revalidatePath('/admin/calendario')
  revalidatePath(`/admin/calendario/dia/${fecha}`)
}

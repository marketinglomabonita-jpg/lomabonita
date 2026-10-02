import { z } from 'zod'

/**
 * Roles asignables desde la UI de gestión de usuarios.
 * NUNCA incluye `owner`: el rol dueño está protegido (solo existe la cuenta
 * que creó el director) y jamás se asigna ni reasigna desde el panel.
 */
export const ROLES_ASIGNABLES = [
  'admin',
  'gerente',
  'comercial',
  'recepcion',
  'cocina',
  'anfitrion',
] as const

export type RolAsignable = (typeof ROLES_ASIGNABLES)[number]

/** Roles que pueden gestionar usuarios (refleja public.can_manage_users()). */
export const ROLES_GESTORES = ['owner', 'admin', 'gerente'] as const

/** Etiquetas legibles para la tabla del equipo. */
export const ROL_LABELS: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Administrador',
  gerente: 'Gerente',
  comercial: 'Comercial',
  recepcion: 'Recepción',
  cocina: 'Cocina',
  anfitrion: 'Anfitrión',
}

/** Fila del equipo que la página arma mezclando auth.users + profiles. */
export type UsuarioAdmin = {
  id: string
  email: string
  full_name: string | null
  role: string | null
  activo: boolean
  creado: string | null
}

/** Invitar a alguien por correo con un rol (login por código OTP, sin contraseña). */
export const invitarUsuarioSchema = z.object({
  email: z.string().email('Correo inválido'),
  full_name: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  rol: z.enum(ROLES_ASIGNABLES),
})

export type InvitarUsuarioInput = z.infer<typeof invitarUsuarioSchema>

/** Cambiar el rol de un miembro del equipo. */
export const cambiarRolSchema = z.object({
  usuario_id: z.string().uuid(),
  rol: z.enum(ROLES_ASIGNABLES),
})

export type CambiarRolInput = z.infer<typeof cambiarRolSchema>

/** Activar o desactivar el acceso de un miembro del equipo. */
export const cambiarActivoSchema = z.object({
  usuario_id: z.string().uuid(),
  activo: z.boolean(),
})

export type CambiarActivoInput = z.infer<typeof cambiarActivoSchema>

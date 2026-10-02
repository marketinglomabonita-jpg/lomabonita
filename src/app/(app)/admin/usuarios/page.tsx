import type { Metadata } from 'next'
import { createClient } from '@/core/adapters/supabase/server'
import { createAdminClient } from '@/core/adapters/supabase/admin'
import { UsuariosAdmin } from '@/features/usuarios/components/usuarios-admin'
import { ROLES_GESTORES, type UsuarioAdmin } from '@/features/usuarios/contracts/types'

export const metadata: Metadata = {
  title: 'Usuarios · Panel · Loma Bonita',
  robots: 'noindex',
}

/** Fila mínima de un usuario de auth, para mezclar con su perfil. */
type UsuarioAuth = {
  id: string
  email: string
  creado: string | null
  nombreMetadata: string | null
}

/** Aviso para quien es del staff pero no gestiona usuarios (no es un 404). */
function AvisoSinPermiso() {
  return (
    <div className="rounded-lg border bg-card p-12 text-center">
      <h1 className="text-2xl font-semibold text-primary">Usuarios</h1>
      <p className="mt-2 text-muted-foreground">No tienes permiso para gestionar usuarios</p>
    </div>
  )
}

/** Lista los usuarios de auth paginando (admin.listUsers), con cota de páginas. */
async function listarUsuariosAuth(admin: ReturnType<typeof createAdminClient>) {
  const PER_PAGE = 200
  const MAX_PAGINAS = 50
  const usuarios: UsuarioAuth[] = []

  for (let page = 1; page <= MAX_PAGINAS; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE })

    if (error) throw new Error(`Error al listar usuarios: ${error.message}`)

    for (const u of data.users) {
      usuarios.push({
        id: u.id,
        email: u.email ?? '',
        creado: u.created_at ?? null,
        nombreMetadata: (u.user_metadata?.full_name as string | undefined) ?? null,
      })
    }

    if (data.users.length < PER_PAGE) break
  }

  return usuarios
}

export default async function UsuariosPage() {
  const supabase = await createClient()

  // El layout ya redirige sin sesión; aquí se revalida por defensa en profundidad.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <AvisoSinPermiso />

  const { data: perfil } = await supabase
    .from('profiles')
    .select('role, activo')
    .eq('id', user.id)
    .single()

  const esGestor =
    Boolean(perfil?.activo) &&
    (ROLES_GESTORES as readonly string[]).includes((perfil?.role as string) ?? '')

  if (!esGestor) return <AvisoSinPermiso />

  // Permiso ya revalidado en código: listamos con service-role y mezclamos
  // auth.users (correos) con profiles (nombre, rol, estado) por id.
  const admin = createAdminClient()

  const [usuariosAuth, perfiles] = await Promise.all([
    listarUsuariosAuth(admin),
    admin.from('profiles').select('id, full_name, role, activo'),
  ])

  if (perfiles.error) throw new Error(`Error al listar perfiles: ${perfiles.error.message}`)

  const perfilPorId = new Map<string, { full_name: string | null; role: string | null; activo: boolean }>()

  for (const p of (perfiles.data ?? []) as Array<{
    id: string
    full_name: string | null
    role: string | null
    activo: boolean
  }>) {
    perfilPorId.set(p.id, { full_name: p.full_name, role: p.role, activo: p.activo })
  }

  const filas: UsuarioAdmin[] = usuariosAuth.map((u) => {
    const p = perfilPorId.get(u.id)

    return {
      id: u.id,
      email: u.email,
      full_name: p?.full_name ?? u.nombreMetadata ?? null,
      role: p?.role ?? null, // usuario de auth sin perfil: sin rol
      activo: p?.activo ?? false, // …y tratado como inactivo
      creado: u.creado,
    }
  })

  // Activos primero, luego alfabético por correo.
  filas.sort((a, b) => Number(b.activo) - Number(a.activo) || a.email.localeCompare(b.email))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Invita al equipo por correo, asigna roles y activa o desactiva accesos
        </p>
      </div>

      <UsuariosAdmin usuarios={filas} usuarioActualId={user.id} />
    </div>
  )
}

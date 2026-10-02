'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/core/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/ui/select'
import { Badge } from '@/core/ui/badge'
import { invitarUsuario, cambiarRol, cambiarActivo } from '../api/actions'
import {
  ROLES_ASIGNABLES,
  ROL_LABELS,
  type UsuarioAdmin,
} from '../contracts/types'

type Props = {
  usuarios: UsuarioAdmin[]
  usuarioActualId: string
}

type Mensaje = { tipo: 'ok' | 'error'; texto: string }

export function UsuariosAdmin({ usuarios, usuarioActualId }: Props) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)

  // Corre cada action y devuelve true solo si salió bien; la lista fresca
  // vuelve por props tras router.refresh() (la página la arma en el servidor).
  const ejecutar = async (
    accion: () => Promise<{ success: boolean }>,
    textoOk: string,
  ): Promise<boolean> => {
    setOcupado(true)
    setMensaje(null)

    try {
      await accion()
      setMensaje({ tipo: 'ok', texto: textoOk })
      router.refresh()
      return true
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error instanceof Error ? error.message : 'Error inesperado',
      })
      return false
    } finally {
      setOcupado(false)
    }
  }

  const handleInvitar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const ok = await ejecutar(
      () =>
        invitarUsuario({
          email: formData.get('email'),
          full_name: formData.get('full_name'),
          rol: formData.get('rol'),
        }),
      'Invitación creada: la persona ya figura en el equipo.',
    )

    if (ok) setIsDialogOpen(false)
  }

  const handleCambiarRol = (u: UsuarioAdmin, rol: string) =>
    ejecutar(() => cambiarRol({ usuario_id: u.id, rol }), `Rol de ${u.email} actualizado.`)

  const handleCambiarActivo = (u: UsuarioAdmin) =>
    ejecutar(
      () => cambiarActivo({ usuario_id: u.id, activo: !u.activo }),
      u.activo ? `Acceso de ${u.email} desactivado.` : `Acceso de ${u.email} activado.`,
    )

  return (
    <div className="space-y-4">
      {mensaje && (
        <div
          aria-live="polite"
          className={
            mensaje.tipo === 'ok'
              ? 'rounded-lg border bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-100'
              : 'rounded-lg border bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100'
          }
        >
          {mensaje.texto}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{usuarios.length} miembro(s) del equipo</p>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Invitar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar al equipo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvitar} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Correo</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="persona@lomabonita.mx"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nombre</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder="Ej: María López"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Rol</label>
                <Select name="rol" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES_ASIGNABLES.map((rol) => (
                      <SelectItem key={rol} value={rol}>
                        {ROL_LABELS[rol]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-muted-foreground">
                Entrará con un código de 6 dígitos enviado a su correo. Nace con el rol elegido y
                acceso activo.
              </p>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={ocupado}>
                  Invitar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {usuarios.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">Todavía no hay nadie en el equipo</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usuarios.map((u) => {
                const esOwner = u.role === 'owner'
                const esYo = u.id === usuarioActualId

                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium">{u.email}</td>
                    <td className="px-4 py-3">{u.full_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {esOwner ? (
                        <Badge variant="outline">Dueño · protegido</Badge>
                      ) : u.role === null ? (
                        <span className="text-muted-foreground">sin perfil</span>
                      ) : (
                        <Select
                          value={u.role}
                          disabled={ocupado || esYo}
                          onValueChange={(rol) => handleCambiarRol(u, rol)}
                        >
                          <SelectTrigger className="w-[170px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES_ASIGNABLES.map((rol) => (
                              <SelectItem key={rol} value={rol}>
                                {ROL_LABELS[rol]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {esYo && <span className="ml-2 text-xs text-muted-foreground">(tú)</span>}
                    </td>
                    <td className="px-4 py-3">
                      {u.activo ? (
                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={u.activo ? 'outline' : 'primary'}
                        disabled={ocupado || esYo || esOwner || u.role === null}
                        onClick={() => handleCambiarActivo(u)}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

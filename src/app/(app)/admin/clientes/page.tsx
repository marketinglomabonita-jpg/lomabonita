import type { Metadata } from 'next'
import { getClientes } from '@/features/clientes/api/queries'
import { GestionCliente } from '@/features/clientes/components/gestion-cliente'

export const metadata: Metadata = {
  title: 'Clientes · Panel · Loma Bonita',
  robots: 'noindex',
}

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/** "2026-10-01" → "1 de octubre de 2026". Partes UTC puras, sin new Date de fecha suelta. */
function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return `${dia} de ${MESES_ES[mes - 1]} de ${anio}`
}

/**
 * Directorio consolidado (Server Component): la consolidación vive en
 * features/clientes/api/queries.ts y la gestión de cada cliente — corregir o
 * suprimir (Habeas Data, Ley 1581 de 2012) — en el client component
 * gestion-cliente.tsx vía las server actions de api/actions.ts.
 */
export default async function AdminClientesPage() {
  const clientes = await getClientes()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Directorio consolidado de huéspedes y visitantes de pasadía ·{' '}
          {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
        </p>
      </div>

      {clientes.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="font-medium">Aún no hay clientes registrados</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando lleguen reservas de hospedaje o tickets de pasadía, sus datos
            aparecerán aquí automáticamente
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                <th className="px-4 py-3 text-left font-medium">Correo</th>
                <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                <th className="px-4 py-3 text-right font-medium">Hospedajes</th>
                <th className="px-4 py-3 text-right font-medium">Pasadías</th>
                <th className="px-4 py-3 text-left font-medium">Última actividad</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clientes.map((cliente) => (
                <tr key={cliente.clave} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{cliente.nombre}</td>
                  <td className="whitespace-nowrap px-4 py-3">{cliente.email ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">{cliente.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{cliente.reservas}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{cliente.pasadias}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {fechaLegible(cliente.ultimaActividad)}
                  </td>
                  <td className="px-4 py-3">
                    <GestionCliente cliente={cliente} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

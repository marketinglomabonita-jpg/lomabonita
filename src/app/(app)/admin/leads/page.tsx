'use client'

import { useEffect, useState } from 'react'
import { Mail, Phone, Building2, Calendar, Users, Loader2 } from 'lucide-react'
import { Button } from '@/core/ui/button'
import { Badge } from '@/core/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/ui/select'
import { listCorpLeads, setLeadEstado } from '@/features/corporativo/api/admin-actions'
import { formatCOP } from '@/features/corporativo/lib/format'
import { CORP_LEAD_ESTADOS, type CorpLead, type CorpLeadEstado } from '@/features/corporativo/contracts/types'

const ESTADO_BADGE: Record<CorpLeadEstado, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  nuevo: { label: 'Nuevo', variant: 'default' },
  contactado: { label: 'Contactado', variant: 'secondary' },
  cerrado: { label: 'Cerrado', variant: 'outline' },
  descartado: { label: 'Descartado', variant: 'destructive' },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<CorpLead[]>([])
  const [filtro, setFiltro] = useState<CorpLeadEstado | 'todos'>('todos')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    async function loadLeads() {
      setLoading(true)
      const data = await listCorpLeads(filtro === 'todos' ? undefined : { estado: filtro })
      setLeads(data)
      setLoading(false)
    }
    loadLeads()
  }, [filtro])

  const handleChangeEstado = async (leadId: string, nuevoEstado: CorpLeadEstado) => {
    setUpdating(leadId)
    const result = await setLeadEstado({ lead_id: leadId, estado: nuevoEstado })
    if (result.success) {
      const data = await listCorpLeads(filtro === 'todos' ? undefined : { estado: filtro })
      setLeads(data)
    } else {
      alert(`Error: ${result.error}`)
    }
    setUpdating(null)
  }

  const leadsFiltrados = leads

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Corporativos</h1>
          <p className="text-neutral-600">Gestiona las solicitudes de cotización para experiencias corporativas</p>
        </div>
        <Select value={filtro} onValueChange={(v) => setFiltro(v as CorpLeadEstado | 'todos')}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {CORP_LEAD_ESTADOS.map((estado) => (
              <SelectItem key={estado} value={estado}>
                {ESTADO_BADGE[estado].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : leadsFiltrados.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center">
          <p className="text-neutral-600">No hay leads con el filtro seleccionado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {leadsFiltrados.map((lead) => (
            <div key={lead.id} className="rounded-lg border border-neutral-200 bg-white p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-xl font-bold">{lead.nombre}</h3>
                    <Badge variant={ESTADO_BADGE[lead.estado].variant}>
                      {ESTADO_BADGE[lead.estado].label}
                    </Badge>
                  </div>
                  {lead.empresa && (
                    <p className="flex items-center gap-2 text-neutral-600">
                      <Building2 className="h-4 w-4" />
                      {lead.empresa}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-900">{formatCOP(lead.valor_estimado)}</div>
                  <div className="text-xs text-neutral-600">Valor estimado</div>
                </div>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-neutral-400" />
                  <a href={`mailto:${lead.email}`} className="text-amber-900 hover:underline">
                    {lead.email}
                  </a>
                </div>
                {lead.whatsapp && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-neutral-400" />
                    <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} className="text-amber-900 hover:underline">
                      {lead.whatsapp}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-neutral-400" />
                  {lead.personas} personas
                </div>
                {lead.fecha_tentativa && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    {new Date(lead.fecha_tentativa).toLocaleDateString('es-CO')}
                  </div>
                )}
              </div>

              <div className="mb-4 rounded-md bg-neutral-50 p-4">
                <div className="mb-2 text-sm font-semibold text-neutral-700">Tipo de experiencia</div>
                <div className="mb-3 text-sm">{lead.tipo_experiencia}</div>

                {lead.incluir.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-neutral-600">Base de la jornada</div>
                    <div className="text-xs text-neutral-700">{lead.incluir.join(', ')}</div>
                  </div>
                )}
                {lead.experiencias.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-neutral-600">Experiencias</div>
                    <div className="text-xs text-neutral-700">{lead.experiencias.join(', ')}</div>
                  </div>
                )}
                {lead.destinos.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-neutral-600">Destinos</div>
                    <div className="text-xs text-neutral-700">{lead.destinos.join(', ')}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
                <div className="text-xs text-neutral-500">
                  Recibido: {new Date(lead.created_at).toLocaleString('es-CO')}
                  {lead.origen_ip && ` · IP: ${lead.origen_ip}`}
                </div>
                <div className="flex gap-2">
                  {lead.estado !== 'contactado' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeEstado(lead.id, 'contactado')}
                      disabled={updating === lead.id}
                    >
                      {updating === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Marcar contactado'}
                    </Button>
                  )}
                  {lead.estado !== 'cerrado' && lead.estado !== 'descartado' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeEstado(lead.id, 'cerrado')}
                        disabled={updating === lead.id}
                      >
                        {updating === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cerrar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeEstado(lead.id, 'descartado')}
                        disabled={updating === lead.id}
                      >
                        {updating === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Descartar'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, ChevronRight, ChevronLeft, Calendar, Users, Mail, Phone, Building2, User } from 'lucide-react'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'
import { Label } from '@/core/ui/label'
import { Checkbox } from '@/core/ui/checkbox'
import { cn } from '@/core/lib/utils'
import {
  getExperienceTypes,
  getAddons,
  calcularValorEstimado,
  createCorpLead,
} from '../api/actions'
import { formatCOP, todayISO } from '../lib/format'
import type { CorpExperienceType, CorpAddon, CreateCorpLeadInput } from '../contracts/types'

const PASOS = [
  '01 — ELIGE',
  '02 — PERSONALIZA',
  '03 — PARTICIPANTES Y FECHA',
  '04 — REVISA',
  '05 — SOLICITA',
]

type WizardState = {
  paso: number
  tipoExperiencia: string
  incluir: string[]
  experiencias: string[]
  destinos: string[]
  personas: number
  fechaTentativa: string
  nombre: string
  empresa: string
  email: string
  whatsapp: string
}

export function WizardCorporativo() {
  const router = useRouter()
  const [state, setState] = useState<WizardState>({
    paso: 1,
    tipoExperiencia: '',
    incluir: [],
    experiencias: [],
    destinos: [],
    personas: 10,
    fechaTentativa: '',
    nombre: '',
    empresa: '',
    email: '',
    whatsapp: '',
  })

  const [tipos, setTipos] = useState<CorpExperienceType[]>([])
  const [addonsIncluir, setAddonsIncluir] = useState<CorpAddon[]>([])
  const [addonsExperiencias, setAddonsExperiencias] = useState<CorpAddon[]>([])
  const [addonsDestinos, setAddonsDestinos] = useState<CorpAddon[]>([])
  const [valorEstimado, setValorEstimado] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadData() {
      const [t, aI, aE, aD] = await Promise.all([
        getExperienceTypes(),
        getAddons('incluir'),
        getAddons('experiencia'),
        getAddons('destino'),
      ])
      setTipos(t)
      setAddonsIncluir(aI)
      setAddonsExperiencias(aE)
      setAddonsDestinos(aD)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (state.paso >= 3) {
      calcularValorEstimado({
        incluir: state.incluir,
        experiencias: state.experiencias,
        destinos: state.destinos,
        personas: state.personas,
      }).then(setValorEstimado)
    }
  }, [state.incluir, state.experiencias, state.destinos, state.personas, state.paso])

  const tipoSeleccionado = tipos.find((t) => t.slug === state.tipoExperiencia)

  const puedeAvanzar = () => {
    if (state.paso === 1) return !!state.tipoExperiencia
    if (state.paso === 2) return true // puede no elegir nada
    if (state.paso === 3) return state.personas > 0
    if (state.paso === 4) return true
    return false
  }

  const avanzar = () => {
    if (puedeAvanzar() && state.paso < 5) {
      setState((prev) => ({ ...prev, paso: prev.paso + 1 }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const retroceder = () => {
    if (state.paso > 1) {
      setState((prev) => ({ ...prev, paso: prev.paso - 1 }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const toggleAddon = (categoria: 'incluir' | 'experiencias' | 'destinos', slug: string) => {
    setState((prev) => {
      const arr = prev[categoria]
      if (arr.includes(slug)) {
        return { ...prev, [categoria]: arr.filter((s) => s !== slug) }
      }
      return { ...prev, [categoria]: [...arr, slug] }
    })
  }

  const enviarCotizacion = async () => {
    setLoading(true)
    setError('')

    const input: CreateCorpLeadInput = {
      tipo_experiencia: state.tipoExperiencia,
      personas: state.personas,
      fecha_tentativa: state.fechaTentativa || undefined,
      incluir: state.incluir,
      experiencias: state.experiencias,
      destinos: state.destinos,
      nombre: state.nombre,
      empresa: state.empresa || undefined,
      email: state.email,
      whatsapp: state.whatsapp || undefined,
    }

    const result = await createCorpLead(input)
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/'), 3000)
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-green-900">¡Solicitud recibida!</h3>
        <p className="text-green-800">
          Gracias por tu interés. Revisaremos tu solicitud y te enviaremos la cotización personalizada en las
          próximas horas.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Indicador de pasos */}
      <div className="mb-8 flex flex-wrap gap-2">
        {PASOS.map((nombre, i) => {
          const idx = i + 1
          const activo = state.paso === idx
          const completado = state.paso > idx
          return (
            <div
              key={idx}
              className={cn(
                'flex-1 rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors',
                activo && 'border-amber-600 bg-amber-50 text-amber-900',
                completado && 'border-green-600 bg-green-50 text-green-900',
                !activo && !completado && 'border-neutral-200 bg-white text-neutral-600',
              )}
            >
              {nombre}
            </div>
          )
        })}
      </div>

      {/* Paso 1: Elige tipo */}
      {state.paso === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-2xl font-bold">¿Qué necesita tu empresa?</h3>
            <p className="text-neutral-600">
              No todas las empresas buscan lo mismo. Por eso creamos diferentes formas de vivir Loma Bonita con tu
              equipo.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {tipos.map((tipo) => (
              <button
                key={tipo.slug}
                onClick={() => setState((prev) => ({ ...prev, tipoExperiencia: tipo.slug }))}
                className={cn(
                  'rounded-lg border-2 p-6 text-left transition-all hover:border-amber-600',
                  state.tipoExperiencia === tipo.slug
                    ? 'border-amber-600 bg-amber-50'
                    : 'border-neutral-200 bg-white',
                )}
              >
                <h4 className="mb-2 font-bold uppercase tracking-wide text-amber-900">{tipo.nombre}</h4>
                <p className="text-sm text-neutral-700">{tipo.descripcion}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 2: Personaliza */}
      {state.paso === 2 && (
        <div className="space-y-8">
          <div>
            <h3 className="mb-2 text-2xl font-bold">Personaliza tu experiencia</h3>
            <p className="text-neutral-600">
              Selecciona las opciones que quieras agregar a tu plan. Puedes construir una experiencia a la medida.
            </p>
          </div>

          {/* Incluir */}
          {addonsIncluir.length > 0 && (
            <div>
              <h4 className="mb-3 text-lg font-bold text-amber-900">Base de la jornada</h4>
              <div className="grid gap-3">
                {addonsIncluir.map((addon) => (
                  <label
                    key={addon.slug}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 p-4 transition-colors hover:border-amber-600 hover:bg-amber-50"
                  >
                    <Checkbox
                      checked={state.incluir.includes(addon.slug)}
                      onCheckedChange={() => toggleAddon('incluir', addon.slug)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{addon.nombre}</div>
                      <div className="text-sm text-neutral-600">{addon.descripcion}</div>
                      <div className="mt-1 text-sm font-medium text-amber-900">
                        {addon.precio_persona_muestra !== null
                          ? `${formatCOP(addon.precio_persona_muestra)} / persona`
                          : addon.precio_fijo_muestra !== null
                            ? `${formatCOP(addon.precio_fijo_muestra)} (fijo)`
                            : ''}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Experiencias */}
          {addonsExperiencias.length > 0 && (
            <div>
              <h4 className="mb-3 text-lg font-bold text-amber-900">Experiencias complementarias</h4>
              <div className="grid gap-3">
                {addonsExperiencias.map((addon) => (
                  <label
                    key={addon.slug}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 p-4 transition-colors hover:border-amber-600 hover:bg-amber-50"
                  >
                    <Checkbox
                      checked={state.experiencias.includes(addon.slug)}
                      onCheckedChange={() => toggleAddon('experiencias', addon.slug)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{addon.nombre}</div>
                      <div className="text-sm text-neutral-600">{addon.descripcion}</div>
                      <div className="mt-1 text-sm font-medium text-amber-900">
                        {formatCOP(addon.precio_persona_muestra || 0)} / persona
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Destinos */}
          {addonsDestinos.length > 0 && (
            <div>
              <h4 className="mb-3 text-lg font-bold text-amber-900">Destinos del Eje Cafetero</h4>
              <div className="grid gap-3">
                {addonsDestinos.map((addon) => (
                  <label
                    key={addon.slug}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 p-4 transition-colors hover:border-amber-600 hover:bg-amber-50"
                  >
                    <Checkbox
                      checked={state.destinos.includes(addon.slug)}
                      onCheckedChange={() => toggleAddon('destinos', addon.slug)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{addon.nombre}</div>
                      <div className="text-sm text-neutral-600">{addon.descripcion}</div>
                      <div className="mt-1 text-sm font-medium text-amber-900">
                        {formatCOP(addon.precio_persona_muestra || 0)} / persona
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paso 3: Personas y fecha */}
      {state.paso === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-2xl font-bold">Participantes y fecha</h3>
            <p className="text-neutral-600">
              El valor de tu experiencia se calculará de acuerdo con la cantidad de personas.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="personas" className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Número de personas
              </Label>
              <Input
                id="personas"
                type="number"
                min={1}
                max={500}
                value={state.personas}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState((prev) => ({ ...prev, personas: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="fecha" className="mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha tentativa (opcional)
              </Label>
              <Input
                id="fecha"
                type="date"
                min={todayISO()}
                value={state.fechaTentativa}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState((prev) => ({ ...prev, fechaTentativa: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Paso 4: Revisa */}
      {state.paso === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-2xl font-bold">Revisa tu configuración</h3>
            <p className="text-neutral-600">
              Consulta un valor estimado de tu experiencia antes de solicitar la cotización.
            </p>
          </div>
          <div className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-6">
            <div>
              <div className="text-sm font-medium text-neutral-600">Tipo de experiencia</div>
              <div className="font-semibold">{tipoSeleccionado?.nombre}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-600">Participantes</div>
              <div className="font-semibold">{state.personas} personas</div>
            </div>
            {state.fechaTentativa && (
              <div>
                <div className="text-sm font-medium text-neutral-600">Fecha tentativa</div>
                <div className="font-semibold">{state.fechaTentativa}</div>
              </div>
            )}
            {state.incluir.length > 0 && (
              <div>
                <div className="text-sm font-medium text-neutral-600">Base de la jornada</div>
                <div className="text-sm">
                  {state.incluir.map((slug) => addonsIncluir.find((a) => a.slug === slug)?.nombre).join(', ')}
                </div>
              </div>
            )}
            {state.experiencias.length > 0 && (
              <div>
                <div className="text-sm font-medium text-neutral-600">Experiencias</div>
                <div className="text-sm">
                  {state.experiencias
                    .map((slug) => addonsExperiencias.find((a) => a.slug === slug)?.nombre)
                    .join(', ')}
                </div>
              </div>
            )}
            {state.destinos.length > 0 && (
              <div>
                <div className="text-sm font-medium text-neutral-600">Destinos</div>
                <div className="text-sm">
                  {state.destinos.map((slug) => addonsDestinos.find((a) => a.slug === slug)?.nombre).join(', ')}
                </div>
              </div>
            )}
            <div className="border-t border-neutral-300 pt-4">
              <div className="text-sm font-medium text-neutral-600">Valor estimado</div>
              <div className="text-3xl font-bold text-amber-900">{formatCOP(valorEstimado)}</div>
              <div className="mt-1 text-xs text-neutral-600">
                Este es un valor de referencia. El valor final puede variar según disponibilidad y condiciones.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paso 5: Solicita */}
      {state.paso === 5 && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-2xl font-bold">Recibe tu cotización</h3>
            <p className="text-neutral-600">
              Ya tienes una idea. Ahora hagámosla realidad. Déjanos tus datos y enviaremos la propuesta de tu
              experiencia corporativa.
            </p>
          </div>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="nombre" className="mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre *
              </Label>
              <Input
                id="nombre"
                value={state.nombre}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Tu nombre completo"
              />
            </div>
            <div>
              <Label htmlFor="empresa" className="mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresa
              </Label>
              <Input
                id="empresa"
                value={state.empresa}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState((prev) => ({ ...prev, empresa: e.target.value }))}
                placeholder="Nombre de la empresa (opcional)"
              />
            </div>
            <div>
              <Label htmlFor="email" className="mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo electrónico *
              </Label>
              <Input
                id="email"
                type="email"
                value={state.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp" className="mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                value={state.whatsapp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState((prev) => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="+57 300 123 4567 (opcional)"
              />
            </div>
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>
          )}
        </div>
      )}

      {/* Navegación */}
      <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-6">
        {state.paso > 1 ? (
          <Button variant="outline" onClick={retroceder}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>
        ) : (
          <div />
        )}
        {state.paso < 5 ? (
          <Button onClick={avanzar} disabled={!puedeAvanzar()}>
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={enviarCotizacion} disabled={loading || !state.nombre || !state.email}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Quiero recibir mi cotización'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

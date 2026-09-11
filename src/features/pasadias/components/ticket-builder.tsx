'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, CalendarCheck, Loader2, Minus, Plus, Ticket } from 'lucide-react'
import { createTicket } from '../api/create-ticket'
import {
  ticketContactSchema,
  MAX_PERSONAS_TICKET,
  type Experience,
  type PassProduct,
  type TicketContactInput,
} from '../contracts/types'
import { formatCOP, todayISO } from '../lib/format'
import { cn } from '@/core/lib/utils'
import { buttonVariants } from '@/core/ui/button'

type Props = {
  products: PassProduct[]
  experiences: Experience[]
}

const inputClasses =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Flujo de emisión de ticket en dos pasos:
 * 1. Armar la pasadía (plan + fecha + personas + experiencias) con total en vivo.
 * 2. Datos de contacto y emisión (el total se recalcula en el servidor).
 */
export function TicketBuilder({ products, experiences }: Props) {
  const router = useRouter()

  const [paso, setPaso] = useState<'armar' | 'datos'>('armar')
  const [productSlug, setProductSlug] = useState(products[0]?.slug ?? '')
  const [fecha, setFecha] = useState('')
  const [personas, setPersonas] = useState(2)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TicketContactInput>({
    resolver: zodResolver(ticketContactSchema),
    defaultValues: { nombre: '', email: '', telefono: '' },
  })

  const product = products.find((p) => p.slug === productSlug)
  const chosenExperiences = experiences.filter((e) => selectedAddons.includes(e.slug))

  const precioPersona =
    (product?.precio_persona_muestra ?? 0) +
    chosenExperiences.reduce((sum, e) => sum + e.precio_persona_muestra, 0)
  const total = precioPersona * personas

  const toggleAddon = (slug: string) =>
    setSelectedAddons((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )

  const onSubmit = async (contact: TicketContactInput) => {
    setError(null)
    const result = await createTicket({
      product_slug: productSlug,
      fecha,
      personas,
      addons: selectedAddons,
      nombre: contact.nombre,
      email: contact.email ?? '',
      telefono: contact.telefono ?? '',
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    router.push(`/pasadia/${result.codigo}`)
  }

  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        La emisión de tickets estará disponible en un momento.
      </p>
    )
  }

  // Comparación solo relevante tras interacción del usuario (cliente); el
  // servidor revalida con la RLS (fecha >= current_date).
  const fechaEsPasada = fecha !== '' && fecha < todayISO()
  const puedeContinuar = Boolean(product && fecha && !fechaEsPasada)

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      {/* Encabezado de pasos */}
      <div className="mb-6 flex items-center gap-2 text-xs font-medium">
        <span
          className={cn(
            'rounded-full px-3 py-1',
            paso === 'armar' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          1. Arma tu pasadía
        </span>
        <span className="text-muted-foreground">→</span>
        <span
          className={cn(
            'rounded-full px-3 py-1',
            paso === 'datos' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          2. Tus datos
        </span>
      </div>

      {paso === 'armar' ? (
        <div className="space-y-6">
          {/* Plan de pasadía */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Elige tu plan</legend>
            <div className="grid gap-2">
              {products.map((p) => (
                <label
                  key={p.slug}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition-colors',
                    productSlug === p.slug
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/40',
                  )}
                >
                  <input
                    type="radio"
                    name="product_slug"
                    value={p.slug}
                    checked={productSlug === p.slug}
                    onChange={() => setProductSlug(p.slug)}
                    className="mt-1 accent-primary"
                  />
                  <span className="flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{p.nombre}</span>
                      <span className="text-muted-foreground">
                        {formatCOP(p.precio_persona_muestra)} / persona
                      </span>
                    </span>
                    {p.descripcion && (
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {p.descripcion}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Fecha y personas */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ticket-fecha" className="mb-1.5 block text-sm font-medium">
                Fecha de la pasadía <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                id="ticket-fecha"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={inputClasses}
                required
              />
              {fechaEsPasada && (
                <p className="mt-1 text-xs text-destructive">
                  La fecha de la pasadía no puede ser pasada
                </p>
              )}
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium">
                Personas <span className="text-destructive">*</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPersonas((n) => Math.max(1, n - 1))}
                  disabled={personas <= 1}
                  className="inline-flex size-9 items-center justify-center rounded-md border border-input bg-background disabled:opacity-40"
                  aria-label="Quitar una persona"
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <span className="w-8 text-center text-lg font-semibold tabular-nums">{personas}</span>
                <button
                  type="button"
                  onClick={() => setPersonas((n) => Math.min(MAX_PERSONAS_TICKET, n + 1))}
                  disabled={personas >= MAX_PERSONAS_TICKET}
                  className="inline-flex size-9 items-center justify-center rounded-md border border-input bg-background disabled:opacity-40"
                  aria-label="Agregar una persona"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
                <span className="text-xs text-muted-foreground">máx. {MAX_PERSONAS_TICKET}</span>
              </div>
            </div>
          </div>

          {/* Experiencias adicionales */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">
              Suma experiencias <span className="font-normal text-muted-foreground">(opcional)</span>
            </legend>
            <div className="grid gap-2">
              {experiences.map((e) => (
                <label
                  key={e.slug}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 text-sm transition-colors hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    checked={selectedAddons.includes(e.slug)}
                    onChange={() => toggleAddon(e.slug)}
                    className="size-4 accent-primary"
                  />
                  <span className="flex-1">{e.nombre}</span>
                  <span className="text-muted-foreground">
                    +{formatCOP(e.precio_persona_muestra)} / persona
                  </span>
                </label>
              ))}
              {experiences.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay experiencias disponibles ahora.</p>
              )}
            </div>
          </fieldset>

          {/* Desglose y total informativo */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <p className="font-medium">Total de prueba</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li className="flex justify-between">
                <span>{product?.nombre}</span>
                <span>{formatCOP(product?.precio_persona_muestra ?? 0)} × {personas}</span>
              </li>
              {chosenExperiences.map((e) => (
                <li key={e.slug} className="flex justify-between">
                  <span>{e.nombre}</span>
                  <span>
                    {formatCOP(e.precio_persona_muestra)} × {personas}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
              <span className="font-medium">Total</span>
              <span className="font-display text-2xl font-bold text-cafe">
                {formatCOP(total)}
              </span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Tarifas de ejemplo para esta demo — sin pago en línea. El valor final se confirma con el
              equipo de Loma Bonita.
            </p>
          </div>

          <button
            type="button"
            disabled={!puedeContinuar}
            onClick={() => setPaso('datos')}
            className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
          >
            <Ticket className="size-4" aria-hidden="true" />
            Solicitar ticket
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <button
            type="button"
            onClick={() => setPaso('armar')}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a armar la pasadía
          </button>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Resumen */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <CalendarCheck className="size-4 text-primary" aria-hidden="true" />
              Resumen
            </p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                Plan: <strong className="text-foreground">{product?.nombre}</strong>
              </li>
              <li>
                Fecha:{' '}
                <strong className="text-foreground">
                  {fecha ? format(new Date(`${fecha}T12:00:00`), "EEEE d 'de' MMMM 'de' yyyy", { locale: es }) : fecha}
                </strong>
              </li>
              <li>
                Personas: <strong className="text-foreground">{personas}</strong>
              </li>
              {chosenExperiences.length > 0 && (
                <li>
                  Experiencias:{' '}
                  <strong className="text-foreground">
                    {chosenExperiences.map((e) => e.nombre).join(', ')}
                  </strong>
                </li>
              )}
              <li className="flex items-baseline justify-between border-t border-border pt-2 text-foreground">
                <span className="font-medium">Total de prueba</span>
                <strong className="font-display text-xl text-cafe">{formatCOP(total)}</strong>
              </li>
            </ul>
          </div>

          {/* Datos de contacto */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ticket-nombre" className="mb-1.5 block text-sm font-medium">
                Nombre completo <span className="text-destructive">*</span>
              </label>
              <input {...register('nombre')} type="text" id="ticket-nombre" className={inputClasses} />
              {errors.nombre && (
                <p className="mt-1 text-xs text-destructive">{errors.nombre.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="ticket-email" className="mb-1.5 block text-sm font-medium">
                Correo electrónico
              </label>
              <input {...register('email')} type="email" id="ticket-email" className={inputClasses} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="ticket-telefono" className="mb-1.5 block text-sm font-medium">
                Teléfono / WhatsApp
              </label>
              <input {...register('telefono')} type="tel" id="ticket-telefono" className={inputClasses} />
              {errors.telefono && (
                <p className="mt-1 text-xs text-destructive">{errors.telefono.message}</p>
              )}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Emitiendo ticket...
              </>
            ) : (
              <>
                <Ticket className="size-4" aria-hidden="true" />
                Emitir mi ticket
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Ticket gratuito de demo: recibe un código con QR para presentar en la entrada. Sin pago en
            línea.
          </p>
        </form>
      )}
    </div>
  )
}

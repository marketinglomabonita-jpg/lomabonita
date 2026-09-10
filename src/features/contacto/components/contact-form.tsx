'use client'

import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { CalendarCheck, MessageCircle, Users } from 'lucide-react'
import { waLink } from '@/core/lib/contact'
import { buttonVariants } from '@/core/ui/button'
import { cn } from '@/core/lib/utils'

const planEnum = z.enum(
  [
    'Pasadía recreativa',
    'Hospedaje campestre',
    'Evento familiar (cumpleaños/bodas)',
    'Evento de integración empresarial',
  ],
  { errorMap: () => ({ message: 'Selecciona tu plan.' }) },
)

const contactSchema = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre completo.'),
  plan: planEnum,
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona la fecha que quieres visitarnos.'),
  adultos: z.coerce
    .number({ message: 'Indica el número de adultos.' })
    .int('Debe ser un número entero.')
    .min(1, 'Al menos 1 adulto.')
    .max(100, 'Para grupos grandes escríbenos por WhatsApp.'),
  ninos: z.coerce
    .number({ message: 'Indica el número de niños (o 0).' })
    .int('Debe ser un número entero.')
    .min(0)
    .max(100),
  comentarios: z.string().trim().max(600, 'Máximo 600 caracteres.').optional(),
})

type ContactForm = z.infer<typeof contactSchema>
type FormState = { nombre: string; plan: string; fecha: string; adultos: string; ninos: string; comentarios: string }

const INITIAL: FormState = {
  nombre: '',
  plan: '',
  fecha: '',
  adultos: '2',
  ninos: '0',
  comentarios: '',
}

const inputClass =
  'flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({})
  const fechaRef = useRef<HTMLInputElement>(null)

  // Fecha minima = hoy (mutacion de DOM en efecto: evita mismatch de hidratacion).
  useEffect(() => {
    if (!fechaRef.current) return
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    fechaRef.current.min = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  }, [])

  const set = (key: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const parsed = contactSchema.safeParse({
      nombre: form.nombre,
      plan: form.plan,
      fecha: form.fecha,
      adultos: form.adultos,
      ninos: form.ninos,
      comentarios: form.comentarios || undefined,
    })
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof ContactForm, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContactForm
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    const data = parsed.data
    const fecha = new Date(`${data.fecha}T00:00:00`).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const lines = [
      '¡Hola Finca Loma Bonita!',
      '',
      'Me gustaría realizar una cotización con los siguientes detalles:',
      '',
      `Nombre: ${data.nombre}`,
      `Tipo de plan: ${data.plan}`,
      `Fecha deseada: ${fecha}`,
      `Adultos: ${data.adultos}`,
      `Niños (2–10 años): ${data.ninos}`,
    ]
    if (data.comentarios) lines.push(`Comentarios: ${data.comentarios}`)
    lines.push('', 'Quedo atento(a) a la disponibilidad y tarifas. ¡Muchas gracias!')
    window.open(waLink(lines.join('\n')), '_blank', 'noopener,noreferrer')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="form-nombre" className="mb-1.5 block text-sm font-medium">
          Tu nombre completo
        </label>
        <input
          id="form-nombre"
          type="text"
          autoComplete="name"
          placeholder="Ej. Mauro Gómez"
          value={form.nombre}
          onChange={(e) => set('nombre')(e.target.value)}
          aria-invalid={Boolean(errors.nombre)}
          aria-describedby={errors.nombre ? 'error-nombre' : undefined}
          className={inputClass}
        />
        {errors.nombre && (
          <p id="error-nombre" role="alert" className="mt-1.5 text-xs text-destructive">
            {errors.nombre}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="form-plan" className="mb-1.5 block text-sm font-medium">
            <CalendarCheck className="mr-1 inline size-4 text-primary" aria-hidden="true" />
            Tipo de plan
          </label>
          <select
            id="form-plan"
            value={form.plan}
            onChange={(e) => set('plan')(e.target.value)}
            aria-invalid={Boolean(errors.plan)}
            aria-describedby={errors.plan ? 'error-plan' : undefined}
            className={inputClass}
          >
            <option value="" disabled>
              Selecciona tu plan…
            </option>
            {planEnum.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.plan && (
            <p id="error-plan" role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.plan}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="form-fecha" className="mb-1.5 block text-sm font-medium">
            Fecha deseada
          </label>
          <input
            id="form-fecha"
            type="date"
            ref={fechaRef}
            value={form.fecha}
            onChange={(e) => set('fecha')(e.target.value)}
            aria-invalid={Boolean(errors.fecha)}
            aria-describedby={errors.fecha ? 'error-fecha' : undefined}
            className={inputClass}
          />
          {errors.fecha && (
            <p id="error-fecha" role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.fecha}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="form-adultos" className="mb-1.5 block text-sm font-medium">
            <Users className="mr-1 inline size-4 text-primary" aria-hidden="true" />
            Adultos
          </label>
          <input
            id="form-adultos"
            type="number"
            min={1}
            max={100}
            value={form.adultos}
            onChange={(e) => set('adultos')(e.target.value)}
            aria-invalid={Boolean(errors.adultos)}
            aria-describedby={errors.adultos ? 'error-adultos' : undefined}
            className={inputClass}
          />
          {errors.adultos && (
            <p id="error-adultos" role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.adultos}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="form-ninos" className="mb-1.5 block text-sm font-medium">
            Niños (2–10 años)
          </label>
          <input
            id="form-ninos"
            type="number"
            min={0}
            max={100}
            value={form.ninos}
            onChange={(e) => set('ninos')(e.target.value)}
            aria-invalid={Boolean(errors.ninos)}
            aria-describedby={errors.ninos ? 'error-ninos' : undefined}
            className={inputClass}
          />
          {errors.ninos && (
            <p id="error-ninos" role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.ninos}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="form-comentarios" className="mb-1.5 block text-sm font-medium">
          Comentarios o requerimientos especiales
        </label>
        <textarea
          id="form-comentarios"
          rows={3}
          placeholder="Ej. Celebración de cumpleaños, alimentación incluida…"
          value={form.comentarios}
          onChange={(e) => set('comentarios')(e.target.value)}
          className={cn(inputClass, 'h-auto')}
        />
      </div>

      <button type="submit" className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}>
        <MessageCircle aria-hidden="true" />
        Enviar cotización por WhatsApp
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Al enviar se abre WhatsApp con tu solicitud ya redactada. No guardamos datos en
        esta versión.
      </p>
    </form>
  )
}

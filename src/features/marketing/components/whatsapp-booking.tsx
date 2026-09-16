import { MessageCircle } from 'lucide-react'
import { BUSINESS } from '@/core/config/site'
import { formatPhone, waLink } from '@/core/lib/contact'
import { buttonVariants } from '@/core/ui/button'
import { WhatsAppIcon } from '@/features/marketing/components/brand-icons'

type WhatsAppBookingProps = {
  title: string
  steps: ReadonlyArray<string>
  message: string
  cta: string
}

/** Bloque "como reservar": las reservas son directas por WhatsApp, sujetas a disponibilidad. */
export function WhatsAppBooking({ title, steps, message, cta }: WhatsAppBookingProps) {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MessageCircle className="size-5" aria-hidden="true" />
        </span>
        <h2 className="font-display text-2xl font-semibold text-cafe">{title}</h2>
      </div>
      <ol className="mt-5 space-y-2.5">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm">
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-card text-xs font-semibold text-primary ring-1 ring-primary/30">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={waLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'accent', size: 'lg' })}
        >
          <WhatsAppIcon className="size-4" />
          {cta}
        </a>
        <p className="text-xs text-muted-foreground">
          WhatsApp {BUSINESS.phones.map(formatPhone).join(' · ')} · {BUSINESS.hours.reservas}
        </p>
      </div>
    </div>
  )
}

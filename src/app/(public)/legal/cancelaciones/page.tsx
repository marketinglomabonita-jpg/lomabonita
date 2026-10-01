import type { Metadata } from 'next'
import { BUSINESS } from '@/core/config/site'
import { formatPhone, waLink } from '@/core/lib/contact'
import { IMAGES } from '@/core/lib/images'
import { buildPageMetadata } from '@/core/lib/seo'
import { LegalArticle } from '@/features/legal/components/legal-article'

export const metadata: Metadata = buildPageMetadata({
  title: 'Política de Cancelación, Cambios y Reembolsos',
  description: `Condiciones de cancelación, cambios de fecha y reembolsos de la ${BUSINESS.legalName}: porcentajes de devolución según la anticipación, plazos de reembolso, no presentación (No Show) y derechos del cliente según la Ley 300 de 1996.`,
  path: '/legal/cancelaciones',
  image: IMAGES['zonas-de-comunes-de-descanso'],
  imageAlt: 'Zonas comunes de descanso de la Finca Loma Bonita',
})

/** Escala de devolución según la anticipación con que se cancela. */
const ESCALA = [
  {
    anticipacion: '15 días o más de anticipación',
    detalle: 'Tendrás derecho a la devolución del 100% del valor pagado.',
    resultado: '100% de devolución',
    tono: 'bien' as const,
  },
  {
    anticipacion: 'Entre 8 y 14 días de anticipación',
    detalle: 'Se realizará una devolución equivalente al 80% del valor pagado.',
    resultado: '80% de devolución',
    tono: 'bien' as const,
  },
  {
    anticipacion: 'Entre 4 y 7 días de anticipación',
    detalle: 'Se realizará una devolución equivalente al 50% del valor pagado.',
    resultado: '50% de devolución',
    tono: 'medio' as const,
  },
  {
    anticipacion: 'Con 3 días o menos de anticipación',
    detalle:
      'Podremos retener hasta el 100% del anticipo o depósito recibido, según las condiciones informadas y aceptadas.',
    resultado: '100% de retención',
    tono: 'alto' as const,
  },
  {
    anticipacion: 'No presentación (No Show)',
    detalle:
      'En caso de no presentarse en la fecha reservada o no utilizar los servicios contratados sin haber realizado la cancelación previa, se aplicará lo establecido en el artículo 65 de la Ley 300 de 1996. Esta norma permite al prestador exigir el 20% del precio total o retener el depósito o anticipo recibido, si así fue convenido.',
    resultado: '20% del precio total o retención del anticipo',
    tono: 'alto' as const,
  },
]

const TONOS = {
  bien: 'border-primary/30 bg-primary/5 text-primary',
  medio: 'border-accent/40 bg-accent/5 text-accent',
  alto: 'border-border bg-muted text-cafe',
} as const

export default function PoliticaCancelacionesPage() {
  return (
    <LegalArticle
      title="Política de Cancelación, Cambios y Reembolsos"
      description="Nuestras condiciones de cancelación, cambios de fecha y reembolsos, para que disfrutes tu experiencia con total confianza."
      path="/legal/cancelaciones"
      crumb="Cancelaciones y reembolsos"
    >
      <p>
        En {BUSINESS.legalName} nos importa tu tranquilidad. Por eso te compartimos nuestras
        condiciones de cancelación, cambios y reembolsos, para que disfrutes tu experiencia con
        total confianza.
      </p>

      <h2>1. Condiciones de cancelación y reembolsos</h2>
      <div className="not-prose my-6 space-y-3">
        {ESCALA.map((item) => (
          <div
            key={item.anticipacion}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="font-display text-lg font-semibold text-cafe">{item.anticipacion}</h3>
              <span
                className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${TONOS[item.tono]}`}
              >
                {item.resultado}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detalle}</p>
          </div>
        ))}
      </div>

      <h2>2. Tiempo para realizar devoluciones</h2>
      <p>
        Cuando corresponda efectuar una devolución, {BUSINESS.legalName} realizará el reembolso
        dentro de un plazo máximo de <strong>30 días calendario</strong>, contados desde la fecha en
        que se formalice la solicitud y se cuente con los datos necesarios para el pago.
      </p>

      <h2>3. Cancelaciones o incumplimientos de Loma Bonita</h2>
      <p>
        Si {BUSINESS.legalName} incumple los servicios ofrecidos o pactados, se aplicarán los
        derechos establecidos en la legislación colombiana. El artículo 3 de la Ley 300 de 1996
        contempla, según corresponda, la prestación de un servicio de la misma calidad o el
        reembolso o compensación del precio del servicio incumplido.
      </p>

      <h2>4. Cambios de fecha</h2>
      <p>
        Las solicitudes de cambio de fecha estarán sujetas a disponibilidad y deberán solicitarse
        con la mayor anticipación posible. Un cambio de fecha no constituye automáticamente una
        cancelación y podrá estar sujeto a las condiciones de la nueva reserva.
      </p>

      <h2>5. Aceptación de la política</h2>
      <p>
        Al realizar el pago o anticipo de la reserva, el cliente declara haber recibido, leído y
        aceptado las condiciones de cancelación, cambios y reembolso de {BUSINESS.legalName}.
      </p>

      <h2>6. Información de contacto</h2>
      <p>
        <strong>Ubicación.</strong> Cartago, Valle del Cauca, sobre la vía a Alcalá, entrada
        principal Piedras de Moler, segunda finca a la derecha.
      </p>
      <p>
        <strong>Reservas.</strong> WhatsApp{' '}
        <a href={waLink('¡Hola! Quiero consultar sobre una reserva en Finca Hotel Loma Bonita.')}>
          {formatPhone(BUSINESS.phones[0])}
        </a>
        .
      </p>
      <p>¡Gracias por confiar en nosotros!</p>

      <p>
        Consulta también nuestros <a href="/legal/terminos">Términos y Condiciones</a>, nuestra{' '}
        <a href="/legal/privacidad">Política de Privacidad</a>, nuestra{' '}
        <a href="/legal/datos-personales">Política de Tratamiento de Datos Personales</a> y nuestra{' '}
        <a href="/legal/cookies">Política de Cookies</a>.
      </p>
    </LegalArticle>
  )
}

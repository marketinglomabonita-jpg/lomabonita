import type { Metadata } from 'next'
import { BUSINESS, CANONICAL_ORIGIN } from '@/core/config/site'
import { formatPhone } from '@/core/lib/contact'
import { IMAGES } from '@/core/lib/images'
import { buildPageMetadata } from '@/core/lib/seo'
import { LegalArticle } from '@/features/legal/components/legal-article'

export const metadata: Metadata = buildPageMetadata({
  title: 'Términos y Condiciones de Uso',
  description: `Aviso legal y condiciones de uso del sitio web de la ${BUSINESS.legalName}: naturaleza de la plataforma, precios de ejemplo en fase de validación, propiedad del contenido y ley aplicable.`,
  path: '/legal/terminos',
  image: IMAGES['zonas-de-comunes-de-descanso'],
  imageAlt: 'Zonas comunes de descanso de la Finca Loma Bonita',
})

export default function TerminosPage() {
  return (
    <LegalArticle
      title="Términos y Condiciones de Uso"
      description="Aviso legal que regula el uso de este sitio web y de sus formularios de solicitud."
      path="/legal/terminos"
      crumb="Términos"
    >
      <h2>1. Titular del sitio</h2>
      <p>
        Este sitio web pertenece y es operado por la <strong>{BUSINESS.legalName}</strong>, con
        domicilio en {BUSINESS.displayAddress}, teléfono {formatPhone(BUSINESS.phones[0])} y
        línea {formatPhone(BUSINESS.phones[1])}.
      </p>

      <h2>2. Naturaleza de la plataforma</h2>
      <p>
        El sitio presenta los servicios de {BUSINESS.shortName} —hospedaje campestre, pasadías,
        experiencias (pista de karts, cabalgata, balsaje por el Río La Vieja), restaurante
        campestre y experiencias corporativas— y permite al visitante enviar{' '}
        <strong>solicitudes</strong> de reserva, ticket, pedido en mesa y cotización. El envío de
        una solicitud no constituye por sí solo una reserva confirmada: la disponibilidad, el
        precio final y la confirmación los otorga el establecimiento por sus canales oficiales.
      </p>

      <h2>3. Precios y disponibilidad en fase de validación</h2>
      <p>
        Esta plataforma se encuentra en fase de validación con el propietario: los precios,
        tarifas, carta y disponibilidad mostrados son <strong>valores de ejemplo</strong> sujetos
        a cambio. Los precios y la disponibilidad reales se confirman siempre por los canales
        oficiales del establecimiento (teléfono y WhatsApp {formatPhone(BUSINESS.phones[0])}).
      </p>

      <h2>4. Condiciones de uso</h2>
      <ul>
        <li>Usarás el sitio y sus formularios con fines lícitos y suministrarás información veraz.</li>
        <li>
          No está permitido intentar acceder a áreas restringidas del sitio, interferir con su
          funcionamiento ni usar herramientas automatizadas para el envío masivo de solicitudes.
        </li>
        <li>
          El establecimiento puede suspender el servicio de solicitudes en línea a quien haga uso
          abusivo de los formularios.
        </li>
      </ul>

      <h2>5. Propiedad intelectual</h2>
      <p>
        Los contenidos de este sitio (textos, fotografías, logotipo, identidad visual y marca{' '}
        {BUSINESS.legalName}) son propiedad del establecimiento o de sus titulares y están
        protegidos por la normativa de propiedad intelectual. Queda prohibida su reproducción,
        distribución o uso comercial sin autorización expresa. El sitio canónico del
        establecimiento es {CANONICAL_ORIGIN}.
      </p>

      <h2>6. Limitación de responsabilidad</h2>
      <p>
        La información del sitio se publica de buena fe con fines informativos y de solicitud de
        servicios. En la fase de validación descrita en el numeral 3, los valores mostrados son
        referenciales y no constituyen oferta mercantil vinculante. El establecimiento no responde
        por daños derivados del uso indebido del sitio ni de interrupciones ajenas a su control.
      </p>

      <h2>7. Ley aplicable y jurisdicción</h2>
      <p>
        Estos términos se rigen por las leyes de la República de Colombia. Cualquier controversia
        se someterá a los tribunales competentes de Colombia.
      </p>

      <h2>8. Modificaciones</h2>
      <p>
        El establecimiento puede actualizar estos términos en cualquier momento; la versión
        publicada en esta página es la vigente. Última actualización: 11 de septiembre de 2026.
      </p>

      <p>
        Consulta también nuestra <a href="/legal/privacidad">Política de Privacidad</a>, nuestra{' '}
        <a href="/legal/datos-personales">Política de Tratamiento de Datos Personales</a> y nuestra{' '}
        <a href="/legal/cookies">Política de Cookies</a>.
      </p>
    </LegalArticle>
  )
}

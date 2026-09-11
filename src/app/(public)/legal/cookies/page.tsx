import type { Metadata } from 'next'
import { BUSINESS } from '@/core/config/site'
import { IMAGES } from '@/core/lib/images'
import { buildPageMetadata } from '@/core/lib/seo'
import { LegalArticle } from '@/features/legal/components/legal-article'
import { CookiePreferencesButton } from '@/features/legal/components/cookie-preferences-button'

export const metadata: Metadata = buildPageMetadata({
  title: 'Política de Cookies',
  description: `Qué cookies y almacenamiento del navegador usa el sitio de la ${BUSINESS.legalName}, qué categorías existen, cómo funciona el banner de consentimiento y cómo aceptar, rechazar o revocar tu elección.`,
  path: '/legal/cookies',
  image: IMAGES['zonas-de-comunes-de-descanso'],
  imageAlt: 'Zonas comunes de descanso de la Finca Loma Bonita',
})

export default function PoliticaCookiesPage() {
  return (
    <LegalArticle
      title="Política de Cookies"
      description="Cómo usamos las cookies y el almacenamiento de tu navegador, y cómo controlas tu consentimiento."
      path="/legal/cookies"
      crumb="Cookies"
    >
      <h2>1. Qué son las cookies</h2>
      <p>
        Las cookies (y mecanismos equivalentes como el almacenamiento local del navegador) son
        pequeños archivos que un sitio guarda en tu dispositivo para recordar información: mantener
        una sesión abierta, recordar tus preferencias o medir cómo se usa el sitio.
      </p>

      <h2>2. Categorías que usa este sitio</h2>
      <h3>Esenciales</h3>
      <p>
        Necesarias para que el sitio funcione y sea seguro: mantener la sesión del personal en el
        panel interno y recordar tu decisión sobre este mismo banner de cookies. Estas no requieren
        consentimiento y el sitio no puede funcionar sin ellas.
      </p>
      <h3>Funcionales</h3>
      <p>
        Guardan tus elecciones para mejorar tu experiencia (por ejemplo, los ítems de un pedido
        que armas en la mesa mientras lo terminas). No recogen datos para perfilar.
      </p>
      <h3>Analíticas y de marketing</h3>
      <p>
        Permitirían medir el tráfico y el rendimiento del sitio o mostrarte publicidad relevante.{' '}
        <strong>Este sitio hoy no instala ninguna cookie de analítica ni de marketing.</strong> Si
        en el futuro se incorporan, se cargarán únicamente después de que aceptes el banner de
        consentimiento, y esta política se actualizará indicando qué herramientas se usan.
      </p>

      <h2>3. El banner de consentimiento</h2>
      <p>
        En tu primera visita verás un banner que te permite <strong>aceptar</strong> o{' '}
        <strong>rechazar</strong> las cookies no esenciales. Tu elección se guarda en el
        almacenamiento local de tu navegador junto con la fecha en que decidiste, y no volveremos a
        preguntarte en visitas futuras. Ninguna herramienta no esencial se carga si no has
        aceptado expresamente.
      </p>

      <h2>4. Cómo cambiar o revocar tu decisión</h2>
      <ul>
        <li>
          Desde esta página: pulsa el botón «Revisar mis preferencias de cookies» que está más
          abajo y el banner volverá a aparecer para que elijas de nuevo.
        </li>
        <li>
          Desde tu navegador: puedes borrar los datos del sitio (cookies y almacenamiento local)
          en la configuración de privacidad de tu navegador; al volver a entrar, el banner se
          mostrará de nuevo.
        </li>
      </ul>
      <CookiePreferencesButton />

      <h2>5. Más información</h2>
      <p>
        Para dudas sobre esta política escríbenos por teléfono o WhatsApp a las líneas de{' '}
        {BUSINESS.shortName} que encuentras en nuestra{' '}
        <a href="/contacto">página de contacto</a>. Consulta también nuestra{' '}
        <a href="/legal/privacidad">Política de Privacidad</a> y la{' '}
        <a href="/legal/datos-personales">Política de Tratamiento de Datos Personales</a>.
      </p>

      <p>Última actualización: 11 de septiembre de 2026.</p>
    </LegalArticle>
  )
}

import type { Metadata } from 'next'
import { BUSINESS } from '@/core/config/site'
import { formatPhone } from '@/core/lib/contact'
import { IMAGES } from '@/core/lib/images'
import { buildPageMetadata } from '@/core/lib/seo'
import { LegalArticle } from '@/features/legal/components/legal-article'

export const metadata: Metadata = buildPageMetadata({
  title: 'Política de Privacidad',
  description: `Cómo la ${BUSINESS.legalName} recoge, usa y protege los datos que entregas en los formularios de reservas, pasadías, pedidos y cotizaciones corporativas.`,
  path: '/legal/privacidad',
  image: IMAGES['zonas-de-comunes-de-descanso'],
  imageAlt: 'Zonas comunes de descanso de la Finca Loma Bonita',
})

export default function PoliticaPrivacidadPage() {
  return (
    <LegalArticle
      title="Política de Privacidad"
      description="Qué datos recogemos a través de esta plataforma, para qué los usamos y cómo los protegemos."
      path="/legal/privacidad"
      crumb="Privacidad"
    >
      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento de tus datos personales es la <strong>{BUSINESS.legalName}</strong>, con
        domicilio en {BUSINESS.displayAddress}. Puedes contactarnos por nuestras líneas
        telefónicas y WhatsApp: {formatPhone(BUSINESS.phones[0])} y {formatPhone(BUSINESS.phones[1])}.
      </p>

      <h2>2. Qué datos recogemos</h2>
      <p>
        Solo recogemos los datos que tú nos entregas voluntariamente al usar los formularios de
        esta plataforma:
      </p>
      <ul>
        <li>
          <strong>Solicitud de reserva de alojamiento</strong> (página de hospedaje): nombre,
          correo electrónico, teléfono, fechas de entrada y salida, número de adultos y niños, y
          notas opcionales de la solicitud.
        </li>
        <li>
          <strong>Solicitud de ticket de pasadía o experiencia</strong>: nombre, dato de contacto,
          fecha de visita, número de personas y las experiencias adicionales que elijas (karts,
          cabalgata, balsaje).
        </li>
        <li>
          <strong>Pedido en el restaurante</strong>: el contenido de tu pedido y el número de mesa
          desde la que lo envías; no pedimos datos personales para pedir.
        </li>
        <li>
          <strong>Cotización corporativa</strong>: nombre, empresa, correo electrónico, WhatsApp,
          fecha tentativa del evento, número de participantes y la selección de servicios que
          armaste en el asistente.
        </li>
      </ul>

      <h2>3. Para qué usamos tus datos</h2>
      <ul>
        <li>Gestionar y responder tu solicitud (reserva, ticket, pedido o cotización).</li>
        <li>Contactarte para confirmar, coordinar o aclarar detalles del servicio solicitado.</li>
        <li>Dar cumplimiento a las obligaciones legales y tributarias que correspondan.</li>
      </ul>
      <p>
        No usamos tus datos para fines publicitarios ni los vendemos, alquilamos o cedemos a
        terceros. El sitio no incorpora herramientas de analítica ni publicidad: si en el futuro
        se incorporan, solo se cargarán con tu consentimiento expreso (consulta nuestra{' '}
        <a href="/legal/cookies">Política de Cookies</a>).
      </p>

      <h2>4. Cómo almacenamos y protegemos tus datos</h2>
      <p>
        Las solicitudes se guardan en una base de datos PostgreSQL administrada con Supabase
        (proveedor en la nube), protegida con control de acceso por filas (RLS): las solicitudes
        solo son visibles para el personal autorizado de {BUSINESS.shortName} desde su panel
        interno de administración, y no pueden ser consultadas públicamente por terceros.
      </p>

      <h2>5. Tus derechos</h2>
      <p>
        Puedes solicitar conocer, actualizar o rectificar tus datos, y pedir la supresión de
        aquellos que no estemos obligados a conservar por ley, escribiéndonos por teléfono o
        WhatsApp al {formatPhone(BUSINESS.phones[0])}. El detalle completo de tus derechos como
        titular conforme a la legislación colombiana está en nuestra{' '}
        <a href="/legal/datos-personales">Política de Tratamiento de Datos Personales</a>.
      </p>

      <h2>6. Menores de edad</h2>
      <p>
        Los servicios se solicitan a través de una persona adulta. No recogemos deliberadamente
        datos personales de menores; el número de niños en una reserva se usa únicamente para
        calcular capacidad y acomodación.
      </p>

      <h2>7. Vigencia</h2>
      <p>
        Conservamos tus datos mientras sea necesario para gestionar tu solicitud y atender
        eventuales reclamaciones, y luego por los plazos de conservación que exija la ley
        colombiana.
      </p>

      <p>
        Última actualización: 11 de septiembre de 2026 · Para consultarla en cualquier momento,
        encuentra este documento en el pie de página del sitio.
      </p>
    </LegalArticle>
  )
}

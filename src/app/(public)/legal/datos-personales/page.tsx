import type { Metadata } from 'next'
import { BUSINESS } from '@/core/config/site'
import { formatPhone } from '@/core/lib/contact'
import { IMAGES } from '@/core/lib/images'
import { buildPageMetadata } from '@/core/lib/seo'
import { LegalArticle } from '@/features/legal/components/legal-article'

export const metadata: Metadata = buildPageMetadata({
  title: 'Política de Tratamiento de Datos Personales',
  description: `Política de tratamiento de datos personales de la ${BUSINESS.legalName} conforme a la Ley 1581 de 2012 (Habeas Data, Colombia): finalidad, derechos del titular y canal para ejercerlos.`,
  path: '/legal/datos-personales',
  image: IMAGES['zonas-de-comunes-de-descanso'],
  imageAlt: 'Zonas comunes de descanso de la Finca Loma Bonita',
})

export default function DatosPersonalesPage() {
  return (
    <LegalArticle
      title="Política de Tratamiento de Datos Personales"
      description="Conforme al régimen de Habeas Data de la Ley 1581 de 2012 y sus decretos reglamentarios (Colombia)."
      path="/legal/datos-personales"
      crumb="Datos personales"
    >
      <h2>1. Identificación del responsable</h2>
      <p>
        <strong>{BUSINESS.legalName}</strong>, establecimiento de turismo y hospedaje ubicado en{' '}
        {BUSINESS.displayAddress}, responsable del tratamiento de datos personales recogidos a
        través de este sitio web.
      </p>

      <h2>2. Tratamiento y finalidad</h2>
      <p>
        Los datos personales que entregas en los formularios del sitio (reserva de alojamiento,
        solicitud de tickets de pasadía o experiencias, pedido en mesa y cotizaciones
        corporativas) se tratan con las siguientes finalidades:
      </p>
      <ul>
        <li>Recibir, gestionar y responder tus solicitudes de reserva, ticket, pedido o cotización.</li>
        <li>Contactarte para confirmar disponibilidad, coordinar logística y aclarar detalles del servicio.</li>
        <li>Cumplir obligaciones legales, tributarias y de atención al usuario.</li>
      </ul>

      <h2>3. Autorización previa, expresa e informada</h2>
      <p>
        La Ley 1581 de 2012 exige autorización previa, expresa e informada del titular. Al enviar
        cualquiera de nuestros formularios manifiestas de forma inequívoca que autorizas el
        tratamiento de tus datos para las finalidades descritas en esta política. Si no aceptas
        estas condiciones, por favor no envíes los formularios y contáctanos directamente por
        nuestros canales telefónicos.
      </p>

      <h2>4. Derechos del titular</h2>
      <p>Como titular de datos personales tienes derecho a:</p>
      <ul>
        <li><strong>Conocer</strong> los datos personales tuyos que estén en nuestras bases de datos.</li>
        <li><strong>Actualizar y rectificar</strong> tus datos cuando sean parciales, inexactos o incompletos.</li>
        <li><strong>Solicitar prueba</strong> de la autorización otorgada como titular.</li>
        <li><strong>Ser informado</strong> del uso que se le da a tus datos personales.</li>
        <li>
          <strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC)
          por infracciones a la normatividad de protección de datos.
        </li>
        <li>
          <strong>Revocar la autorización</strong> y solicitar la supresión de tus datos cuando no
          exista deber legal de conservarlos.
        </li>
      </ul>

      <h2>5. Canal para ejercer tus derechos</h2>
      <p>
        Para conocer, actualizar, rectificar o suprimir tus datos, o para revocar tu autorización,
        puedes comunicarte con nosotros por teléfono o WhatsApp al{' '}
        {formatPhone(BUSINESS.phones[0])} o a la línea {formatPhone(BUSINESS.phones[1])}, en el
        horario de atención de reservas ({BUSINESS.hours.reservas}). Atenderemos tu solicitud en
        el plazo máximo de quince (15) días hábiles contados a partir de su recepción.
      </p>

      <h2>6. Seguridad de la información</h2>
      <p>
        Las bases de datos se administran en plataformas en la nube con control de acceso
        restringido al personal autorizado de {BUSINESS.shortName} y políticas de acceso por
        filas (RLS) que impiden la consulta pública de las solicitudes. Adoptamos las medidas
        técnicas, humanas y administrativas razonables para proteger tus datos contra acceso no
        autorizado, pérdida o alteración.
      </p>

      <h2>7. Vigencia de la base de datos</h2>
      <p>
        La base de datos de titulares se mantendrá vigente durante el tiempo necesario para
        atender las solicitudes y cumplir las obligaciones legales aplicables. Una vez cumplan
        esas finalidades, los datos serán eliminados de forma segura.
      </p>

      <p>
        Consulta también nuestra <a href="/legal/privacidad">Política de Privacidad</a> y nuestra{' '}
        <a href="/legal/cookies">Política de Cookies</a>. Última actualización: 11 de septiembre
        de 2026.
      </p>
    </LegalArticle>
  )
}

import { waLink } from '@/core/lib/contact'
import { WhatsAppIcon } from './brand-icons'

export function WhatsAppFloat() {
  return (
    <a
      href={waLink('¡Hola Finca Loma Bonita! Quiero reservar mi visita.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      title="¡Escríbenos ahora!"
      className="fixed bottom-5 right-5 z-50 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  )
}

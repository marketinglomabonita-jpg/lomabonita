import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, MapPin, Phone } from 'lucide-react'
import { BUSINESS } from '@/core/config/site'
import { formatPhone } from '@/core/lib/contact'
import { IMAGES } from '@/core/lib/images'
import { NAV_LINKS } from '../data/nav'
import { TikTokIcon } from './brand-icons'

const SERVICES = [
  'Piscina recreativa',
  'Restaurante campestre',
  'Cancha de fútbol',
  'Zona de billares y juegos',
  'Salón de eventos',
  'Hospedaje campestre',
  'Pasadías',
  'Balsaje por el Río La Vieja',
]

const ZONA_CHIPS = ['Piedras de Moler', 'Vía Alcalá · Cartago', 'Eje Cafetero', 'Río La Vieja']

const LEGAL_LINKS = [
  { href: '/legal/terminos', label: 'Términos y Condiciones' },
  { href: '/legal/privacidad', label: 'Política de Privacidad' },
  { href: '/legal/datos-personales', label: 'Datos Personales' },
  { href: '/legal/cookies', label: 'Cookies' },
]

export function SiteFooter() {
  const year = new Date().getFullYear()
  const logo = IMAGES['logo-finca-loma-bonita']

  return (
    <footer className="bg-cafe text-primary-foreground">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="inline-block rounded-lg bg-white/95 p-2">
            <Image
              src={logo.src}
              width={logo.w}
              height={logo.h}
              alt={`Logo de ${BUSINESS.legalName}`}
              className="h-16 w-auto"
            />
          </div>
          <p className="font-display text-lg text-arcilla">{BUSINESS.slogan}</p>
          <p className="text-sm leading-relaxed text-primary-foreground/80">
            Tu escape campestre familiar en Piedras de Moler, Cartago. El lugar perfecto
            para crear recuerdos inolvidables en familia, con amigos o en integraciones
            de empresas.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <a
              href={BUSINESS.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Síguenos en Instagram"
              className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <Instagram className="size-5" aria-hidden="true" />
            </a>
            <a
              href={BUSINESS.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Síguenos en Facebook"
              className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <Facebook className="size-5" aria-hidden="true" />
            </a>
            <a
              href={BUSINESS.social.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Síguenos en TikTok"
              className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <TikTokIcon className="size-5" />
            </a>
          </div>
        </div>

        <nav aria-label="Mapa del sitio">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-arcilla">
            Mapa del sitio
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-primary-foreground/80 transition-colors hover:text-white hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-arcilla">
            Nuestros servicios
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/80">
            {SERVICES.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-arcilla">
            Ubicación y contacto
          </h2>
          <address className="mt-4 space-y-3 text-sm not-italic text-primary-foreground/80">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-arcilla" aria-hidden="true" />
              {BUSINESS.displayAddress}
            </p>
            <p className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-arcilla" aria-hidden="true" />
              <span>
                {BUSINESS.phones.map((phone, i) => (
                  <span key={phone}>
                    {i > 0 && ' · '}
                    <a href={`tel:${phone}`} className="hover:text-white hover:underline">
                      {formatPhone(phone)}
                    </a>
                  </span>
                ))}
              </span>
            </p>
          </address>
          <a
            href={BUSINESS.links.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary-foreground/80 transition-colors hover:text-white hover:underline"
          >
            <MapPin className="size-4 shrink-0 text-arcilla" aria-hidden="true" />
            Ver ubicación en Google Maps
          </a>
          <div className="mt-5 flex flex-wrap gap-2">
            {ZONA_CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-center text-xs text-primary-foreground/70 sm:flex-row sm:text-left">
          <p>
            © {year} {BUSINESS.legalName}. Todos los derechos reservados.
          </p>
          <nav aria-label="Enlaces legales">
            <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p>{BUSINESS.links.instagramHandle} · Piedras de Moler, Cartago</p>
        </div>
      </div>
    </footer>
  )
}

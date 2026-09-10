import type { Metadata } from 'next'
import { Montserrat, Fraunces } from 'next/font/google'
import './globals.css'
import { CANONICAL_ORIGIN, IS_DEMO, BUSINESS } from '@/core/config/site'

const sans = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: {
    default: `${BUSINESS.legalName} | Pasadía, hospedaje y experiencias en el Eje Cafetero`,
    template: `%s | ${BUSINESS.shortName}`,
  },
  description:
    'Finca hotel campestre en Piedras de Moler, Vía Alcalá (Cartago), junto al Río La Vieja. Pasadía, hospedaje, restaurante, salón de eventos y experiencias como el balsaje por el Río La Vieja.',
  applicationName: BUSINESS.legalName,
  // En demo se fuerza noindex tambien via <meta> (ademas de la cabecera del middleware / next.config).
  robots: IS_DEMO ? { index: false, follow: false } : { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  )
}

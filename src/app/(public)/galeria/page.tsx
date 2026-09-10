import type { Metadata } from 'next'
import { IMAGES } from '@/core/lib/images'
import { breadcrumbJsonLd, buildPageMetadata, JsonLd } from '@/core/lib/seo'
import { PageHero } from '@/features/marketing/components/page-hero'
import { GalleryGrid } from '@/features/galeria/components/gallery-grid'

export const metadata: Metadata = buildPageMetadata({
  title: 'Galería — Fotos de la finca hotel en el Eje Cafetero',
  description:
    'Recorre en fotos la Finca Hotel Loma Bonita: piscinas, habitaciones, gastronomía típica y visitantes disfrutando su pasadía en Piedras de Moler, Cartago, junto al Río La Vieja.',
  path: '/galeria',
  image: IMAGES['loma-bonita'],
  imageAlt: 'Panorámica de la Finca Hotel Loma Bonita y sus palmeras',
})

export default function GaleriaPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Galería', path: '/galeria' },
        ])}
      />
      <PageHero
        tag="Galería fotográfica"
        title="Explora nuestro pedacito de paraíso"
        description="Descubre los rincones, paisajes y momentos felices que te esperan en la Finca Loma Bonita."
        image={IMAGES['loma-bonita']}
        imageAlt="Panorámica de la Finca Loma Bonita y sus palmeras"
      />
      <section className="py-12 sm:py-16">
        <div className="container">
          <GalleryGrid />
        </div>
      </section>
    </>
  )
}

import type { Metadata } from 'next'
import { IMAGES } from '@/core/lib/images'
import { PageHero } from '@/features/marketing/components/page-hero'
import { GalleryGrid } from '@/features/galeria/components/gallery-grid'

export const metadata: Metadata = {
  title: 'Galería',
  description:
    'Fotos de la Finca Loma Bonita: piscinas, zonas verdes, habitación, gastronomía típica y visitantes disfrutando su pasadía en Piedras de Moler, Cartago.',
}

export default function GaleriaPage() {
  return (
    <>
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

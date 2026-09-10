import Image from 'next/image'
import { cn } from '@/core/lib/utils'
import type { ImageAsset } from '@/core/lib/images'

type PageHeroProps = {
  tag: string
  title: string
  description?: string
  image?: ImageAsset
  imageAlt?: string
}

/** Cabecera de pagina de servicio: hero corto con imagen y overlay, o version plana. */
export function PageHero({ tag, title, description, image, imageAlt = '' }: PageHeroProps) {
  const heading = (
    <div className="max-w-3xl space-y-3">
      <p className={cn('text-xs font-semibold uppercase tracking-[0.2em]', image ? 'text-white/80' : 'text-accent')}>
        {tag}
      </p>
      <h1
        className={cn(
          'font-display text-3xl font-semibold sm:text-5xl',
          image ? 'text-white' : 'text-primary',
        )}
      >
        {title}
      </h1>
      {description && (
        <p className={cn('max-w-2xl', image ? 'text-white/85' : 'text-muted-foreground')}>
          {description}
        </p>
      )}
    </div>
  )

  if (!image) {
    return (
      <section className="border-b border-border bg-muted/40">
        <div className="container py-12 sm:py-16">{heading}</div>
      </section>
    )
  }

  return (
    <section className="relative flex min-h-[46svh] items-end overflow-hidden">
      <Image
        src={image.src}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-selva/90 via-selva/45 to-black/20"
        aria-hidden="true"
      />
      <div className="container relative pb-10 pt-24">{heading}</div>
    </section>
  )
}

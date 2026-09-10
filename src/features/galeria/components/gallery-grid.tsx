'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import {
  GALLERY_CATEGORIES,
  GALLERY_ITEMS,
  type GalleryFilter,
} from '../data/gallery'

export function GalleryGrid() {
  const [filter, setFilter] = useState<GalleryFilter>('todas')
  const [lightbox, setLightbox] = useState<number | null>(null)

  const items =
    filter === 'todas' ? GALLERY_ITEMS : GALLERY_ITEMS.filter((i) => i.category === filter)

  const close = useCallback(() => setLightbox(null), [])
  const step = useCallback(
    (dir: 1 | -1) =>
      setLightbox((cur) => (cur === null ? null : (cur + dir + items.length) % items.length)),
    [items.length],
  )

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, close, step])

  const current = lightbox !== null ? items[lightbox] : null

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {GALLERY_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={filter === c.id}
            onClick={() => {
              setFilter(c.id)
              setLightbox(null)
            }}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              filter === c.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground/80 hover:bg-muted',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-8 columns-2 gap-3 sm:columns-3">
        {items.map((item, index) => (
          <button
            key={item.caption}
            type="button"
            onClick={() => setLightbox(index)}
            aria-label={`Ampliar: ${item.caption}`}
            className="group mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg border border-border bg-card text-left"
          >
            <Image
              src={item.image.src}
              alt={item.alt}
              width={item.image.w}
              height={item.image.h}
              sizes="(min-width: 640px) 33vw, 50vw"
              className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="block px-3 py-2 text-xs font-medium text-muted-foreground">
              {item.caption}
            </span>
          </button>
        ))}
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.caption}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              step(-1)
            }}
            aria-label="Imagen anterior"
            className="absolute left-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <figure
            className="flex max-h-full flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current.image.src}
              alt={current.alt}
              width={current.image.w}
              height={current.image.h}
              className="h-auto max-h-[78vh] w-auto max-w-full object-contain"
            />
            <figcaption className="text-sm text-white/85">{current.caption}</figcaption>
          </figure>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              step(1)
            }}
            aria-label="Siguiente imagen"
            className="absolute right-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

import { PageHero } from '@/features/marketing/components/page-hero'
import { breadcrumbJsonLd, JsonLd } from '@/core/lib/seo'

type LegalArticleProps = {
  title: string
  description: string
  path: string
  /** Nombre corto para el breadcrumb (Inicio > {crumb}). */
  crumb: string
  children: React.ReactNode
}

/** Esqueleto comun de las paginas legales: hero plano + articulo de lectura larga. */
export function LegalArticle({ title, description, path, crumb, children }: LegalArticleProps) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: crumb, path },
        ])}
      />
      <PageHero tag="Información legal" title={title} description={description} />
      <section className="py-10 sm:py-14">
        <div className="container max-w-3xl">
          <article className="legal-prose">{children}</article>
        </div>
      </section>
    </>
  )
}

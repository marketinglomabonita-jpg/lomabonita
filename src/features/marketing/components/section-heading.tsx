import { cn } from '@/core/lib/utils'

type SectionHeadingProps = {
  tag?: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  tone?: 'dark' | 'light'
}

export function SectionHeading({
  tag,
  title,
  subtitle,
  align = 'center',
  tone = 'dark',
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-2xl space-y-3',
        align === 'center' && 'mx-auto text-center',
      )}
    >
      {tag && (
        <p
          className={cn(
            'text-xs font-semibold uppercase tracking-[0.2em]',
            tone === 'dark' ? 'text-accent' : 'text-white/80',
          )}
        >
          {tag}
        </p>
      )}
      <h2
        className={cn(
          'text-3xl font-semibold sm:text-4xl',
          tone === 'dark' ? 'text-cafe' : 'text-white',
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={tone === 'dark' ? 'text-muted-foreground' : 'text-white/85'}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

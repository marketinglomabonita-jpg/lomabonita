import { Check } from 'lucide-react'
import { cn } from '@/core/lib/utils'

type StackItem = { title: string; detail?: string }

type ValueStackProps = {
  items: ReadonlyArray<StackItem>
  /** Filas resaltadas al final (lo que un plan suma sobre el básico). */
  highlights?: ReadonlyArray<StackItem>
  footer?: React.ReactNode
  className?: string
}

/** Pila de valor: cada cosa incluida en su propia fila, para que el paquete se vea completo. */
export function ValueStack({ items, highlights = [], footer, className }: ValueStackProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <StackRow key={item.title} item={item} />
        ))}
        {highlights.map((item) => (
          <StackRow key={item.title} item={item} highlighted />
        ))}
      </ul>
      {footer && <div className="border-t border-border bg-muted/50 px-4 py-4">{footer}</div>}
    </div>
  )
}

function StackRow({ item, highlighted = false }: { item: StackItem; highlighted?: boolean }) {
  return (
    <li className={cn('flex items-start gap-3 px-4 py-3', highlighted && 'bg-accent/10')}>
      <span
        className={cn(
          'mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full',
          highlighted ? 'bg-accent text-white' : 'bg-primary/10 text-primary',
        )}
      >
        <Check className="size-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{item.title}</p>
        {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
      </div>
    </li>
  )
}

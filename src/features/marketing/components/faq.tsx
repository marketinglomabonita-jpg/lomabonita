import { ChevronDown } from 'lucide-react'

export type FaqItem = { question: string; answer: string }

/** Acordeon nativo (<details>) — accesible por teclado sin JavaScript. */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-lg border border-border bg-card"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 font-medium [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  )
}

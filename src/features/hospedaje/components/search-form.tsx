'use client'

import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs'
import { cn } from '@/core/lib/utils'
import { buttonVariants } from '@/core/ui/button'
import { Search } from 'lucide-react'

export function SearchForm() {
  const [search, setSearch] = useQueryStates(
    {
      checkIn: parseAsString.withDefault(''),
      checkOut: parseAsString.withDefault(''),
      adultos: parseAsInteger.withDefault(2),
      ninos: parseAsInteger.withDefault(0),
    },
    {
      shallow: false,
    },
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    setSearch({
      checkIn: formData.get('checkIn') as string,
      checkOut: formData.get('checkOut') as string,
      adultos: Number(formData.get('adultos')),
      ninos: Number(formData.get('ninos')),
    })
  }

  // Fecha mínima: mañana
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
    >
      <div>
        <label htmlFor="checkIn" className="mb-1.5 block text-sm font-medium">
          Entrada
        </label>
        <input
          type="date"
          id="checkIn"
          name="checkIn"
          required
          min={minDate}
          defaultValue={search.checkIn}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="checkOut" className="mb-1.5 block text-sm font-medium">
          Salida
        </label>
        <input
          type="date"
          id="checkOut"
          name="checkOut"
          required
          min={minDate}
          defaultValue={search.checkOut}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="adultos" className="mb-1.5 block text-sm font-medium">
          Adultos
        </label>
        <input
          type="number"
          id="adultos"
          name="adultos"
          required
          min={1}
          max={10}
          defaultValue={search.adultos}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="ninos" className="mb-1.5 block text-sm font-medium">
          Niños
        </label>
        <input
          type="number"
          id="ninos"
          name="ninos"
          min={0}
          max={10}
          defaultValue={search.ninos}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <button type="submit" className={cn(buttonVariants(), 'w-full')}>
          <Search className="size-4" aria-hidden="true" />
          Buscar
        </button>
      </div>
    </form>
  )
}

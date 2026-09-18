import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/core/lib/utils'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    return (
      <div className="relative inline-flex">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => {
            onChange?.(e)
            onCheckedChange?.(e.target.checked)
          }}
          className={cn(
            'peer h-4 w-4 shrink-0 appearance-none rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:text-primary-foreground',
            className,
          )}
          {...props}
        />
        {checked && (
          <Check className="pointer-events-none absolute left-0 top-0 h-4 w-4 text-white" />
        )}
      </div>
    )
  },
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }

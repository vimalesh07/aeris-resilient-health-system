import * as React from 'react'
import { cn } from '@/lib/utils'

const CONTROL =
  'h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-fg placeholder:text-fg-muted transition-colors focus:border-brand focus:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-60'

export function Field({ label, hint, htmlFor, children, className }: { label: string; hint?: React.ReactNode; htmlFor: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-fg-muted">{hint}</p>}
    </div>
  )
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(CONTROL, className)} {...props} />
})

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={cn(CONTROL, 'cursor-pointer pr-8', className)} {...props} />
})

export function Switch({ checked, onChange, label, description, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: React.ReactNode; id: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors', checked ? 'bg-brand' : 'bg-line-strong')}
      >
        <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200', checked && 'translate-x-5')} />
      </button>
    </div>
  )
}

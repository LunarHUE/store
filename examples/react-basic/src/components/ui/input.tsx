import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export function Input({
  className,
  type = 'text',
  ...props
}: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'flex h-12 w-full min-w-0 rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  )
}

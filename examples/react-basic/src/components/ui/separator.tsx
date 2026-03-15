import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
  decorative?: boolean
  orientation?: 'horizontal' | 'vertical'
}

export function Separator({
  className,
  decorative = true,
  orientation = 'horizontal',
  ...props
}: SeparatorProps) {
  return (
    <div
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      data-slot="separator"
      role={decorative ? 'presentation' : 'separator'}
      {...props}
    />
  )
}

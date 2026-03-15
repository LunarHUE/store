import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type CardProps<T extends ElementType> = {
  as?: T
  className?: string
  children?: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function Card<T extends ElementType = 'article'>({
  as,
  children,
  className,
  ...props
}: CardProps<T>) {
  const Component = as ?? 'article'

  return (
    <Component
      className={cn(
        'grid gap-5 rounded-4xl border border-border bg-panel p-6 shadow-[0_18px_50px_rgba(35,41,46,0.06)]',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

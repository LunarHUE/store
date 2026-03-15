import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-card text-card-foreground shadow-[0_18px_50px_rgba(35,41,46,0.06)] backdrop-blur-sm',
        className,
      )}
      data-slot="card"
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid auto-rows-min grid-rows-[auto_auto] gap-2 px-6 pt-6',
        className,
      )}
      data-slot="card-header"
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'font-serif text-3xl leading-tight tracking-[-0.04em]',
        className,
      )}
      data-slot="card-title"
      {...props}
    />
  )
}

export function CardDescription({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-sm leading-6 text-muted-foreground', className)}
      data-slot="card-description"
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('px-6 pb-6', className)}
      data-slot="card-content"
      {...props}
    />
  )
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center px-6 pb-6', className)}
      data-slot="card-footer"
      {...props}
    />
  )
}

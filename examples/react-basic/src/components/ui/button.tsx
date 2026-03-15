import * as React from 'react'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-[0.01em] transition-all outline-none focus-visible:ring-4 focus-visible:ring-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_14px_24px_rgba(31,45,56,0.18)] hover:bg-primary/92',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/88',
        outline:
          'border border-border bg-background text-foreground hover:bg-secondary',
        ghost: 'text-foreground hover:bg-secondary',
        accent:
          'bg-accent text-accent-foreground shadow-[0_12px_24px_rgba(143,91,47,0.18)] hover:bg-accent/90',
      },
      size: {
        default: 'min-h-11 px-5',
        sm: 'min-h-9 px-4 text-sm',
        lg: 'min-h-12 px-6 text-base',
        icon: 'size-10 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      data-slot="button"
      {...props}
    />
  )
}

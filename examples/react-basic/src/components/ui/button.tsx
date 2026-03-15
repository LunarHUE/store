import type { ButtonHTMLAttributes } from 'react'

import { cva } from 'class-variance-authority'

type ButtonVariant = 'primary' | 'secondary' | 'quiet'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}
const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold tracking-[0.01em] transition-colors disabled:cursor-not-allowed disabled:border-[var(--color-border)] disabled:bg-[var(--color-panel-soft)] disabled:text-[var(--color-muted)]',
  {
    variants: {
      variant: {
        primary: 'border-ink bg-ink text-paper hover:bg-[#21384a]',
        secondary: 'border-strong bg-paper text-ink hover:bg-[#f3ede3]',
        quiet: 'border-transparent bg-panel-soft text-ink hover:bg-[#ebe4d8]',
      },
    },
  },
)

export function Button({
  className,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, className })}
      type={type}
      {...props}
    />
  )
}

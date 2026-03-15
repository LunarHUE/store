import type { ReactNode } from 'react'

interface MetaRowProps {
  label: string
  value: ReactNode
}

export function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="m-0 text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

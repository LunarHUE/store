import type { ReactNode } from 'react'

interface MetaRowProps {
  label: string
  value: ReactNode
}

export function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0 last:pb-0">
      <dt className="text-sm uppercase tracking-[0.14em] text-muted">
        {label}
      </dt>
      <dd className="m-0 text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

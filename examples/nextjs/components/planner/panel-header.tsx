import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function PanelHeader({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode
  description: string
  eyebrow: string
  title: string
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </p>
        <div className="space-y-1">
          <h2 className="font-display text-xl leading-tight tracking-[-0.025em] text-foreground">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {action ? <div className={cn('shrink-0')}>{action}</div> : null}
    </div>
  )
}

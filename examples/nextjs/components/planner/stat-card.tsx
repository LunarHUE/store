import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({
  detail,
  label,
  value,
  className,
}: {
  className?: string
  detail: string
  label: string
  value: string
}) {
  return (
    <Card className={cn('shadow-none', className)} size="sm">
      <CardContent className="space-y-2 px-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="text-base font-semibold tracking-[-0.02em] text-foreground">
          {value}
        </p>
        <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

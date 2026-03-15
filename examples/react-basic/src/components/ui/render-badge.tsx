import { useRef } from 'react'

import { Badge } from '@/components/ui/badge'

export function RenderBadge({ label = 'Render Count' }: { label?: string }) {
  const renders = useRef(0)
  renders.current += 1

  return (
    <Badge className="gap-2" variant="outline">
      <span>{label}</span>
      <strong className="text-foreground">{renders.current}x</strong>
    </Badge>
  )
}

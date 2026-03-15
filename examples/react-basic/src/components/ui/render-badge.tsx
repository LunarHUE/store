import { useRef } from 'react'

export function RenderBadge() {
  const renders = useRef(0)
  renders.current += 1

  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-strong bg-panel-soft px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
      <span>Render Count</span>
      <strong className="text-ink">{renders.current}x</strong>
    </span>
  )
}

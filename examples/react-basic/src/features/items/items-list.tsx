import { useActions } from '@lunarhue/store/plugins/actions'
import { useStore, useStoreSelector } from '@lunarhue/store/react'

import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { RenderBadge } from '../../components/ui/render-badge'
import { demoStoreBuilder } from '../../store/demo-store'

function RemoveItemButton({ index }: { index: number }) {
  const store = useStore(demoStoreBuilder)
  const actions = useActions(store)

  return (
    <Button onClick={() => actions.removeItem(index)} variant="quiet">
      Remove
    </Button>
  )
}

export function ItemsList() {
  const items = useStoreSelector(demoStoreBuilder, (state) => state.items)

  return (
    <Card className="gap-6">
      <div className="grid gap-3">
        <RenderBadge />
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Persisted list
          </p>
          <h2 className="font-serif text-3xl leading-tight tracking-[-0.04em]">
            List rendering stays isolated to the collection.
          </h2>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-strong bg-panel-soft px-5 py-6 text-sm leading-6 text-muted">
          Add a few items and reload the page to verify persistence and the
          render boundaries.
        </div>
      ) : (
        <ul className="grid gap-3 overflow-y-auto max-h-[300px]">
          {items.map((item, index) => (
            <li
              className="flex flex-col gap-4 rounded-3xl border border-border bg-paper px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              key={`${item}-${index}`}
            >
              <span className="text-base leading-7 text-ink">{item}</span>
              <RemoveItemButton index={index} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

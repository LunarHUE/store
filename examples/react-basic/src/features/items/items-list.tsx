import { useActions } from '@lunarhue/store/plugins/actions'
import { useStore, useStoreSelector } from '@lunarhue/store/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RenderBadge } from '@/components/ui/render-badge'
import { demoStoreBuilder } from '@/store/demo-store'

function RemoveItemButton({ index }: { index: number }) {
  const store = useStore(demoStoreBuilder)
  const actions = useActions(store)

  return (
    <Button onClick={() => actions.removeItem(index)} variant="ghost">
      Remove
    </Button>
  )
}

export function ItemsList() {
  const items = useStoreSelector(demoStoreBuilder, (state) => state.items)

  return (
    <Card>
      <CardHeader className="gap-3">
        <RenderBadge label="Items list" />
        <div className="grid gap-2">
          <Badge className="justify-self-start" variant="accent">
            Persisted list
          </Badge>
          <CardTitle>
            List rendering stays isolated to the collection.
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted px-5 py-6 text-sm leading-6 text-muted-foreground">
            Add a few items and reload the page to verify persistence and the
            render boundaries.
          </div>
        ) : (
          <ul className="max-h-[265px] grid gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-panel-soft">
            {items.map((item, index) => (
              <li
                className="flex flex-col gap-4 rounded-xl border border-border bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                key={`${item}-${index}`}
              >
                <span className="text-base leading-7 text-foreground">
                  {item}
                </span>
                <RemoveItemButton index={index} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

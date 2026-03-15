import { useActions } from '@lunarhue/store/plugins/actions'
import { useStore, useStoreSelector } from '@lunarhue/store/react'

import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { RenderBadge } from '../../components/ui/render-badge'
import { demoStoreBuilder } from '../../store/demo-store'

function DraftInput() {
  const store = useStore(demoStoreBuilder)
  const actions = useActions(store)
  const draft = useStoreSelector(demoStoreBuilder, (state) => state.draft)

  return (
    <label className="grid gap-3">
      <RenderBadge />
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        Draft
      </span>
      <input
        className="min-h-13 rounded-2xl border border-strong bg-paper px-4 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
        onChange={(event) => actions.setDraft(event.currentTarget.value)}
        placeholder="Add something worth persisting"
        value={draft}
      />
    </label>
  )
}

function AddItemButton() {
  const store = useStore(demoStoreBuilder)
  const actions = useActions(store)
  const canAdd = useStoreSelector(
    demoStoreBuilder,
    (state) => state.draft.trim().length > 0,
  )

  return (
    <div className="grid gap-3">
      <RenderBadge />
      <Button
        className="w-full sm:w-auto"
        disabled={!canAdd}
        onClick={() => actions.addItem()}
      >
        Add item
      </Button>
    </div>
  )
}

export function DraftComposer() {
  return (
    <Card className="gap-6">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          Draft composer
        </p>
        <h2 className="font-serif text-3xl leading-tight tracking-[-0.04em]">
          Controls subscribe to their own state.
        </h2>
        <p className="max-w-xl text-sm leading-6 text-muted">
          The input selects `draft`, while the button only selects whether the
          current draft can be added. The wrapper just lays things out.
        </p>
      </div>

      <div className="grid gap-4">
        <DraftInput />
        <AddItemButton />
      </div>
    </Card>
  )
}

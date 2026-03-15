import { useActions } from '@lunarhue/store/plugins/actions'
import { useStore, useStoreSelector } from '@lunarhue/store/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RenderBadge } from '@/components/ui/render-badge'
import { demoStoreBuilder } from '@/store/demo-store'

function DraftInput() {
  const store = useStore(demoStoreBuilder)
  const actions = useActions(store)
  const draft = useStoreSelector(demoStoreBuilder, (state) => state.draft)

  return (
    <label className="grid gap-3">
      <RenderBadge label="Draft input" />
      <Badge className="justify-self-start" variant="accent">
        Draft
      </Badge>
      <Input
        className="h-[3.25rem] rounded-xl border-input bg-background"
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
      <RenderBadge label="Add button" />
      <Button
        className="w-full sm:w-auto"
        disabled={!canAdd}
        onClick={() => actions.addItem()}
        variant="accent"
      >
        Add item
      </Button>
    </div>
  )
}

export function DraftComposer() {
  return (
    <Card>
      <CardHeader>
        <Badge className="justify-self-start" variant="accent">
          Draft composer
        </Badge>
        <CardTitle>
          Controls subscribe to their own state.
        </CardTitle>
        <CardDescription className="max-w-xl">
          The input selects `draft`, while the button only selects whether the
          current draft can be added. The wrapper just lays things out.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <DraftInput />
        <AddItemButton />
      </CardContent>
    </Card>
  )
}

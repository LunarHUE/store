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
import { RenderBadge } from '@/components/ui/render-badge'
import { demoStoreBuilder } from '@/store/demo-store'

function CountValue() {
  const count = useStoreSelector(demoStoreBuilder, (state) => state.count)

  return (
    <div className="grid gap-3">
      <RenderBadge label="Count readout" />
      <Badge className="justify-self-start" variant="accent">
        Count
      </Badge>
      <p className="block font-serif text-7xl align-middle text-accent sm:text-8xl">
        {count}
      </p>
    </div>
  )
}

function IncrementButton() {
  const store = useStore(demoStoreBuilder)
  const actions = useActions(store)

  return (
    <Button
      variant="secondary"
      className="justify-self-start"
      onClick={() => actions.increment()}
    >
      Increment via actions()
    </Button>
  )
}

export function CounterPanel() {
  return (
    <Card className="border-primary/70 bg-primary text-primary-foreground">
      <CardHeader>
        <Badge
          className="justify-self-start border-white/10 bg-white/10 text-[#d8c3a0]"
          variant="outline"
        >
          Counter
        </Badge>
        <CardTitle>
          Selector reads stay separate from action wiring.
        </CardTitle>
        <CardDescription className="max-w-lg text-primary-foreground/80">
          The panel itself does not subscribe to count. The readout selects the
          number, and the button only grabs the action surface.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5">
        <CountValue />
        <IncrementButton />
      </CardContent>
    </Card>
  )
}

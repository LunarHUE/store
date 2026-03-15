import { useActions } from '@lunarhue/store/plugins/actions'
import { useStore } from '@lunarhue/store/react'

import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { RenderBadge } from '../../components/ui/render-badge'
import { demoStoreBuilder } from '../../store/demo-store'
import { useStoreSelector } from '@lunarhue/store/react'

function CountValue() {
  const count = useStoreSelector(demoStoreBuilder, (state) => state.count)

  return (
    <div className="grid gap-3">
      <RenderBadge />
      <p className="block font-serif text-7xl align-middle  text-accent sm:text-8xl">
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
    <Card className="gap-6 bg-ink text-paper">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          Counter
        </p>
        <h2 className="font-serif text-3xl leading-tight tracking-[-0.04em]">
          Selector reads stay separate from action wiring.
        </h2>
        <p className="max-w-lg text-sm leading-6">
          The panel itself does not subscribe to count. The readout selects the
          number, and the button only grabs the action surface.
        </p>
      </div>

      <div className="grid">
        <CountValue />
        <IncrementButton />
      </div>
    </Card>
  )
}

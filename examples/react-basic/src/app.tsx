import { PersistStoreProvider } from '@lunarhue/store/plugins/persist'

import { CounterPanel } from './features/counter/counter-panel'
import { DraftComposer } from './features/items/draft-composer'
import { ItemsList } from './features/items/items-list'
import { PersistMetaPanel } from './features/persist/persist-meta-panel'
import { Card } from './components/ui/card'
import { demoStoreBuilder } from './store/demo-store'

export function App() {
  return (
    <PersistStoreProvider
      builder={demoStoreBuilder}
      flushOnUnmount
      flushOnPageHide
      flushOnBackground
    >
      <main className="min-h-screen bg-page px-4 py-6 text-ink sm:px-6 sm:py-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:gap-8">
          <section className="grid gap-4 border-b border-strong pb-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)] lg:items-end">
            <div className="grid gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                @lunarhue/store
              </p>
              <div className="grid gap-3">
                <h1 className="max-w-4xl font-serif text-5xl leading-[0.92] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                  Selector-first state, trimmed down into real components.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted sm:text-lg">
                  This example keeps the public store APIs from the basic demo,
                  but the UI is split into reusable pieces. Layout components
                  stay presentational while leaf nodes subscribe to the exact
                  store slice they render.
                </p>
              </div>
            </div>

            <Card as="aside" className="gap-3 self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                What changed
              </p>
              <ul className="grid gap-2 text-sm leading-6 text-(--color-muted)">
                <li>Tailwind replaces inline styles.</li>
                <li>Shared cards, buttons, rows, and render badges.</li>
                <li>Selectors live in leaves like readouts and controls.</li>
              </ul>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <CounterPanel />
            <PersistMetaPanel />
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <DraftComposer />
            <ItemsList />
          </section>
        </div>
      </main>
    </PersistStoreProvider>
  )
}

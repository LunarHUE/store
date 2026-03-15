import { PersistStoreProvider } from '@lunarhue/store/plugins/persist'

import { Badge } from '@/components/ui/badge'
import { CounterPanel } from '@/features/counter/counter-panel'
import { DraftComposer } from '@/features/items/draft-composer'
import { ItemsList } from '@/features/items/items-list'
import { PersistMetaPanel } from '@/features/persist/persist-meta-panel'
import { demoStoreBuilder } from '@/store/demo-store'

export function App() {
  return (
    <PersistStoreProvider
      builder={demoStoreBuilder}
      flushOnUnmount
      flushOnPageHide
      flushOnBackground
    >
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 sm:py-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:gap-8">
          <Badge className="px-4 py-1.5" variant="accent">
            @lunarhue/store
          </Badge>

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

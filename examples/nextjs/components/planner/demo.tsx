'use client'

import { PersistStoreProvider } from '@lunarhue/store/plugins/persist'

import { DEMO_STORAGE_KEY, PlannerStore, type PlannerState } from '@/lib/planner-store'

import { CatalogPanel } from './catalog-panel'
import { NotesPanel } from './notes-panel'
import { PersistencePanel } from './persistence-panel'
import { SummaryPanel } from './summary-panel'

// Server Component usage:
//   const data = await fetchPlannerData()  // fetch from DB, cache, etc.
//   return <PlannerDemo initialState={data} />
//
// `initialState` seeds the store before the first render.
// The persist plugin's `hydrate` callback (if configured) will run
// after mount and can override this value if needed.

type PlannerDemoProps = {
  initialState?: PlannerState
}

export function PlannerDemo({ initialState }: PlannerDemoProps) {
  return (
    <PersistStoreProvider
      builder={PlannerStore}
      initialState={initialState}
      persist={{ key: DEMO_STORAGE_KEY }}
      flushOnPageHide
      flushOnUnmount
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <CatalogPanel />
        <div className="space-y-4">
          <SummaryPanel />
        </div>

        <NotesPanel />
        <PersistencePanel />
      </div>
    </PersistStoreProvider>
  )
}

'use client'

import { PersistStoreProvider } from '@lunarhue/store/plugins/persist'

import { DEMO_STORAGE_KEY, PlannerStore } from '@/lib/planner-store'

import { CatalogPanel } from './catalog-panel'
import { NotesPanel } from './notes-panel'
import { PersistencePanel } from './persistence-panel'
import { SummaryPanel } from './summary-panel'

export function PlannerDemo() {
  return (
    <PersistStoreProvider
      builder={PlannerStore}
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

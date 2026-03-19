'use client'

import {
  PersistStoreProvider,
  usePersistentStore,
} from '@lunarhue/store/plugins/persist'

import { getPlannerStateFromClientCookies } from '@/lib/cookies'
import { PlannerStore, type PlannerState } from '@/lib/planner-store'

import { CatalogPanel } from './catalog-panel'
import { NotesPanel } from './notes-panel'
import { PersistencePanel } from './persistence-panel'
import { SummaryPanel } from './summary-panel'
type PlannerDemoProps = {
  initialState?: PlannerState
}

export function PlannerDemo({ initialState }: PlannerDemoProps) {
  return (
    <PersistStoreProvider
      builder={PlannerStore}
      initialState={initialState}
      flushOnPageHide
      flushOnUnmount
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <CatalogPanel />
          <NotesPanel />
        </div>
        <div className="flex w-full shrink-0 flex-col gap-4 overflow-hidden lg:w-80">
          <SummaryPanel />
          <PersistencePanel />
        </div>
      </div>
    </PersistStoreProvider>
  )
}

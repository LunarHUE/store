'use client'

import { PersistStoreProvider } from '@lunarhue/store/plugins/persist'

import { PlannerStore, type PlannerState } from '@/lib/planner-store'

import { CatalogPanel } from './catalog-panel'
import { NotesPanel } from './notes-panel'
import { PersistencePanel } from './persistence-panel'
import { SummaryPanel } from './summary-panel'
import type { StoreDebugEvent } from '@lunarhue/store/core'
import React from 'react'

type PlannerDemoProps = {
  initialState?: PlannerState
}

function useDebugEventBatcher() {
  const [debugEvents, setDebugEvents] = React.useState<
    StoreDebugEvent<PlannerState | undefined>[]
  >([])
  const mountedRef = React.useRef(false)

  // Track if we're currently mounted to avoid state update on unmounted component
  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  React.useEffect(() => {
    if (debugEvents.length > 1000) {
      console.log('Batch of debug events', debugEvents)
      setDebugEvents([])
    }
  }, [debugEvents])

  const sink = React.useCallback(
    (event: StoreDebugEvent<PlannerState | undefined>) => {
      // Only update state if component is mounted
      setTimeout(() => {
        if (mountedRef.current) {
          setDebugEvents((prev) => [...prev, event])
        }
      }, 0)
    },
    [],
  )

  return sink
}

export function PlannerDemo({ initialState }: PlannerDemoProps) {
  const debugSink = useDebugEventBatcher()
  return (
    <PersistStoreProvider
      builder={PlannerStore}
      initialState={initialState}
      flushOnPageHide
      flushOnUnmount
      debug={{
        level: 'verbose',
        sink: debugSink,
        console: false,
      }}
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

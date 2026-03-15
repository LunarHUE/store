'use client'

import { useActions } from '@lunarhue/store/plugins/actions'
import { usePersistentStore } from '@lunarhue/store/plugins/persist'
import { useStore } from '@lunarhue/store/react'

import { PlannerStore } from '@/lib/planner-store'

export function usePlannerActions() {
  const store = useStore(PlannerStore)

  return useActions(store)
}

export function usePlannerPersistentStore() {
  return usePersistentStore(PlannerStore)
}

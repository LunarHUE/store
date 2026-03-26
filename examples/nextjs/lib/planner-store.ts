import { createStore } from '@lunarhue/store/core'
import { actions, createAction } from '@lunarhue/store/plugins/actions'
import { persist } from '@lunarhue/store/plugins/persist'

import { type ProductCategory } from './catalog'
import { setPlannerStateToClientCookies } from './cookies'

type SelectionState = Record<string, number>

export type PlannerState = {
    activeCategory: ProductCategory | 'all'
    guestCount: number
    notes: string
    search: string
    selections: SelectionState
}

function updateQuantity(
    selections: SelectionState,
    productId: string,
    nextQuantity: number
) {
    if (nextQuantity <= 0) {
        const nextSelections = { ...selections }
        delete nextSelections[productId]
        return nextSelections
    }

    return {
        ...selections,
        [productId]: nextQuantity,
    }
}

const plannerActions = {
    clearFilters: createAction<PlannerState, []>(({ setState }) => {
        setState((prev) =>
            prev.activeCategory === 'all' && prev.search.length === 0
                ? prev
                : {
                      ...prev,
                      activeCategory: 'all',
                      search: '',
                  }
        )
    }),
    clearPlan: createAction<PlannerState, []>(({ setState }) => {
        setState((prev) => {
            const hasSelections =
                Object.values(prev.selections).reduce(
                    (total, quantity) => total + quantity,
                    0
                ) > 0
            const hasNotes = prev.notes.trim().length > 0

            if (!hasSelections && !hasNotes) {
                return prev
            }

            return {
                ...prev,
                notes: '',
                selections: {},
            }
        })
    }),
    decrementGuests: createAction<PlannerState, []>(({ setState }) => {
        setState((prev) => ({
            ...prev,
            guestCount: Math.max(1, prev.guestCount - 1),
        }))
    }),
    incrementGuests: createAction<PlannerState, []>(({ setState }) => {
        setState((prev) => ({
            ...prev,
            guestCount: prev.guestCount + 1,
        }))
    }),
    removeItem: createAction<PlannerState, [productId: string]>(
        ({ setState }, productId) => {
            setState((prev) => ({
                ...prev,
                selections: updateQuantity(
                    prev.selections,
                    productId,
                    (prev.selections[productId] ?? 0) - 1
                ),
            }))
        }
    ),
    loadSamplePlan: createAction<PlannerState, [plan: PlannerState]>(
        ({ setState }, plan) => {
            setState(() => plan)
        }
    ),
    addItem: createAction<PlannerState, [productId: string]>(
        ({ setState }, productId) => {
            setState((prev) => ({
                ...prev,
                selections: updateQuantity(
                    prev.selections,
                    productId,
                    (prev.selections[productId] ?? 0) + 1
                ),
            }))
        }
    ),
    setCategory: createAction<
        PlannerState,
        [category: PlannerState['activeCategory']]
    >(({ setState }, category) => {
        setState((prev) =>
            prev.activeCategory === category
                ? prev
                : {
                      ...prev,
                      activeCategory: category,
                  }
        )
    }),
    setNotes: createAction<PlannerState, [notes: string]>(
        ({ setState }, notes) => {
            setState((prev) =>
                prev.notes === notes
                    ? prev
                    : {
                          ...prev,
                          notes,
                      }
            )
        }
    ),
    setSearch: createAction<PlannerState, [search: string]>(
        ({ setState }, search) => {
            setState((prev) =>
                prev.search === search
                    ? prev
                    : {
                          ...prev,
                          search,
                      }
            )
        }
    ),
}

export const PlannerStore = createStore<PlannerState>()
    .extend(
        actions(() => ({
            ...plannerActions,
        }))
    )
    .extend(
        persist({
            delay: 250,
            flushOnDispose: true,
            async onPersist({ nextState }) {
                setPlannerStateToClientCookies(nextState)
            },
            shouldQueuePersist: (previousState, nextState) => {
                return previousState?.notes !== nextState.notes
            },
        })
    )

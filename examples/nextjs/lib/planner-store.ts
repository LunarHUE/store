import { createStore } from '@lunarhue/store/core'
import { actions, createAction } from '@lunarhue/store/plugins/actions'
import { persist } from '@lunarhue/store/plugins/persist'

import { CATALOG_BY_ID, type ProductCategory } from './catalog'

export const DEMO_STORAGE_KEY = 'lunarhue.store.nextjs.example'

type SelectionState = Record<string, number>

type PlannerState = {
  activeCategory: ProductCategory | 'all'
  guestCount: number
  notes: string
  search: string
  selections: SelectionState
}

const SAMPLE_SELECTIONS: SelectionState = {
  'ceramic-cup-set': 2,
  'citrus-loaf': 1,
  'jasmine-tea': 1,
  'morning-roast': 2,
}

const INITIAL_STATE: PlannerState = {
  activeCategory: 'all',
  guestCount: 18,
  notes: 'Keep the setup quick to reset between team sessions.',
  search: '',
  selections: SAMPLE_SELECTIONS,
}

const setSearch = createAction<PlannerState, [search: string]>(
  ({ setState }, search) => {
    setState((prev) =>
      prev.search === search
        ? prev
        : {
            ...prev,
            search,
          },
    )
  },
)

const setCategory = createAction<
  PlannerState,
  [category: PlannerState['activeCategory']]
>(({ setState }, category) => {
  setState((prev) =>
    prev.activeCategory === category
      ? prev
      : {
          ...prev,
          activeCategory: category,
        },
  )
})

const setNotes = createAction<PlannerState, [notes: string]>(
  ({ setState }, notes) => {
    setState((prev) =>
      prev.notes === notes
        ? prev
        : {
            ...prev,
            notes,
          },
    )
  },
)

function updateQuantity(
  selections: SelectionState,
  productId: string,
  nextQuantity: number,
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

function getSelectedProductIds(selections: SelectionState) {
  return Object.keys(selections)
    .filter((productId) => (selections[productId] ?? 0) > 0)
    .sort()
}

function getTotalUnits(selections: SelectionState) {
  return Object.values(selections).reduce(
    (total, quantity) => total + quantity,
    0,
  )
}

function getEstimatedTotal(selections: SelectionState) {
  return getSelectedProductIds(selections).reduce((total, productId) => {
    const product = CATALOG_BY_ID[productId]

    if (!product) {
      return total
    }

    return total + product.price * (selections[productId] ?? 0)
  }, 0)
}

function getDistinctSelections(selections: SelectionState) {
  return getSelectedProductIds(selections).length
}

export const PlannerStore = createStore<PlannerState>(INITIAL_STATE)
  .extend(
    actions(({ setState }) => ({
      clearFilters() {
        setState((prev) =>
          prev.activeCategory === 'all' && prev.search.length === 0
            ? prev
            : {
                ...prev,
                activeCategory: 'all',
                search: '',
              },
        )
      },
      clearPlan() {
        setState((prev) => {
          const hasSelections = getTotalUnits(prev.selections) > 0
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
      },
      decrementGuests() {
        setState((prev) => ({
          ...prev,
          guestCount: Math.max(1, prev.guestCount - 1),
        }))
      },
      incrementGuests() {
        setState((prev) => ({
          ...prev,
          guestCount: prev.guestCount + 1,
        }))
      },
      loadSamplePlan() {
        setState(() => INITIAL_STATE)
      },
      removeItem(productId: string) {
        setState((prev) => ({
          ...prev,
          selections: updateQuantity(
            prev.selections,
            productId,
            (prev.selections[productId] ?? 0) - 1,
          ),
        }))
      },
      addItem(productId: string) {
        setState((prev) => ({
          ...prev,
          selections: updateQuantity(
            prev.selections,
            productId,
            (prev.selections[productId] ?? 0) + 1,
          ),
        }))
      },
      setCategory,
      setNotes,
      setSearch,
    })),
  )
  .extend(
    persist({
      delay: 250,
      flushOnDispose: true,
      async hydrate({ key, store }) {
        const rawValue = window.localStorage.getItem(key)

        if (!rawValue) {
          await store.hydrate(INITIAL_STATE)
          return
        }

        try {
          await store.hydrate(JSON.parse(rawValue) as PlannerState)
        } catch {
          await store.hydrate(INITIAL_STATE)
        }
      },
      async onPersist({ key, nextState }) {
        window.localStorage.setItem(key, JSON.stringify(nextState))
      },
    }),
  )

export const compareStringArrays = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index])

export const selectActiveCategory = (state: PlannerState) =>
  state.activeCategory
export const selectEstimatedTotal = (state: PlannerState) =>
  getEstimatedTotal(state.selections)
export const selectGuestCount = (state: PlannerState) => state.guestCount
export const selectHasFilters = (state: PlannerState) =>
  state.activeCategory !== 'all' || state.search.trim().length > 0
export const selectNotes = (state: PlannerState) => state.notes
export const selectNotesLength = (state: PlannerState) =>
  state.notes.trim().length
export const selectSearch = (state: PlannerState) => state.search
export const selectSelectedProductIds = (state: PlannerState) =>
  getSelectedProductIds(state.selections)
export const selectTotalUnits = (state: PlannerState) =>
  getTotalUnits(state.selections)
export const selectDistinctSelections = (state: PlannerState) =>
  getDistinctSelections(state.selections)
export const selectCanClearPlan = (state: PlannerState) =>
  getTotalUnits(state.selections) > 0 || state.notes.trim().length > 0
export const selectCanDecreaseGuests = (state: PlannerState) =>
  state.guestCount > 1
export const selectCoverageNote = (state: PlannerState) => {
  const distinctSelections = getDistinctSelections(state.selections)
  const target = Math.max(2, Math.ceil(state.guestCount / 8))

  if (distinctSelections === 0) {
    return 'Start with a coffee or tea service, then layer in pastries or supplies.'
  }

  if (distinctSelections < target) {
    return `Add ${target - distinctSelections} more service type${target - distinctSelections === 1 ? '' : 's'} for smoother coverage.`
  }

  return 'Coverage looks balanced for a short meeting or client session.'
}

export function selectCategoryIsActive(
  category: PlannerState['activeCategory'],
) {
  return (state: PlannerState) => state.activeCategory === category
}

export function selectCanRemoveItem(productId: string) {
  return (state: PlannerState) => (state.selections[productId] ?? 0) > 0
}

export function selectLineTotal(productId: string) {
  return (state: PlannerState) =>
    (CATALOG_BY_ID[productId]?.price ?? 0) * (state.selections[productId] ?? 0)
}

export function selectQuantityFor(productId: string) {
  return (state: PlannerState) => state.selections[productId] ?? 0
}

import { createStore } from '@lunarhue/store/core'
import { actions, createAction } from '@lunarhue/store/plugins/actions'
import { persist } from '@lunarhue/store/plugins/persist'
export type DemoState = {
  count: number
  draft: string
  items: string[]
}

export const STORAGE_KEY = 'lunarhue.store.react-basic'

export const DEMO_INITIAL_STATE: DemoState = {
  count: 0,
  draft: '',
  items: [],
}

export function readDemoStateFromStorage(): DemoState {
  if (typeof window === 'undefined') {
    return DEMO_INITIAL_STATE
  }

  const serialized = window.localStorage.getItem(STORAGE_KEY)

  if (!serialized) {
    return DEMO_INITIAL_STATE
  }

  try {
    return JSON.parse(serialized) as DemoState
  } catch {
    return DEMO_INITIAL_STATE
  }
}

const increment = createAction<DemoState>(({ setState }) => {
  setState((prev) => ({
    ...prev,
    count: prev.count + 1,
  }))
})

const setDraft = createAction<DemoState, [draft: string]>(
  ({ setState }, draft) => {
    setState((prev) =>
      prev.draft === draft
        ? prev
        : {
            ...prev,
            draft,
          },
    )
  },
)

const addItem = createAction<DemoState>(({ setState }) => {
  setState((prev) => {
    const trimmedLabel = prev.draft.trim()

    if (!trimmedLabel) {
      return prev
    }

    return {
      ...prev,
      draft: '',
      items: [...prev.items, trimmedLabel],
    }
  })
})

const removeItem = createAction<DemoState, [index: number]>(
  ({ setState }, index) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((_, currentIndex) => currentIndex !== index),
    }))
  },
)
export const demoStoreBuilder = createStore<DemoState>()
  .extend(
    actions(() => ({
      increment,
      setDraft,
      addItem,
      removeItem,
    })),
  )
  .extend(
    persist({
      flushOnDispose: true,
      delay: 400,
      async onPersist({ nextState }) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
      },
    }),
  )

import { createPersistMetaStore } from './meta-store'

import type {
  PersistController,
  PersistMeta,
  PersistPluginOptions,
  PersistRuntimeOptions,
  PersistedStore,
} from './types'
import type { Store } from '../../core'

const DEFAULT_META: PersistMeta = {
  isHydrated: false,
  pending: false,
  persisting: false,
  lastPersistedAt: null,
  error: null,
}

function getInitialMeta<TState>(options?: PersistPluginOptions<TState>): PersistMeta {
  return {
    ...DEFAULT_META,
    isHydrated: options?.hydratedOnCreate ?? false,
  }
}

export function createPersistController<TState>(
  store: Store<TState>,
  pluginOptions?: PersistPluginOptions<TState>,
): PersistController<TState> {
  const metaStore = createPersistMetaStore(getInitialMeta(pluginOptions))
  let runtimeOptions: PersistRuntimeOptions<TState> | null = null
  let subscription: { unsubscribe(): void } | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let queuedTransition:
    | {
        previousState: TState
        nextState: TState
      }
    | null = null
  let lastObservedState = store.get()
  let currentKey: string | null = null
  let currentFlushPromise: Promise<void> | null = null
  let hydrating = false
  let isConnected = false
  let hasRequestedHydrationForKey = false

  const clearTimer = () => {
    if (!timer) {
      return
    }

    clearTimeout(timer)
    timer = null
  }

  const updateMeta = (updater: (prev: PersistMeta) => PersistMeta) => {
    metaStore.setState(updater)
  }

  const resetForKey = (key: string) => {
    currentKey = key
    queuedTransition = null
    clearTimer()
    hasRequestedHydrationForKey = false
    lastObservedState = store.get()
    metaStore.setState(() => getInitialMeta(pluginOptions))
  }

  const ensureSubscription = () => {
    if (subscription) {
      return
    }

    subscription = store.subscribe((nextState) => {
      const previousState = lastObservedState
      lastObservedState = nextState

      if (
        hydrating ||
        !isConnected ||
        !runtimeOptions?.ready ||
        Object.is(previousState, nextState)
      ) {
        return
      }

      queuedTransition = queuedTransition
        ? {
            previousState: queuedTransition.previousState,
            nextState,
          }
        : {
            previousState,
            nextState,
          }

      updateMeta((prev) => ({
        ...prev,
        pending: true,
        error: null,
      }))

      clearTimer()
      timer = setTimeout(() => {
        void flush()
      }, runtimeOptions.delay ?? 0)
    })
  }

  const maybeHydrate = async (
    runtimeStore: PersistedStore<TState>,
    options: PersistRuntimeOptions<TState>,
  ) => {
    if (!options.ready || hasRequestedHydrationForKey) {
      return
    }

    hasRequestedHydrationForKey = true

    if (!options.hydrate) {
      updateMeta((prev) => ({
        ...prev,
        isHydrated: true,
        error: null,
      }))
      return
    }

    try {
      await options.hydrate(runtimeStore)
    } catch (error) {
      updateMeta((prev) => ({
        ...prev,
        error,
      }))
      throw error
    }
  }

  const flush = (): Promise<void> => {
    if (currentFlushPromise) {
      return currentFlushPromise
    }

    const runFlush = async () => {
      clearTimer()

      while (queuedTransition) {
        if (!runtimeOptions?.ready) {
          return
        }

        const transition = queuedTransition
        queuedTransition = null

        updateMeta((prev) => ({
          ...prev,
          pending: false,
          persisting: true,
          error: null,
        }))

        try {
          const nextState = pluginOptions?.serializeState
            ? pluginOptions.serializeState(transition.nextState)
            : transition.nextState

          await runtimeOptions.onPersist({
            key: runtimeOptions.key,
            previousState: transition.previousState,
            nextState,
          })

          updateMeta((prev) => ({
            ...prev,
            persisting: false,
            lastPersistedAt: Date.now(),
            error: null,
          }))
        } catch (error) {
          queuedTransition = transition
          updateMeta((prev) => ({
            ...prev,
            pending: true,
            persisting: false,
            error,
          }))
          throw error
        }
      }
    }

    currentFlushPromise = runFlush().finally(() => {
      currentFlushPromise = null
    })

    return currentFlushPromise
  }

  return {
    metaStore,
    connect(runtimeStore, options) {
      runtimeOptions = {
        ...options,
        delay: options.delay ?? 0,
        ready: options.ready ?? true,
      }

      if (currentKey !== runtimeOptions.key) {
        resetForKey(runtimeOptions.key)
      }

      isConnected = true
      ensureSubscription()
      void maybeHydrate(runtimeStore, runtimeOptions).catch(() => {})

      return () => {
        if (runtimeOptions?.key !== options.key) {
          return
        }

        isConnected = false
        clearTimer()
        updateMeta((prev) => ({
          ...prev,
          persisting: false,
        }))
      }
    },
    flush() {
      return flush()
    },
    async hydrate(nextState) {
      clearTimer()
      queuedTransition = null
      hydrating = true

      try {
        store.setState(() => nextState)
        lastObservedState = nextState
        updateMeta((prev) => ({
          ...prev,
          isHydrated: true,
          pending: false,
          error: null,
        }))
      } finally {
        hydrating = false
      }
    },
  }
}

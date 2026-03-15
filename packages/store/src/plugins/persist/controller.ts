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

let nextGeneratedPersistKeyId = 0

function getInitialMeta<TState>(
  options?: PersistPluginOptions<TState>,
): PersistMeta {
  return {
    ...DEFAULT_META,
    isHydrated: options?.hydratedOnCreate ?? false,
  }
}

type RuntimeOptions<TState> = Required<
  Omit<PersistRuntimeOptions<TState>, 'hydrate'>
> & {
  hydrate?: PersistRuntimeOptions<TState>['hydrate']
}

export function createPersistController<TState>(
  store: Store<TState>,
  pluginOptions?: PersistPluginOptions<TState>,
): PersistController<TState> {
  const metaStore = createPersistMetaStore(getInitialMeta(pluginOptions))
  const fallbackKey = `persist:${++nextGeneratedPersistKeyId}`
  let runtimeOptions: RuntimeOptions<TState> | null = null
  let subscription: { unsubscribe(): void } | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let queuedTransition: {
    previousState: TState
    nextState: TState
  } | null = null
  let lastObservedState = store.get()
  let currentKey: string | null = null
  let currentFlushPromise: Promise<void> | null = null
  let hydrating = false
  let isConnected = false
  let hasRequestedHydrationForKey = false

  const resolveKey = (key?: string) => key ?? fallbackKey

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

  const resolveRuntimeOptions = (
    options: PersistRuntimeOptions<TState>,
  ): RuntimeOptions<TState> => {
    const onPersist = options.onPersist ?? pluginOptions?.onPersist

    if (!onPersist) {
      throw new Error(
        'Persist runtime requires onPersist to be provided either in persist(...) or at runtime.',
      )
    }

    return {
      key: resolveKey(options.key),
      enabled: options.enabled ?? pluginOptions?.enabled ?? true,
      delay: options.delay ?? pluginOptions?.delay ?? 0,
      hydrate: options.hydrate ?? pluginOptions?.hydrate,
      onPersist,
    }
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
        !runtimeOptions?.enabled ||
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
      }, runtimeOptions.delay)
    })
  }

  const maybeHydrate = async (
    runtimeStore: PersistedStore<TState>,
    options: RuntimeOptions<TState>,
  ) => {
    if (!options.enabled || hasRequestedHydrationForKey) {
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
      await options.hydrate({
        key: options.key,
        store: runtimeStore,
      })
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
        if (!runtimeOptions?.enabled) {
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
      const resolvedOptions = resolveRuntimeOptions(options)
      runtimeOptions = resolvedOptions

      if (currentKey !== resolvedOptions.key) {
        resetForKey(resolvedOptions.key)
      }

      isConnected = true
      ensureSubscription()
      void maybeHydrate(runtimeStore, resolvedOptions).catch(() => {})

      return () => {
        if (currentKey !== resolvedOptions.key) {
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

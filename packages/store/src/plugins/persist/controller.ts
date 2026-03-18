import type {
  PersistController,
  PersistMeta,
  PersistPluginOptions,
  PersistRuntimeOptions,
  PersistedStore,
} from './types'
import type { Store } from '../../core'
import { createStoreInstance } from '../../core/store-instance'

const DEFAULT_META: PersistMeta = {
  pending: false,
  persisting: false,
  lastPersistedAt: null,
  error: null,
}

let nextGeneratedPersistKeyId = 0

type RuntimeOptions<TState> = Required<PersistRuntimeOptions<TState>> & {
  key: string
}

export function createPersistController<TState>(
  store: Store<TState>,
  pluginOptions?: PersistPluginOptions<TState>,
): PersistController<TState> {
  const meta = createStoreInstance({
    initialState: { ...DEFAULT_META },
    readyOnCreate: true,
  }).store
  const fallbackKey = `persist:${++nextGeneratedPersistKeyId}`
  let runtimeOptions: RuntimeOptions<TState> | null = null
  let subscription: { unsubscribe(): void } | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let queuedTransition: {
    previousState: TState
    nextState: TState
  } | null = null
  let lastObservedState: TState | undefined =
    store.lifecycle.meta.get().status === 'ready' ? store.get() : undefined
  let currentKey: string | null = null
  let currentFlushPromise: Promise<void> | null = null
  let isConnected = false

  const resolveKey = (key?: string) => key ?? fallbackKey

  const clearTimer = () => {
    if (!timer) {
      return
    }

    clearTimeout(timer)
    timer = null
  }

  const updateMeta = (updater: (prev: PersistMeta) => PersistMeta) => {
    meta.setState(updater)
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
      enabled: options.enabled ?? true,
      delay: options.delay ?? pluginOptions?.delay ?? 0,
      onPersist,
    }
  }

  const resetForKey = (key: string) => {
    currentKey = key
    queuedTransition = null
    clearTimer()
    lastObservedState =
      store.lifecycle.meta.get().status === 'ready' ? store.get() : undefined
    meta.setState(() => ({
      ...DEFAULT_META,
    }))
  }

  const ensureSubscription = () => {
    if (subscription) {
      return
    }

    subscription = store.subscribe((nextState) => {
      const previousState = lastObservedState
      lastObservedState = nextState

      if (!isConnected || !runtimeOptions?.enabled) {
        return
      }

      if (previousState === undefined || Object.is(previousState, nextState)) {
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
            key: resolveKey(runtimeOptions.key),
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
    meta,
    connect(runtimeStore, options) {
      const resolvedOptions = resolveRuntimeOptions(options)
      runtimeOptions = resolvedOptions

      if (currentKey !== resolvedOptions.key) {
        resetForKey(resolvedOptions.key)
      }

      isConnected = true
      ensureSubscription()

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
  }
}

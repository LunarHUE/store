import type {
  PersistController,
  PersistMeta,
  PersistPluginOptions,
  PersistRuntimeOptions,
} from './types'
import type { Store } from '../../core'
import { createStoreInstance } from '../../core/store-instance'

const DEFAULT_META: PersistMeta = {
  pending: false,
  persisting: false,
  lastPersistedAt: null,
  error: null,
}

type RuntimeOptions<TState> = Required<PersistRuntimeOptions<TState>>

type Transition<TState> = {
  previousState: TState
  nextState: TState
}

type ControllerState<TState> = {
  connected: boolean
  runtimeOptions: RuntimeOptions<TState> | null
  subscription: { unsubscribe(): void } | null
  timer: ReturnType<typeof setTimeout> | null
  pendingTransition: Transition<TState> | null
  lastObservedState: TState | undefined
  flushPromise: Promise<void> | null
}

export function createPersistController<TState>(
  store: Store<TState>,
  pluginOptions?: PersistPluginOptions<TState>,
): PersistController<TState> {
  const meta = createStoreInstance({
    initialState: { ...DEFAULT_META },
    readyOnCreate: true,
  }).store

  const state: ControllerState<TState> = {
    connected: false,
    runtimeOptions: null,
    subscription: null,
    timer: null,
    pendingTransition: null,
    lastObservedState:
      store.lifecycle.meta.get().status === 'ready' ? store.get() : undefined,
    flushPromise: null,
  }

  const clearTimer = () => {
    if (state.timer === null) {
      return
    }

    clearTimeout(state.timer)
    state.timer = null
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
      enabled: options.enabled ?? true,
      delay: options.delay ?? pluginOptions?.delay ?? 0,
      onPersist,
    }
  }

  const resetState = () => {
    clearTimer()
    state.pendingTransition = null
    state.lastObservedState =
      store.lifecycle.meta.get().status === 'ready' ? store.get() : undefined

    meta.setState(() => ({
      ...DEFAULT_META,
    }))
  }

  const enqueueTransition = (previousState: TState, nextState: TState) => {
    state.pendingTransition = state.pendingTransition
      ? {
          previousState: state.pendingTransition.previousState,
          nextState,
        }
      : {
          previousState,
          nextState,
        }

    meta.setState((prev) => ({
      ...prev,
      pending: true,
      error: null,
    }))
  }

  const canPersist = () => {
    return state.connected && state.runtimeOptions?.enabled
  }

  const hasEnabledRuntime = () => {
    return state.runtimeOptions?.enabled
  }

  const scheduleFlush = () => {
    clearTimer()

    const delay = state.runtimeOptions?.delay ?? 0
    state.timer = setTimeout(() => {
      void flush()
    }, delay)
  }

  const persistTransition = async (transition: Transition<TState>) => {
    const runtimeOptions = state.runtimeOptions

    if (!runtimeOptions?.enabled) {
      return
    }

    meta.setState((prev) => ({
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
        previousState: transition.previousState,
        nextState,
      })

      meta.setState((prev) => ({
        ...prev,
        persisting: false,
        lastPersistedAt: Date.now(),
        error: null,
      }))
    } catch (error) {
      state.pendingTransition = transition

      meta.setState((prev) => ({
        ...prev,
        pending: true,
        persisting: false,
        error,
      }))

      throw error
    }
  }

  const drainQueue = async () => {
    clearTimer()

    while (state.pendingTransition) {
      if (!hasEnabledRuntime()) {
        return
      }

      const transition = state.pendingTransition
      state.pendingTransition = null

      await persistTransition(transition)
    }
  }

  const ensureSubscription = () => {
    if (state.subscription) {
      return
    }

    state.subscription = store.subscribe((nextState) => {
      const previousState = state.lastObservedState
      state.lastObservedState = nextState

      if (!canPersist()) {
        return
      }

      if (previousState === undefined || Object.is(previousState, nextState)) {
        return
      }

      enqueueTransition(previousState, nextState)
      scheduleFlush()
    })
  }

  const flush = (): Promise<void> => {
    if (state.flushPromise) {
      return state.flushPromise
    }

    state.flushPromise = drainQueue().finally(() => {
      state.flushPromise = null
    })

    return state.flushPromise
  }

  return {
    meta,
    connect(_runtimeStore, options) {
      state.runtimeOptions = resolveRuntimeOptions(options)

      resetState()
      state.connected = true
      ensureSubscription()

      return () => {
        state.connected = false
        clearTimer()

        meta.setState((prev) => ({
          ...prev,
          persisting: false,
        }))
      }
    },
    flush,
  }
}

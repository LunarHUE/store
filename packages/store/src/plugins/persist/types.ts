import type { Store, StorePlugin } from '../../core'

export const persistControllerKey = Symbol('lunarhue.store.persist.controller')

/**
 * Runtime metadata exposed on `store.persist.meta`.
 */
export type PersistMeta = {
  /**
   * `true` while a state transition is queued for persistence.
   */
  pending: boolean
  /**
   * `true` while `onPersist` is actively running.
   */
  persisting: boolean
  /**
   * Epoch timestamp in milliseconds of the last successful persist.
   */
  lastPersistedAt: number | null
  /**
   * Last persistence error captured by the controller.
   */
  error: unknown | null
}

/**
 * State transition passed to `onPersist`.
 */
export type PersistPersistArgs<TState> = {
  /**
   * Previously observed runtime store state.
   */
  previousState: TState
  /**
   * Next state being persisted, after optional serialization.
   */
  nextState: TState
}

/**
 * Runtime persistence configuration passed through `PersistStoreProvider`.
 */
export type PersistRuntimeOptions<TState> = {
  /**
   * Enables or disables persistence for the active runtime connection.
   *
   * Defaults to `true`.
   */
  enabled?: boolean
  /**
   * Debounce delay in milliseconds before queued state changes are flushed.
   */
  delay?: number
  /**
   * Persists the latest observed state transition.
   *
   * This must be provided here unless declaration-time plugin options already
   * supply it.
   */
  onPersist?: (args: PersistPersistArgs<TState>) => Promise<void>
}

/**
 * Declaration-time defaults for the persist plugin.
 *
 * Runtime options may override `delay` and `onPersist`, while `enabled`
 * remains a runtime-only control.
 */
export type PersistPluginOptions<TState> = {
  /**
   * Flushes queued persistence work when the runtime store is disposed.
   */
  flushOnDispose?: boolean
  /**
   * Transforms state before `onPersist` receives it.
   */
  serializeState?: (state: TState) => TState
} & Omit<PersistRuntimeOptions<TState>, 'enabled'>

export type PersistRuntimeSurface = {
  flush(): Promise<void>
  meta: Store<PersistMeta>
}

export type PersistStoreSurface = {
  persist: PersistRuntimeSurface
}

export type PersistController<TState> = {
  meta: Store<PersistMeta>
  connect(
    store: PersistedStore<TState>,
    options: PersistRuntimeOptions<TState>,
  ): () => void
  flush(): Promise<void>
}

export type InternalPersistStoreSurface<TState> = PersistStoreSurface & {
  persist: PersistRuntimeSurface & {
    [persistControllerKey]: PersistController<TState>
  }
}

/**
 * Runtime store type produced by a builder extended with {@link persist}.
 *
 * This adds `store.persist.flush()` and `store.persist.meta` to the runtime
 * store surface.
 */
export type PersistedStore<TState, TPlugins = {}> = Store<
  TState,
  TPlugins & PersistStoreSurface
>

export type InternalPersistedStore<TState, TPlugins = {}> = Store<
  TState,
  TPlugins & InternalPersistStoreSurface<TState>
>

export type PersistPlugin<TState> = StorePlugin<
  TState,
  any,
  PersistStoreSurface
>

import type { Readable, Store as BaseStore } from '@tanstack/store'

/**
 * Cleanup registered by a plugin to run when a runtime store is disposed.
 */
export type StoreCleanup = () => void | Promise<void>

/**
 * Minimal read-only store surface exposed for lifecycle and metadata stores.
 */
export type ReadableStore<TState> = Pick<
  Readable<TState>,
  'get' | 'subscribe'
> & {
  /**
   * Current snapshot.
   */
  readonly state: TState
}

/**
 * Initialization state for a runtime store.
 */
export type StoreLifecycleStatus =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'error'

/**
 * Current initialization metadata for a runtime store.
 */
export type StoreLifecycleMeta = {
  /**
   * Current readiness state for the runtime store.
   */
  status: StoreLifecycleStatus
  /**
   * Initialization error captured while resolving initial state.
   */
  error: unknown | null
}

/**
 * Loads initial state for a runtime store that was created without a declared
 * default value.
 */
export type StoreInitialStateLoader<TState, TPlugins = {}> = (args: {
  store: Store<TState, TPlugins>
}) => Promise<TState> | TState

export type StoreLifecycleSurface<TState> = {
  /**
   * Initializes a runtime store that was created without a ready state.
   *
   * This may only be called once per runtime store.
   */
  setInitialState(nextState: TState): Promise<void>
  lifecycle: {
    /**
     * Read-only lifecycle metadata for the runtime store.
     */
    meta: ReadableStore<StoreLifecycleMeta>
  }
}

/**
 * Runtime Lunarhue store surface.
 *
 * This extends the TanStack store instance with lifecycle metadata,
 * one-time initialization for uninitialized stores, disposal, and any plugin
 * surfaces attached through the builder.
 */
export type Store<TState, TPlugins = {}> = BaseStore<TState> &
  StoreLifecycleSurface<TState> & {
    dispose(): Promise<void>
  } & TPlugins

/**
 * Infers the state shape from a runtime store type.
 */
export type StoreState<TStore extends Store<any, any>> = TStore extends {
  get: () => infer TState
}
  ? TState
  : never

/**
 * Context passed to a store plugin while a runtime store is being created.
 */
export type StorePluginContext<TState, TPlugins> = {
  /**
   * Runtime store instance being extended.
   */
  store: Store<TState, TPlugins>
  /**
   * Registers cleanup work to run when the runtime store is disposed.
   */
  onDispose(cleanup: StoreCleanup): void
}

/**
 * Additive plugin that extends the runtime store surface without storing
 * plugin metadata inside application state.
 */
export type StorePlugin<TState, TPlugins, TNextPlugins> = (
  context: StorePluginContext<TState, TPlugins>,
) => TNextPlugins

/**
 * Immutable builder used to declare plugins once and create fresh runtime
 * stores on demand.
 */
export type StoreBuilder<TState, TPlugins = {}> = {
  /**
   * Creates a fresh runtime store instance.
   *
   * Passing `initialState` makes the runtime store ready immediately even when
   * the builder was declared without a default value.
   */
  create(initialState?: TState): Store<TState, TPlugins>
  /**
   * Returns a new builder with the plugin surface merged into the runtime
   * store type.
   */
  extend<TNextPlugins>(
    plugin: StorePlugin<TState, TPlugins, TNextPlugins>,
  ): StoreBuilder<TState, TPlugins & TNextPlugins>
}

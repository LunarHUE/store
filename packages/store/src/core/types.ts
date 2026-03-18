import type { Readable, Store as BaseStore } from '@tanstack/store'

export type StoreCleanup = () => void | Promise<void>

export type ReadableStore<TState> = Pick<
  Readable<TState>,
  'get' | 'subscribe'
> & {
  readonly state: TState
}

export type StoreLifecycleStatus =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'error'

export type StoreLifecycleMeta = {
  status: StoreLifecycleStatus
  error: unknown | null
}

export type StoreLifecycleSurface<TState> = {
  initialize(nextState: TState): Promise<void>
  lifecycle: {
    meta: ReadableStore<StoreLifecycleMeta>
  }
}

export type Store<TState, TPlugins = {}> = BaseStore<TState> &
  StoreLifecycleSurface<TState> & {
    dispose(): Promise<void>
  } & TPlugins

export type StoreState<TStore extends Store<any, any>> = TStore extends {
  get: () => infer TState
}
  ? TState
  : never

export type StorePluginContext<TState, TPlugins> = {
  store: Store<TState, TPlugins>
  onDispose(cleanup: StoreCleanup): void
}

export type StorePlugin<TState, TPlugins, TNextPlugins> = (
  context: StorePluginContext<TState, TPlugins>,
) => TNextPlugins

export type StoreBuilder<TState, TPlugins = {}> = {
  create(initialState?: TState): Store<TState, TPlugins>
  extend<TNextPlugins>(
    plugin: StorePlugin<TState, TPlugins, TNextPlugins>,
  ): StoreBuilder<TState, TPlugins & TNextPlugins>
}

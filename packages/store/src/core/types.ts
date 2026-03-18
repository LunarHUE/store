import type { Store as BaseStore } from '@tanstack/store'

export type StoreCleanup = () => void | Promise<void>

export type Store<TState, TPlugins = {}> = BaseStore<TState> & {
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

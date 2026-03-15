import type { Store as BaseStore } from '@tanstack/store'

export type StoreBrand<TKey extends symbol> = {
  readonly [K in TKey]: true
}

export type StoreSubscription = {
  unsubscribe(): void
}

export type StoreCleanup = () => void | Promise<void>

export type TanStackStore<TState> = BaseStore<TState>
export type Store<TState, TPlugins = {}> = TanStackStore<TState> & {
  dispose(): Promise<void>
} & TPlugins

export type AnyStore = Store<any, any>
export type StorePlugins<TStore extends AnyStore> = TStore extends {
  [K in keyof TStore]: TStore[K] extends (...args: any[]) => any
    ? TStore[K]
    : never
}
  ? TStore
  : never
export type StoreState<TStore extends AnyStore> = TStore extends {
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
  create(): Store<TState, TPlugins>
  extend<TNextPlugins>(
    plugin: StorePlugin<TState, TPlugins, TNextPlugins>,
  ): StoreBuilder<TState, TPlugins & TNextPlugins>
}

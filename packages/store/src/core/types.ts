import type { Store as TanStackStoreBase } from '@tanstack/store'

export type StoreBrand<TKey extends symbol> = {
  readonly [K in TKey]: true
}

export type StoreSubscription = {
  unsubscribe(): void
}

export type StoreCleanup = () => void | Promise<void>

export type TanStackStore<TState> = TanStackStoreBase<TState>

export type Store<TState, TPlugins = {}> = TanStackStore<TState> & {
  dispose(): Promise<void>
} & TPlugins

export type StoreInstance<TState, TPlugins = {}> = Store<TState, TPlugins>

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

export type StoreFactory<TState, TPlugins = {}> = StoreBuilder<TState, TPlugins>

export type StoreDefinition<TState, TPlugins = {}> = StoreBuilder<TState, TPlugins>

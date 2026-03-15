export type SetStateUpdater<TState> = TState | ((prev: TState) => TState)

export type StoreBrand<TKey extends symbol> = {
  readonly [K in TKey]: true
}

export type StoreSubscription = {
  unsubscribe(): void
}

export type StoreCleanup = () => void | Promise<void>

export type StoreInstance<TState, TPlugins = {}> = {
  readonly state: TState
  get(): TState
  setState(updater: SetStateUpdater<TState>): void
  subscribe(listener: (state: TState) => void): StoreSubscription
  dispose(): Promise<void>
} & TPlugins

export type StorePluginContext<TState, TPlugins> = {
  store: StoreInstance<TState, TPlugins>
  getState(): TState
  setState(updater: SetStateUpdater<TState>): void
  subscribe(listener: (state: TState) => void): StoreSubscription
  onDispose(cleanup: StoreCleanup): void
}

export type StorePlugin<TState, TPlugins, TNextPlugins> = (
  context: StorePluginContext<TState, TPlugins>,
) => TNextPlugins

export type StoreDefinition<TState, TPlugins = {}> = {
  create(): StoreInstance<TState, TPlugins>
  extend<TNextPlugins>(
    plugin: StorePlugin<TState, TPlugins, TNextPlugins>,
  ): StoreDefinition<TState, TPlugins & TNextPlugins>
}

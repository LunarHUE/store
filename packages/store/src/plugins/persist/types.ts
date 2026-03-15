import type { Store, StoreBrand, StorePlugin } from '../../core'

export const persistBrand = Symbol('lunarhue.store.persist')
export const persistControllerKey = Symbol('lunarhue.store.persist.controller')

export type PersistBrand = StoreBrand<typeof persistBrand>

export type PersistMeta = {
  isHydrated: boolean
  pending: boolean
  persisting: boolean
  lastPersistedAt: number | null
  error: unknown | null
}

export type PersistPluginOptions<TState> = {
  flushOnDispose?: boolean
  hydratedOnCreate?: boolean
  serializeState?: (state: TState) => TState
}

export type PersistHydrateArgs<TState> = {
  key: string
  store: PersistedStore<TState>
}

export type PersistRuntimePersistArgs<TState> = {
  key: string
  previousState: TState
  nextState: TState
}

export type PersistRuntimeOptions<TState> = {
  key?: string
  enabled?: boolean
  delay?: number
  hydrate?: (args: PersistHydrateArgs<TState>) => Promise<void>
  onPersist: (args: PersistRuntimePersistArgs<TState>) => Promise<void>
}

export type PersistController<TState> = {
  metaStore: Store<PersistMeta>
  connect(
    store: PersistedStore<TState>,
    options: PersistRuntimeOptions<TState>,
  ): () => void
  flush(): Promise<void>
  hydrate(nextState: TState): Promise<void>
}

export type PersistPluginSurface<TState> = PersistBrand & {
  hydrate(nextState: TState): Promise<void>
  persist: {
    flush(): Promise<void>
    hydrate(nextState: TState): Promise<void>
    metaStore: Store<PersistMeta>
    [persistControllerKey]: PersistController<TState>
  }
}

export type PersistedStore<TState, TPlugins = {}> = Store<
  TState,
  TPlugins & PersistPluginSurface<TState>
>

export type PersistPlugin<TState> = StorePlugin<
  TState,
  any,
  PersistPluginSurface<TState>
>

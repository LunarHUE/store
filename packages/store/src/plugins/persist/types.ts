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

export type PersistHydrateHandler<TState> = (
  store: PersistedStore<TState>,
) => Promise<void>

export type PersistPersistHandler<TState> = (args: {
  key: string
  previousState: TState
  nextState: TState
}) => Promise<void>

export type PersistPluginOptions<TState> = {
  flushOnDispose?: boolean
  hydratedOnCreate?: boolean
  serializeState?: (state: TState) => TState
  ready?: boolean
  delay?: number
  hydrate?: PersistHydrateHandler<TState>
  onPersist?: PersistPersistHandler<TState>
}

export type PersistHydrateArgs<TState> = {
  key: string
  ready?: boolean
  delay?: number
  hydrate?: PersistHydrateHandler<TState>
  onPersist?: PersistPersistHandler<TState>
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

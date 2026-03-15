import type { Store, StorePlugin } from '../../core'

export const persistControllerKey = Symbol('lunarhue.store.persist.controller')

export type PersistMeta = {
  isHydrated: boolean
  pending: boolean
  persisting: boolean
  lastPersistedAt: number | null
  error: unknown | null
}

export type PersistHydrateArgs<TState> = {
  key: string
  store: PersistedStore<TState>
}

export type PersistPersistArgs<TState> = {
  key: string
  previousState: TState
  nextState: TState
}

export type PersistRuntimeOptions<TState> = {
  key?: string
  enabled?: boolean
  delay?: number
  hydrate?: (args: PersistHydrateArgs<TState>) => Promise<void>
  onPersist?: (args: PersistPersistArgs<TState>) => Promise<void>
}

export type PersistPluginOptions<TState> = {
  flushOnDispose?: boolean
  hydratedOnCreate?: boolean
  serializeState?: (state: TState) => TState
} & Omit<PersistRuntimeOptions<TState>, 'key'>

export type PersistRuntimeSurface<TState> = {
  flush(): Promise<void>
  hydrate(nextState: TState): Promise<void>
  meta: Store<PersistMeta>
}

export type PersistStoreSurface<TState> = {
  hydrate(nextState: TState): Promise<void>
  persist: PersistRuntimeSurface<TState>
}

export type PersistController<TState> = {
  meta: Store<PersistMeta>
  connect(
    store: PersistedStore<TState>,
    options: PersistRuntimeOptions<TState>,
  ): () => void
  flush(): Promise<void>
  hydrate(nextState: TState): Promise<void>
}

export type InternalPersistStoreSurface<TState> = PersistStoreSurface<TState> & {
  persist: PersistRuntimeSurface<TState> & {
    [persistControllerKey]: PersistController<TState>
  }
}

export type PersistedStore<TState, TPlugins = {}> = Store<
  TState,
  TPlugins & PersistStoreSurface<TState>
>

export type InternalPersistedStore<TState, TPlugins = {}> = Store<
  TState,
  TPlugins & InternalPersistStoreSurface<TState>
>

export type PersistPlugin<TState> = StorePlugin<
  TState,
  any,
  PersistStoreSurface<TState>
>

import type { Store, StorePlugin } from '../../core'

export const persistControllerKey = Symbol('lunarhue.store.persist.controller')

export type PersistMeta = {
  pending: boolean
  persisting: boolean
  lastPersistedAt: number | null
  error: unknown | null
}

export type PersistPersistArgs<TState> = {
  previousState: TState
  nextState: TState
}

export type PersistRuntimeOptions<TState> = {
  enabled?: boolean
  delay?: number
  onPersist?: (args: PersistPersistArgs<TState>) => Promise<void>
}

export type PersistPluginOptions<TState> = {
  flushOnDispose?: boolean
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

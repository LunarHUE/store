import {
  createContext,
  type Context,
  type ReactNode,
  useContext,
  useEffect,
  useEffectEvent,
} from 'react'

import type { StoreBuilder, StoreInitialStateLoader } from '../../core'
import { getStoreBuilder } from '../../core/builder-registry'
import { StoreProvider } from '../../react'

import {
  persistControllerKey,
  type InternalPersistedStore,
  type PersistPersistArgs,
  type PersistStoreSurface,
  type PersistRuntimeOptions,
  type PersistedStore,
} from './types'

/**
 * Value returned by {@link usePersistentStore} and the
 * `PersistStoreProvider` render prop.
 */
export type PersistentStoreResult<TState, TPlugins = {}> = {
  /**
   * Persist-enabled runtime store instance.
   */
  store: PersistedStore<TState, TPlugins>
  /**
   * Flushes any queued persistence work immediately.
   */
  flush(): Promise<void>
}

/**
 * Additional flush triggers supported by {@link PersistStoreProvider}.
 */
export type PersistenceBoundaryOptions = {
  /**
   * Reserved for non-web background lifecycle support.
   *
   * On web this is currently a no-op.
   */
  flushOnBackground?: boolean
  /**
   * Flushes pending persistence work when the browser fires `pagehide`.
   */
  flushOnPageHide?: boolean
  /**
   * Flushes pending persistence work when the provider unmounts.
   */
  flushOnUnmount?: boolean
}
type PersistStoreContext<TState, TPlugins> = Context<
  PersistentStoreResult<TState, TPlugins> | undefined
>

const persistContextMap = new WeakMap<
  StoreBuilder<any, any>,
  PersistStoreContext<any, any>
>()

type PersistStoreProviderChildren<TState, TPlugins> =
  | ReactNode
  | ((args: PersistentStoreResult<TState, TPlugins>) => ReactNode)

type BuilderPersistStoreProviderBaseProps<TState, TPlugins> = {
  builder: StoreBuilder<TState, TPlugins & PersistStoreSurface>
  children?: PersistStoreProviderChildren<TState, TPlugins>
  persist?: PersistRuntimeOptions<TState>
  store?: never
} & PersistenceBoundaryOptions

type BuilderPersistStoreProviderWithInitialStateProps<TState, TPlugins> =
  BuilderPersistStoreProviderBaseProps<TState, TPlugins> & {
    initialState: TState
    loadInitialState?: never
  }

type BuilderPersistStoreProviderWithLoadInitialStateProps<TState, TPlugins> =
  BuilderPersistStoreProviderBaseProps<TState, TPlugins> & {
    initialState?: never
    loadInitialState: StoreInitialStateLoader<
      TState,
      TPlugins & PersistStoreSurface
    >
  }

type BuilderPersistStoreProviderWithDeclaredInitialStateProps<
  TState,
  TPlugins,
> = BuilderPersistStoreProviderBaseProps<TState, TPlugins> & {
  initialState?: never
  loadInitialState?: never
}

type BuilderPersistStoreProviderProps<TState, TPlugins> =
  | BuilderPersistStoreProviderWithDeclaredInitialStateProps<TState, TPlugins>
  | BuilderPersistStoreProviderWithInitialStateProps<TState, TPlugins>
  | BuilderPersistStoreProviderWithLoadInitialStateProps<TState, TPlugins>

type ExternalPersistStoreProviderProps<TState, TPlugins> = {
  builder?: never
  children?: PersistStoreProviderChildren<TState, TPlugins>
  persist?: PersistRuntimeOptions<TState>
  store: PersistedStore<TState, TPlugins>
} & PersistenceBoundaryOptions

/**
 * Props for {@link PersistStoreProvider}.
 *
 * Use either `builder` to let the provider create and own the persisted store,
 * or `store` to provide an already-created persisted store. Runtime `persist`
 * options override declaration-time defaults from {@link persist}. Builder
 * usage follows the same initialization rules as {@link StoreProvider}, with
 * optional flush boundaries layered on top.
 */
export type PersistStoreProviderProps<TState, TPlugins = {}> =
  | BuilderPersistStoreProviderProps<TState, TPlugins>
  | ExternalPersistStoreProviderProps<TState, TPlugins>

function getPersistStoreContext<TState, TPlugins>(
  builder: StoreBuilder<TState, TPlugins & PersistStoreSurface>,
): PersistStoreContext<TState, TPlugins> {
  let context = persistContextMap.get(builder)

  if (!context) {
    context = createContext<
      PersistentStoreResult<TState, TPlugins> | undefined
    >(undefined)
    persistContextMap.set(builder, context)
  }

  return context
}

function usePersistentRuntime<TState, TPlugins = {}>(
  store: InternalPersistedStore<TState, TPlugins>,
  options: PersistRuntimeOptions<TState>,
): PersistentStoreResult<TState, TPlugins> {
  const onPersist = useEffectEvent(async (args: PersistPersistArgs<TState>) => {
    if (!options.onPersist) {
      return
    }

    await options.onPersist(args)
  })

  useEffect(() => {
    return store.persist[persistControllerKey].connect(store, {
      enabled: options.enabled,
      delay: options.delay,
      onPersist: options.onPersist ? (args) => onPersist(args) : undefined,
    })
  }, [options.delay, options.enabled, store])

  return {
    store,
    flush() {
      return store.persist.flush()
    },
  }
}

/**
 * Returns the persistent store context for a builder.
 *
 * This hook requires a matching {@link PersistStoreProvider} ancestor.
 */
export function usePersistentStore<TState, TPlugins>(
  builder: StoreBuilder<TState, TPlugins & PersistStoreSurface>,
): PersistentStoreResult<TState, TPlugins> {
  const contextValue = useContext(
    getPersistStoreContext<TState, TPlugins>(builder),
  )

  if (!contextValue) {
    throw new Error(
      'usePersistentStore(builder) requires a matching <PersistStoreProvider builder={...}> or <PersistStoreProvider store={...}> ancestor.',
    )
  }

  return contextValue
}

function usePersistenceBoundary<TState>(
  store: PersistedStore<TState>,
  options: PersistenceBoundaryOptions,
) {
  const { flushOnUnmount, flushOnPageHide, flushOnBackground } = options
  useEffect(() => {
    if (!flushOnUnmount) {
      return
    }

    return () => {
      void store.persist.flush()
    }
  }, [flushOnUnmount, store])

  useEffect(() => {
    if (!flushOnPageHide || typeof window === 'undefined') {
      return
    }

    const handlePageHide = () => {
      void store.persist.flush()
    }

    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [flushOnPageHide, store])

  useEffect(() => {
    if (!flushOnBackground) {
      return
    }

    // Web has no app background lifecycle equivalent here yet.
  }, [flushOnBackground])
}

interface PersistStoreProviderContentProps<
  TState,
  TPlugins,
> extends PersistenceBoundaryOptions {
  builder: StoreBuilder<TState, TPlugins & PersistStoreSurface>
  children?: PersistStoreProviderChildren<TState, TPlugins>
  persist?: PersistRuntimeOptions<TState>
  store: InternalPersistedStore<TState, TPlugins>
}

function PersistStoreProviderContent<TState, TPlugins>({
  builder,
  flushOnBackground,
  flushOnPageHide,
  flushOnUnmount,
  children,
  persist = {},
  store,
}: PersistStoreProviderContentProps<TState, TPlugins>) {
  const persistentStore = usePersistentRuntime<TState, TPlugins>(store, persist)
  const Context = getPersistStoreContext<TState, TPlugins>(builder)

  usePersistenceBoundary(store, {
    flushOnBackground,
    flushOnPageHide,
    flushOnUnmount,
  })

  const content =
    typeof children === 'function' ? children(persistentStore) : children

  return <Context.Provider value={persistentStore}>{content}</Context.Provider>
}

/**
 * Provides a persisted runtime store to React descendants.
 *
 * This composes the core {@link StoreProvider} and connects persistence
 * runtime options such as `enabled`, `delay`, and `onPersist` for the mounted
 * boundary. On web, `flushOnBackground` is currently accepted but does not
 * perform any additional work.
 */
export function PersistStoreProvider<TState, TPlugins = {}>(
  props: PersistStoreProviderProps<TState, TPlugins>,
) {
  if (!props.builder) {
    const builder = getStoreBuilder(props.store)

    if (!builder) {
      throw new Error(
        'PersistStoreProvider could not resolve a builder for the provided store. Pass a persisted store created by @lunarhue/store.',
      )
    }

    return (
      <StoreProvider store={props.store}>
        {({ store }) => (
          <PersistStoreProviderContent
            builder={
              builder as StoreBuilder<TState, TPlugins & PersistStoreSurface>
            }
            store={store as InternalPersistedStore<TState, TPlugins>}
            persist={props.persist}
            flushOnUnmount={props.flushOnUnmount}
            flushOnPageHide={props.flushOnPageHide}
            flushOnBackground={props.flushOnBackground}
          >
            {props.children}
          </PersistStoreProviderContent>
        )}
      </StoreProvider>
    )
  }

  const content = (store: PersistedStore<TState, TPlugins>) => (
    <PersistStoreProviderContent
      builder={props.builder}
      store={store as InternalPersistedStore<TState, TPlugins>}
      persist={props.persist}
      flushOnUnmount={props.flushOnUnmount}
      flushOnPageHide={props.flushOnPageHide}
      flushOnBackground={props.flushOnBackground}
    >
      {props.children}
    </PersistStoreProviderContent>
  )

  if ('initialState' in props) {
    const initialState = props.initialState as TState

    return (
      <StoreProvider builder={props.builder} initialState={initialState}>
        {({ store }) => content(store as PersistedStore<TState, TPlugins>)}
      </StoreProvider>
    )
  }

  if (props.loadInitialState) {
    return (
      <StoreProvider
        builder={props.builder}
        loadInitialState={props.loadInitialState}
      >
        {({ store }) => content(store as PersistedStore<TState, TPlugins>)}
      </StoreProvider>
    )
  }

  return (
    <StoreProvider builder={props.builder}>
      {({ store }) => content(store as PersistedStore<TState, TPlugins>)}
    </StoreProvider>
  )
}

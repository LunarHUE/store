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

export type PersistentStoreResult<TState, TPlugins = {}> = {
  store: PersistedStore<TState, TPlugins>
  flush(): Promise<void>
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
  flushOnBackground?: boolean
  flushOnPageHide?: boolean
  flushOnUnmount?: boolean
  persist?: PersistRuntimeOptions<TState>
  store?: never
}

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
  flushOnBackground?: boolean
  flushOnPageHide?: boolean
  flushOnUnmount?: boolean
  persist?: PersistRuntimeOptions<TState>
  store: PersistedStore<TState, TPlugins>
}

export type PersistStoreProviderProps<TState, TPlugins = {}> =
  | BuilderPersistStoreProviderProps<TState, TPlugins>
  | ExternalPersistStoreProviderProps<TState, TPlugins>

type PersistenceBoundaryOptions = {
  flushOnBackground?: boolean
  flushOnPageHide?: boolean
  flushOnUnmount?: boolean
}

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
      key: options.key,
      enabled: options.enabled,
      delay: options.delay,
      onPersist: options.onPersist ? (args) => onPersist(args) : undefined,
    })
  }, [options.delay, options.enabled, options.key, store])

  return {
    store,
    flush() {
      return store.persist.flush()
    },
  }
}

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
  {
    flushOnBackground,
    flushOnPageHide,
    flushOnUnmount,
  }: PersistenceBoundaryOptions,
) {
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

interface PersistStoreProviderContentProps<TState, TPlugins> {
  builder: StoreBuilder<TState, TPlugins & PersistStoreSurface>
  children?: PersistStoreProviderChildren<TState, TPlugins>
  flushOnBackground?: boolean
  flushOnPageHide?: boolean
  flushOnUnmount?: boolean
  persist?: PersistRuntimeOptions<TState>
  store: InternalPersistedStore<TState, TPlugins>
}

function PersistStoreProviderContent<TState, TPlugins>({
  builder,
  flushOnBackground,
  flushOnPageHide,
  flushOnUnmount,
  children,
  persist,
  store,
}: PersistStoreProviderContentProps<TState, TPlugins>) {
  const persistentStore = usePersistentRuntime<TState, TPlugins>(
    store,
    persist ?? {},
  )
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

export function PersistStoreProvider<TState, TPlugins = {}>(
  props: PersistStoreProviderProps<TState, TPlugins>,
) {
  if (props.builder !== undefined) {
    const content = ({
      store,
    }: {
      store: PersistedStore<TState, TPlugins>
    }) => (
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
          {content}
        </StoreProvider>
      )
    }

    if (props.loadInitialState) {
      return (
        <StoreProvider
          builder={props.builder}
          loadInitialState={props.loadInitialState}
        >
          {content}
        </StoreProvider>
      )
    }

    return <StoreProvider builder={props.builder}>{content}</StoreProvider>
  }

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

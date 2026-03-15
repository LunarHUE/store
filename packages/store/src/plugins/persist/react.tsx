import { type ReactNode, useEffect, useEffectEvent } from 'react'

import { StoreProvider, useSelector } from '../../react'
import type { StoreBuilder } from '../../core'

import {
  persistControllerKey,
  type PersistHydrateArgs,
  type PersistMeta,
  type PersistPersistArgs,
  type PersistPluginSurface,
  type PersistRuntimeOptions,
  type PersistedStore,
} from './types'

export type PersistentStoreResult<TState, TPlugins = {}> = {
  store: PersistedStore<TState, TPlugins>
  meta: PersistMeta
  isHydrated: boolean
  flush(): Promise<void>
}

type PersistStoreProviderChildren<TState, TPlugins> =
  | ReactNode
  | ((args: PersistentStoreResult<TState, TPlugins>) => ReactNode)

type BuilderPersistStoreProviderProps<TState, TPlugins> = {
  builder: StoreBuilder<TState, TPlugins & PersistPluginSurface<TState>>
  children?: PersistStoreProviderChildren<TState, TPlugins>
  flushOnBackground?: boolean
  flushOnPageHide?: boolean
  flushOnUnmount?: boolean
  persist?: PersistRuntimeOptions<TState>
  store?: never
}

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

export type PersistenceBoundaryProps<TState> = {
  store: PersistedStore<TState>
  flushOnUnmount?: boolean
  flushOnPageHide?: boolean
  flushOnBackground?: boolean
  children?: ReactNode
}

type PersistenceBoundaryOptions = {
  flushOnBackground?: boolean
  flushOnPageHide?: boolean
  flushOnUnmount?: boolean
}

export function usePersistentStore<TState, TPlugins = {}>(
  store: PersistedStore<TState, TPlugins>,
  options: PersistRuntimeOptions<TState>,
): PersistentStoreResult<TState, TPlugins> {
  const meta = usePersistSelector(store, (currentMeta) => currentMeta)
  const onPersist = useEffectEvent(async (args: PersistPersistArgs<TState>) => {
    if (!options.onPersist) {
      return
    }

    await options.onPersist(args)
  })
  const hydrate = useEffectEvent(async (args: PersistHydrateArgs<TState>) => {
    if (!options.hydrate) {
      return
    }

    await options.hydrate(args)
  })

  useEffect(() => {
    return store.persist[persistControllerKey].connect(store, {
      key: options.key,
      enabled: options.enabled,
      delay: options.delay,
      onPersist: options.onPersist ? (args) => onPersist(args) : undefined,
      hydrate: options.hydrate ? (args) => hydrate(args) : undefined,
    })
  }, [
    options.delay,
    options.enabled,
    options.key,
    store,
    Boolean(options.hydrate),
  ])

  return {
    store,
    meta,
    isHydrated: meta.isHydrated,
    flush() {
      return store.persist.flush()
    },
  }
}

export function usePersistSelector<TSelected>(
  store: PersistedStore<any>,
  selector: (meta: PersistMeta) => TSelected,
  compare?: (a: TSelected, b: TSelected) => boolean,
): TSelected {
  return useSelector(store.persist.metaStore, selector, compare)
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

function PersistStoreProviderContent<TState, TPlugins>({
  flushOnBackground,
  flushOnPageHide,
  flushOnUnmount,
  children,
  persist,
  store,
}: {
  children?: PersistStoreProviderChildren<TState, TPlugins>
  flushOnBackground?: boolean
  flushOnPageHide?: boolean
  flushOnUnmount?: boolean
  persist?: PersistRuntimeOptions<TState>
  store: PersistedStore<TState, TPlugins>
}) {
  const persistentStore = usePersistentStore<TState, TPlugins>(
    store,
    persist ?? {},
  )

  usePersistenceBoundary(store, {
    flushOnBackground,
    flushOnPageHide,
    flushOnUnmount,
  })

  const content =
    typeof children === 'function' ? children(persistentStore) : children

  return <>{content}</>
}

export function PersistStoreProvider<TState, TPlugins = {}>(
  props: PersistStoreProviderProps<TState, TPlugins>,
) {
  if (props.builder !== undefined) {
    return (
      <StoreProvider builder={props.builder}>
        {({ store }) => (
          <PersistStoreProviderContent
            store={store as PersistedStore<TState, TPlugins>}
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

  return (
    <StoreProvider store={props.store}>
      {({ store }) => (
        <PersistStoreProviderContent
          store={store as PersistedStore<TState, TPlugins>}
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

export function PersistenceBoundary<TState>({
  children,
  flushOnBackground,
  flushOnPageHide,
  flushOnUnmount,
  store,
}: PersistenceBoundaryProps<TState>) {
  usePersistenceBoundary(store, {
    flushOnBackground,
    flushOnPageHide,
    flushOnUnmount,
  })

  return <>{children}</>
}

import { type ReactNode, useEffect, useEffectEvent } from 'react'

import { useSelector } from '../../react'

import {
  persistControllerKey,
  type PersistHydrateArgs,
  type PersistMeta,
  type PersistPersistArgs,
  type PersistRuntimeOptions,
  type PersistedStore,
} from './types'

export type PersistentStoreResult<TState> = {
  store: PersistedStore<TState>
  meta: PersistMeta
  isHydrated: boolean
  flush(): Promise<void>
}

export type PersistenceBoundaryProps<TState> = {
  store: PersistedStore<TState>
  flushOnUnmount?: boolean
  flushOnPageHide?: boolean
  flushOnBackground?: boolean
  children?: ReactNode
}

export function usePersistentStore<TState>(
  store: PersistedStore<TState>,
  options: PersistRuntimeOptions<TState>,
): PersistentStoreResult<TState> {
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

export function PersistenceBoundary<TState>({
  children,
  flushOnBackground,
  flushOnPageHide,
  flushOnUnmount,
  store,
}: PersistenceBoundaryProps<TState>) {
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

  return <>{children}</>
}

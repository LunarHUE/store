import { useEffect, useRef } from 'react'

import type { Store, StoreBuilder } from '../core'

export function useLocalStore<TState, TPlugins>(
  builder: StoreBuilder<TState, TPlugins>,
): Store<TState, TPlugins> {
  const localStoreRef = useRef<Store<TState, TPlugins> | null>(null)

  if (!localStoreRef.current) {
    localStoreRef.current = builder.create()
  }

  useEffect(() => {
    const localStore = localStoreRef.current

    return () => {
      if (!localStore) {
        return
      }

      void localStore.dispose()
    }
  }, [])

  return localStoreRef.current
}

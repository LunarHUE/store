import { useContext, useEffect, useRef } from 'react'

import { getStoreContext } from './context'

import type { Store, StoreBuilder } from '../core'

export function useStore<TState, TPlugins>(
  builder: StoreBuilder<TState, TPlugins>,
): Store<TState, TPlugins> {
  const contextValue = useContext(getStoreContext(builder))
  const localStoreRef = useRef<Store<TState, TPlugins> | null>(null)

  if (!contextValue && !localStoreRef.current) {
    localStoreRef.current = builder.create()
  }

  useEffect(() => {
    if (contextValue || !localStoreRef.current) {
      return
    }

    const localStore = localStoreRef.current

    return () => {
      void localStore.dispose()
    }
  }, [contextValue])

  return contextValue ?? (localStoreRef.current as Store<TState, TPlugins>)
}

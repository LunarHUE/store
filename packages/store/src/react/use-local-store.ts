import { useEffect, useEffectEvent, useRef } from 'react'

import type { Store, StoreBuilder } from '../core'

export function useLocalStore<TState, TPlugins>(
  builder: StoreBuilder<TState, TPlugins>,
  options?: {
    initialState?: TState
    initialize?: (args: { store: Store<TState, TPlugins> }) => Promise<void>
  },
): Store<TState, TPlugins> {
  const initializeStartedRef = useRef(false)
  const localStoreRef = useRef<Store<TState, TPlugins> | null>(null)
  const hasInitialState =
    options !== undefined &&
    Object.prototype.hasOwnProperty.call(options, 'initialState')

  if (!localStoreRef.current) {
    localStoreRef.current = hasInitialState
      ? builder.create(options?.initialState)
      : builder.create()
  }

  const initializeStore = useEffectEvent(async () => {
    const localStore = localStoreRef.current

    if (!localStore || !options?.initialize) {
      return
    }

    await options.initialize({ store: localStore })
  })

  useEffect(() => {
    const localStore = localStoreRef.current

    if (
      localStore &&
      !initializeStartedRef.current &&
      localStore.lifecycle.meta.get().status === 'uninitialized' &&
      options?.initialize
    ) {
      initializeStartedRef.current = true
      void initializeStore()
    }

    return () => {
      if (!localStore) {
        return
      }

      void localStore.dispose()
    }
  }, [initializeStore, options?.initialize])

  return localStoreRef.current
}

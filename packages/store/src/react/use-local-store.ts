import { useEffect, useEffectEvent, useRef } from 'react'

import type { Store, StoreBuilder, StoreInitialStateLoader } from '../core'

type LocalStoreOptionsBase = {}

type LocalStoreWithInitialStateOptions<TState> = LocalStoreOptionsBase & {
  initialState: TState
  loadInitialState?: never
}

type LocalStoreWithLoadInitialStateOptions<TState, TPlugins> =
  LocalStoreOptionsBase & {
    initialState?: never
    loadInitialState: StoreInitialStateLoader<TState, TPlugins>
  }

type LocalStoreDeclaredInitialStateOptions = LocalStoreOptionsBase & {
  initialState?: never
  loadInitialState?: never
}

type LocalStoreOptions<TState, TPlugins> =
  | LocalStoreDeclaredInitialStateOptions
  | LocalStoreWithInitialStateOptions<TState>
  | LocalStoreWithLoadInitialStateOptions<TState, TPlugins>

export function useLocalStore<TState, TPlugins>(
  builder: StoreBuilder<TState, TPlugins>,
  options?: LocalStoreOptions<TState, TPlugins>,
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

    if (!localStore || !options?.loadInitialState) {
      return
    }

    const nextState = await options.loadInitialState({ store: localStore })
    await localStore.setInitialState(nextState)
  })

  useEffect(() => {
    const localStore = localStoreRef.current

    if (
      localStore &&
      !initializeStartedRef.current &&
      localStore.lifecycle.meta.get().status === 'uninitialized' &&
      options?.loadInitialState
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
  }, [initializeStore, options?.loadInitialState])

  return localStoreRef.current
}

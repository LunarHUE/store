import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { getStoreBuilder } from '../core/builder-registry'
import { getStoreContext } from './context'

import type {
  ReadableStore,
  Store,
  StoreBuilder,
  StoreLifecycleMeta,
} from '../core'

type StoreProviderChildren<TState, TPlugins> =
  | ReactNode
  | ((args: { store: Store<TState, TPlugins> }) => ReactNode)

type StoreInitializer<TState, TPlugins> = (args: {
  store: Store<TState, TPlugins>
}) => Promise<void>

type BuilderProviderProps<TState, TPlugins> = {
  builder: StoreBuilder<TState, TPlugins>
  children?: StoreProviderChildren<TState, TPlugins>
  hasInitialState?: boolean
  initialize?: StoreInitializer<TState, TPlugins>
  initialState?: TState
  store?: never
}

type StoreProviderProps<TState, TPlugins> = {
  builder?: never
  children?: StoreProviderChildren<TState, TPlugins>
  store: Store<TState, TPlugins>
}

export type ProviderProps<TState, TPlugins> =
  | BuilderProviderProps<TState, TPlugins>
  | StoreProviderProps<TState, TPlugins>

export function StoreProvider<TState, TPlugins>(
  props: ProviderProps<TState, TPlugins>,
) {
  if (props.builder !== undefined) {
    return (
      <BuilderOwnedStoreProvider
        builder={props.builder}
        hasInitialState={'initialState' in props}
        initialize={props.initialize}
        initialState={props.initialState}
      >
        {props.children}
      </BuilderOwnedStoreProvider>
    )
  }

  return (
    <ExternalStoreProvider store={props.store}>
      {props.children}
    </ExternalStoreProvider>
  )
}

// Native and Expo declare this globally in development mode.
declare const __DEV__: boolean

type WritableReadableStore<TState> = ReadableStore<TState> & {
  setState(updater: (prev: TState) => TState): void
}

function updateLifecycleMeta<TState, TPlugins>(
  store: Store<TState, TPlugins>,
  updater: (prev: StoreLifecycleMeta) => StoreLifecycleMeta,
) {
  ;(
    store.lifecycle.meta as WritableReadableStore<StoreLifecycleMeta>
  ).setState(updater)
}

function BuilderOwnedStoreProvider<TState, TPlugins>({
  builder,
  children,
  hasInitialState,
  initialize,
  initialState,
}: BuilderProviderProps<TState, TPlugins>) {
  const context = getStoreContext(builder)
  const builderRef = useRef<StoreBuilder<TState, TPlugins> | null>(null)
  const initializeStartedRef = useRef(false)
  const storeRef = useRef<Store<TState, TPlugins> | null>(null)
  const [, forceRender] = useState(0)

  if (!builderRef.current) {
    builderRef.current = builder
  } else if (builderRef.current !== builder) {
    const isDev =
      process.env.NODE_ENV !== 'production' ||
      (typeof __DEV__ !== 'undefined' && __DEV__)

    if (isDev) {
      console.warn('StoreProvider builder prop must remain stable.')
    } else {
      throw new Error('StoreProvider builder prop must remain stable.')
    }
  }

  if (!storeRef.current) {
    storeRef.current = hasInitialState
      ? builder.create(initialState)
      : builder.create()
  }

  const initializeStore = useEffectEvent(async () => {
    const ownedStore = storeRef.current

    if (!ownedStore || !initialize) {
      return
    }

    updateLifecycleMeta(ownedStore, (prev) => ({
      ...prev,
      status: 'initializing',
      error: null,
    }))

    try {
      await initialize({ store: ownedStore })

      const nextMeta = ownedStore.lifecycle.meta.get()

      if (nextMeta.status === 'uninitialized') {
        throw new Error(
          'StoreProvider initialize callback must call store.initialize(...) before it resolves.',
        )
      }
    } catch (error) {
      updateLifecycleMeta(ownedStore, () => ({
        status: 'error',
        error,
      }))
    }
  })

  useEffect(() => {
    const ownedStore = storeRef.current

    if (!ownedStore) {
      return
    }

    const subscription = ownedStore.lifecycle.meta.subscribe(() => {
      forceRender((value) => value + 1)
    })

    return () => {
      subscription.unsubscribe()

      if (!ownedStore) {
        return
      }

      void ownedStore.dispose()
    }
  }, [])

  useEffect(() => {
    const ownedStore = storeRef.current

    if (
      !ownedStore ||
      initializeStartedRef.current ||
      ownedStore.lifecycle.meta.get().status !== 'uninitialized' ||
      !initialize
    ) {
      return
    }

    initializeStartedRef.current = true
    void initializeStore()
  }, [initialize, initializeStore])

  const ownedStore = storeRef.current
  const lifecycleMeta = ownedStore.lifecycle.meta.get()

  if (lifecycleMeta.status === 'error') {
    throw lifecycleMeta.error ?? new Error('Store initialization failed.')
  }

  if (lifecycleMeta.status === 'uninitialized' && !initialize) {
    throw new Error(
      'StoreProvider requires initialState or initialize when the builder has no declared initial state.',
    )
  }

  if (
    lifecycleMeta.status === 'uninitialized' ||
    lifecycleMeta.status === 'initializing'
  ) {
    return <context.Provider value={ownedStore}>{null}</context.Provider>
  }

  const content =
    typeof children === 'function'
      ? children({ store: ownedStore })
      : children

  return <context.Provider value={ownedStore}>{content}</context.Provider>
}

function ExternalStoreProvider<TState, TPlugins>({
  children,
  store,
}: StoreProviderProps<TState, TPlugins>) {
  const builder = getStoreBuilder(store)

  if (!builder) {
    throw new Error(
      'StoreProvider could not resolve a builder for the provided store. Pass a store created by @lunarhue/store.',
    )
  }

  const context = getStoreContext(builder)
  const content =
    typeof children === 'function' ? children({ store }) : children

  return <context.Provider value={store}>{content}</context.Provider>
}

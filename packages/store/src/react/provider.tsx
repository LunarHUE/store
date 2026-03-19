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
  StoreInitialStateLoader,
  StoreLifecycleMeta,
} from '../core'

type StoreProviderChildren<TState, TPlugins> =
  | ReactNode
  | ((args: { store: Store<TState, TPlugins> }) => ReactNode)

type BuilderProviderBaseProps<TState, TPlugins> = {
  builder: StoreBuilder<TState, TPlugins>
  children?: StoreProviderChildren<TState, TPlugins>
  hasInitialState?: boolean
  store?: never
}

type BuilderProviderWithInitialStateProps<TState, TPlugins> =
  BuilderProviderBaseProps<TState, TPlugins> & {
    initialState: TState
    loadInitialState?: never
  }

type BuilderProviderWithLoadInitialStateProps<TState, TPlugins> =
  BuilderProviderBaseProps<TState, TPlugins> & {
    initialState?: never
    loadInitialState: StoreInitialStateLoader<TState, TPlugins>
  }

type BuilderProviderWithDeclaredInitialStateProps<TState, TPlugins> =
  BuilderProviderBaseProps<TState, TPlugins> & {
    initialState?: never
    loadInitialState?: never
  }

type BuilderProviderProps<TState, TPlugins> =
  | BuilderProviderWithDeclaredInitialStateProps<TState, TPlugins>
  | BuilderProviderWithInitialStateProps<TState, TPlugins>
  | BuilderProviderWithLoadInitialStateProps<TState, TPlugins>

type BuilderOwnedStoreProviderProps<TState, TPlugins> = {
  builder: StoreBuilder<TState, TPlugins>
  children?: StoreProviderChildren<TState, TPlugins>
  hasInitialState: boolean
  initialState?: TState
  loadInitialState?: StoreInitialStateLoader<TState, TPlugins>
}

type StoreProviderProps<TState, TPlugins> = {
  builder?: never
  children?: StoreProviderChildren<TState, TPlugins>
  store: Store<TState, TPlugins>
}

/**
 * Props for {@link StoreProvider}.
 *
 * Use either `builder` to let the provider create and own the runtime store,
 * or `store` to provide an already-created runtime store. When a builder has
 * no declared initial state, the builder-owned form must also provide either
 * `initialState` or `loadInitialState`.
 */
export type ProviderProps<TState, TPlugins = {}> =
  | BuilderProviderProps<TState, TPlugins>
  | StoreProviderProps<TState, TPlugins>

/**
 * Provides a builder-scoped runtime store to React descendants.
 *
 * Builder-owned providers create and dispose the runtime store automatically.
 * External-store providers reuse an existing runtime store and do not own its
 * disposal. The `builder` prop must remain stable for the provider lifetime.
 * Children may be plain JSX or a render prop that receives the resolved
 * runtime store instance.
 */
export function StoreProvider<TState, TPlugins>(
  props: ProviderProps<TState, TPlugins>,
) {
  if (props.builder !== undefined) {
    return (
      <BuilderOwnedStoreProvider
        builder={props.builder}
        hasInitialState={'initialState' in props}
        initialState={props.initialState}
        loadInitialState={props.loadInitialState}
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
  initialState,
  loadInitialState,
}: BuilderOwnedStoreProviderProps<TState, TPlugins>) {
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

    if (!ownedStore || !loadInitialState) {
      return
    }

    updateLifecycleMeta(ownedStore, (prev) => ({
      ...prev,
      status: 'initializing',
      error: null,
    }))

    try {
      const nextState = await loadInitialState({ store: ownedStore })
      await ownedStore.setInitialState(nextState)
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
      !loadInitialState
    ) {
      return
    }

    initializeStartedRef.current = true
    void initializeStore()
  }, [loadInitialState, initializeStore])

  const ownedStore = storeRef.current
  const lifecycleMeta = ownedStore.lifecycle.meta.get()

  if (lifecycleMeta.status === 'error') {
    throw lifecycleMeta.error ?? new Error('Store initialization failed.')
  }

  if (lifecycleMeta.status === 'uninitialized' && !loadInitialState) {
    throw new Error(
      'StoreProvider requires initialState or loadInitialState when the builder has no declared initial state.',
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

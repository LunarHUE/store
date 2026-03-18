import { useEffect, useRef, type ReactNode } from 'react'

import { getStoreBuilder } from '../core/builder-registry'
import { getStoreContext } from './context'

import type { Store, StoreBuilder } from '../core'

type StoreProviderChildren<TState, TPlugins> =
  | ReactNode
  | ((args: { store: Store<TState, TPlugins> }) => ReactNode)

type BuilderProviderProps<TState, TPlugins> = {
  builder: StoreBuilder<TState, TPlugins>
  children?: StoreProviderChildren<TState, TPlugins>
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

// Native and expo declare this globally in development mode
declare const __DEV__: boolean

function BuilderOwnedStoreProvider<TState, TPlugins>({
  builder,
  children,
  initialState,
}: BuilderProviderProps<TState, TPlugins>) {
  const context = getStoreContext(builder)
  const builderRef = useRef<StoreBuilder<TState, TPlugins> | null>(null)
  const storeRef = useRef<Store<TState, TPlugins> | null>(null)

  if (!builderRef.current) {
    builderRef.current = builder
  } else if (builderRef.current !== builder) {
    const isDev =
      process.env.NODE_ENV !== 'production' ||
      (typeof __DEV__ !== 'undefined' && __DEV__)
    if (isDev) {
      console.warn('StoreProvider builder prop must remain stable.')
    } else {
      // This is a production error in theory your builder should never change, unless we are changing with HMR
      throw new Error('StoreProvider builder prop must remain stable.')
    }
  }

  if (!storeRef.current) {
    storeRef.current = builder.create(initialState)
  }

  useEffect(() => {
    const ownedStore = storeRef.current

    return () => {
      if (!ownedStore) {
        return
      }

      void ownedStore.dispose()
    }
  }, [])

  const content =
    typeof children === 'function'
      ? children({ store: storeRef.current })
      : children

  return <context.Provider value={storeRef.current}>{content}</context.Provider>
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

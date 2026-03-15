import type { ReactNode } from 'react'

import { getStoreContext } from './context'
import { useStore as useScopedStore } from './use-store'

import type { Store, StoreBuilder } from '../core'

export function createStoreContext<TState, TPlugins>(
  builder: StoreBuilder<TState, TPlugins>,
) {
  const Context = getStoreContext(builder)

  function Provider(props: {
    value: Store<TState, TPlugins>
    children?: ReactNode
  }) {
    return <Context.Provider value={props.value}>{props.children}</Context.Provider>
  }

  function useStore() {
    return useScopedStore(builder)
  }

  return {
    Provider,
    useStore,
  }
}

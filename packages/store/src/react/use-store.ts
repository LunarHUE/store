import { useContext } from 'react'

import { getStoreContext } from './context'

import type { Store, StoreBuilder } from '../core'

export function useStore<TState, TPlugins>(
  builder: StoreBuilder<TState, TPlugins>,
): Store<TState, TPlugins> {
  const contextValue = useContext(getStoreContext(builder))

  if (!contextValue) {
    throw new Error(
      'useStore(builder) requires a matching <StoreProvider builder={...}> or <StoreProvider store={...}> ancestor.',
    )
  }

  return contextValue
}

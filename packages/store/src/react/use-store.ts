import { useContext } from 'react'

import { getStoreContext } from './context'

import type { Store, StoreBuilder } from '../core'

/**
 * Returns the runtime store provided for a builder.
 *
 * This hook requires a matching {@link StoreProvider} ancestor using either
 * the same builder or a runtime store created from that builder.
 */
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

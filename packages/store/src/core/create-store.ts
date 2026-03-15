import { createStoreDefinition } from './store-definition'

import type { StoreDefinition } from './types'

export function createStore<TState>(initialState: TState): StoreDefinition<TState> {
  return createStoreDefinition(initialState)
}

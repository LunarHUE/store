
import { createStoreInstance } from './store-instance'
import type { StoreInstance } from './types'

export function createStore<TState>(
  initialState: TState,
): StoreInstance<TState, {}> {
  return createStoreInstance(initialState)
}

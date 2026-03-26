import type { Store } from '../../core'
import type { ActionsStoreSurface } from './types'

/**
 * Returns the typed `store.actions` surface attached by the actions plugin.
 */
export function useActions<TState, TActions>(
  store: Store<TState, ActionsStoreSurface<TState, TActions>>
): ActionsStoreSurface<TState, TActions>['actions'] {
  return store.actions
}

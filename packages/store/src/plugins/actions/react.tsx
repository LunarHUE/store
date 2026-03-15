import type { Store } from '../../core'

import type { ActionsStoreSurface } from './types'

export function useActions<TState, TActions>(
  store: Store<TState, ActionsStoreSurface<TState, TActions>>,
): ActionsStoreSurface<TState, TActions>['actions'] {
  return store.actions
}

import type { Store } from '../../core'

import type { ActionsPluginSurface } from './types'

export function useActions<TState, TActions>(
  store: Store<TState, ActionsPluginSurface<TState, TActions>>,
): ActionsPluginSurface<TState, TActions>['actions'] {
  return store.actions
}

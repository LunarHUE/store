import { actionsBrand } from './types'

import type { ActionsPlugin } from './types'

export function actions<TState, TActions>(
  builder: (helpers: {
    getState: () => TState
    setState: (updater: (prev: TState) => TState) => void
  }) => TActions,
): ActionsPlugin<TState, TActions> {
  return ({ store }) => ({
    [actionsBrand]: true,
    actions: builder({
      getState: () => store.get(),
      setState: (updater) => store.setState(updater),
    }),
  })
}

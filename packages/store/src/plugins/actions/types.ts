import type { StoreBrand, StorePlugin } from '../../core'

export const actionsBrand = Symbol('lunarhue.store.actions')

export type ActionsBrand = StoreBrand<typeof actionsBrand>

export type ActionsPluginSurface<TActions> = {
  readonly actions: TActions
} & ActionsBrand

export type ActionsPlugin<TState, TActions> = StorePlugin<
  TState,
  any,
  ActionsPluginSurface<TActions>
>

export type ActionsBuilderHelpers<TState> = {
  getState: () => TState
  setState: (updater: (prev: TState) => TState) => void
}

import type { StoreBrand, StorePlugin } from '../../core'

export const actionsBrand = Symbol('lunarhue.store.actions')
export const actionDefinitionBrand = Symbol('lunarhue.store.actionDefinition')
export const bindActionDefinition = Symbol('lunarhue.store.bindActionDefinition')

export type ActionsBrand = StoreBrand<typeof actionsBrand>

export type ActionsPluginSurface<TState, TActions> = {
  readonly actions: BoundActions<TState, TActions>
} & ActionsBrand

export type ActionsPlugin<TState, TActions> = StorePlugin<
  TState,
  any,
  ActionsPluginSurface<TState, TActions>
>

export type ActionsBuilderHelpers<TState> = {
  getState: () => TState
  setState: (updater: (prev: TState) => TState) => void
}

export type ActionCallback<
  TState,
  TArgs extends unknown[] = [],
  TReturn = void,
> = (
  helpers: ActionsBuilderHelpers<TState>,
  ...args: TArgs
) => TReturn

export type ActionDefinition<
  TState,
  TArgs extends unknown[] = [],
  TReturn = void,
> = {
  readonly [actionDefinitionBrand]: true
  readonly [bindActionDefinition]: (
    helpers: ActionsBuilderHelpers<TState>,
  ) => (...args: TArgs) => TReturn
}

export type BoundActions<TState, TActions> = {
  [TKey in keyof TActions]: TActions[TKey] extends ActionDefinition<
    TState,
    infer TArgs,
    infer TReturn
  >
    ? (...args: TArgs) => TReturn
    : TActions[TKey]
}

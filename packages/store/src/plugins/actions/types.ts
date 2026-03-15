import type { StorePlugin } from '../../core'

export const actionDefinitionBrand = Symbol('lunarhue.store.actionDefinition')
export const bindActionDefinition = Symbol('lunarhue.store.bindActionDefinition')

export type ActionsStoreSurface<TState, TActions> = {
  readonly actions: BoundActions<TState, TActions>
}

export type ActionsPlugin<TState, TActions> = StorePlugin<
  TState,
  any,
  ActionsStoreSurface<TState, TActions>
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
  readonly __actionDefinition: (
    helpers: ActionsBuilderHelpers<TState>,
    ...args: TArgs
  ) => TReturn
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

export type InternalActionDefinition<
  TState,
  TArgs extends unknown[] = [],
  TReturn = void,
> = ActionDefinition<TState, TArgs, TReturn> & {
  readonly [actionDefinitionBrand]: true
  readonly [bindActionDefinition]: (
    helpers: ActionsBuilderHelpers<TState>,
  ) => (...args: TArgs) => TReturn
}

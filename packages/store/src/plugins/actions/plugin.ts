import {
  actionDefinitionBrand,
  bindActionDefinition,
} from './types'

import type {
  ActionCallback,
  ActionDefinition,
  ActionsBuilderHelpers,
  ActionsPlugin,
  BoundActions,
  InternalActionDefinition,
} from './types'

function isActionDefinition<TState>(
  value: unknown,
): value is InternalActionDefinition<TState, unknown[], unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    actionDefinitionBrand in value &&
    bindActionDefinition in value
  )
}

function bindActions<TState, TActions>(
  declaredActions: TActions,
  helpers: ActionsBuilderHelpers<TState>,
): BoundActions<TState, TActions> {
  const boundActions = {} as BoundActions<TState, TActions>

  for (const key of Reflect.ownKeys(declaredActions as object) as Array<
    keyof TActions
  >) {
    const action = declaredActions[key]

    boundActions[key] = (
      isActionDefinition<TState>(action)
        ? action[bindActionDefinition](helpers)
        : action
    ) as BoundActions<TState, TActions>[typeof key]
  }

  return boundActions
}

/**
 * Declares a reusable typed action definition.
 *
 * The returned definition is inert until the actions plugin binds it to a
 * runtime store during store creation. Returning a value from the callback
 * does not update store state by itself; actions must call `setState(...)`
 * to commit state transitions.
 */
export function createAction<
  TState,
  TArgs extends unknown[] = [],
  TReturn = void,
>(
  callback: ActionCallback<TState, TArgs, TReturn>,
): ActionDefinition<TState, TArgs, TReturn> {
  return {
    [actionDefinitionBrand]: true,
    [bindActionDefinition](helpers) {
      return (...args) => callback(helpers, ...args)
    },
  } as InternalActionDefinition<TState, TArgs, TReturn>
}

/**
 * Attaches typed actions to `store.actions`.
 *
 * Inline action functions and reusable definitions created with
 * {@link createAction} can be mixed in the same surface. All actions receive
 * `getState` and `setState` helpers bound to the runtime store instance.
 * Returning a value from an action does not mutate store state unless the
 * action also calls `setState(...)`.
 */
export function actions<TState, TActions>(
  builder: (helpers: {
    getState: () => TState
    setState: (updater: (prev: TState) => TState) => void
  }) => TActions,
): ActionsPlugin<TState, TActions> {
  return ({ store }) => {
    const helpers = {
      getState: () => store.get(),
      setState: (updater: (prev: TState) => TState) => store.setState(updater),
    }

    return {
      actions: bindActions(builder(helpers), helpers),
    }
  }
}

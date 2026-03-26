import type { StorePlugin } from '../../core'

export const actionDefinitionBrand = Symbol('lunarhue.store.actionDefinition')
export const bindActionDefinition = Symbol(
    'lunarhue.store.bindActionDefinition'
)

/**
 * Runtime store surface attached by the actions plugin.
 */
export type ActionsStoreSurface<TState, TActions> = {
    /**
     * Bound actions for the current runtime store instance.
     */
    readonly actions: BoundActions<TState, TActions>
}

/**
 * Plugin type returned by {@link actions}.
 */
export type ActionsPlugin<TState, TActions> = StorePlugin<
    TState,
    any,
    ActionsStoreSurface<TState, TActions>
>

/**
 * Helpers exposed to action builders and reusable action definitions.
 */
export type ActionsBuilderHelpers<TState> = {
    /**
     * Reads the current runtime store state.
     */
    getState: () => TState
    /**
     * Updates the runtime store state.
     *
     * Action return values are not applied automatically; call `setState(...)`
     * whenever an action should commit a state transition.
     */
    setState: (updater: (prev: TState) => TState) => void
}

/**
 * Callback shape used by {@link createAction}.
 *
 * The callback may return a value for the caller, but returning a next-state
 * object does not mutate store state unless `helpers.setState(...)` is called.
 */
export type ActionCallback<
    TState,
    TArgs extends unknown[] = [],
    TReturn = void,
> = (helpers: ActionsBuilderHelpers<TState>, ...args: TArgs) => TReturn

/**
 * Reusable action definition returned by {@link createAction}.
 */
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

/**
 * Resolves reusable action definitions to callable functions while preserving
 * inline actions as-is.
 */
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
        helpers: ActionsBuilderHelpers<TState>
    ) => (...args: TArgs) => TReturn
}

import { type Context, createContext } from 'react'

import type { Store, StoreBuilder } from '../core'

export type StoreContext<TState, TPlugins> = Context<
    Store<TState, TPlugins> | undefined
>

const contextMap = new WeakMap<StoreBuilder<any, any>, StoreContext<any, any>>()

export function getStoreContext<TState, TPlugins>(
    builder: StoreBuilder<TState, TPlugins>
): StoreContext<TState, TPlugins> {
    let context = contextMap.get(builder)

    if (!context) {
        context = createContext<Store<TState, TPlugins> | undefined>(undefined)
        contextMap.set(builder, context)
    }

    return context
}

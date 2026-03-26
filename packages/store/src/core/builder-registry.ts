import type { Store, StoreBuilder } from './types'

const storeBuilderMap = new WeakMap<Store<any, any>, StoreBuilder<any, any>>()

export function registerStoreBuilder<TState, TPlugins>(
    store: Store<TState, TPlugins>,
    builder: StoreBuilder<TState, TPlugins>
): void {
    storeBuilderMap.set(store, builder)
}

export function getStoreBuilder<TState, TPlugins>(
    store: Store<TState, TPlugins>
): StoreBuilder<TState, TPlugins> | undefined {
    return storeBuilderMap.get(store) as
        | StoreBuilder<TState, TPlugins>
        | undefined
}

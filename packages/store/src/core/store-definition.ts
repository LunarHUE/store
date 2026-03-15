import { createStoreInstance } from './store-instance'

import type { StoreDefinition, StoreInstance, StorePlugin } from './types'

type PluginList<TState> = ReadonlyArray<StorePlugin<TState, any, any>>

export function createStoreDefinition<TState, TPlugins = {}>(
  initialState: TState,
  plugins: PluginList<TState> = [],
): StoreDefinition<TState, TPlugins> {
  return {
    create() {
      const controller = createStoreInstance(initialState)

      for (const plugin of plugins) {
        const surface = plugin({
          store: controller.store as StoreInstance<TState, any>,
          getState: () => controller.store.get(),
          setState: (updater) => controller.store.setState(updater),
          subscribe: (listener) => controller.store.subscribe(listener),
          onDispose: (cleanup) => controller.onDispose(cleanup),
        })

        controller.attachSurface(surface)
      }

      return controller.store as StoreInstance<TState, TPlugins>
    },
    extend<TNextPlugins>(plugin: StorePlugin<TState, TPlugins, TNextPlugins>) {
      return createStoreDefinition<TState, TPlugins & TNextPlugins>(
        initialState,
        [...plugins, plugin],
      )
    },
  }
}

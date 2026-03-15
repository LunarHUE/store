
import { createStoreInstance } from './store-instance'

import type { StoreFactory, StoreInstance, StorePlugin } from './types'

export function createStore<TState>(
  initialState: TState,
): StoreFactory<TState> {
  type PluginList = ReadonlyArray<StorePlugin<TState, any, any>>

  const createFactory = <TPlugins>(
    plugins: PluginList,
  ): StoreFactory<TState, TPlugins> => ({
    create() {
      const controller = createStoreInstance(initialState)

      for (const plugin of plugins) {
        const surface = plugin({
          store: controller.store as StoreInstance<TState, any>,
          onDispose: (cleanup) => controller.onDispose(cleanup),
        })

        controller.attachSurface(surface)
      }

      return controller.store as StoreInstance<TState, TPlugins>
    },
    extend<TNextPlugins>(plugin: StorePlugin<TState, TPlugins, TNextPlugins>) {
      return createFactory<TPlugins & TNextPlugins>([...plugins, plugin])
    },
  })

  return createFactory<{}>([])
}

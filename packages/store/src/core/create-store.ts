
import { createStoreInstance } from './store-instance'

import type { Store, StoreBuilder, StorePlugin } from './types'

export function createStore<TState>(
  initialState: TState,
): StoreBuilder<TState> {
  type PluginList = ReadonlyArray<StorePlugin<TState, any, any>>

  const createBuilder = <TPlugins>(
    plugins: PluginList,
  ): StoreBuilder<TState, TPlugins> => ({
    create() {
      const controller = createStoreInstance(initialState)

      for (const plugin of plugins) {
        const surface = plugin({
          store: controller.store as Store<TState, any>,
          onDispose: (cleanup) => controller.onDispose(cleanup),
        })

        controller.attachSurface(surface)
      }

      return controller.store as Store<TState, TPlugins>
    },
    extend<TNextPlugins>(plugin: StorePlugin<TState, TPlugins, TNextPlugins>) {
      return createBuilder<TPlugins & TNextPlugins>([...plugins, plugin])
    },
  })

  return createBuilder<{}>([])
}

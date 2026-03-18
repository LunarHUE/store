
import { createStoreInstance } from './store-instance'
import { registerStoreBuilder } from './builder-registry'

import type { Store, StoreBuilder, StorePlugin } from './types'

export function createStore<TState>(
  initialState: TState,
): StoreBuilder<TState> {
  type PluginList = ReadonlyArray<StorePlugin<TState, any, any>>

  const createBuilder = <TPlugins>(
    plugins: PluginList,
  ): StoreBuilder<TState, TPlugins> => {
    const builder: StoreBuilder<TState, TPlugins> = {
      create(overrideInitialState?: TState) {
        const controller = createStoreInstance(overrideInitialState ?? initialState)

        for (const plugin of plugins) {
          const surface = plugin({
            store: controller.store as Store<TState, any>,
            onDispose: (cleanup) => controller.onDispose(cleanup),
          })

          controller.attachSurface(surface)
        }

        const store = controller.store as Store<TState, TPlugins>
        registerStoreBuilder(store, builder)

        return store
      },
      extend<TNextPlugins>(
        plugin: StorePlugin<TState, TPlugins, TNextPlugins>,
      ) {
        return createBuilder<TPlugins & TNextPlugins>([...plugins, plugin])
      },
    }

    return builder
  }

  return createBuilder<{}>([])
}

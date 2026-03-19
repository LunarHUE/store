
import { createStoreInstance } from './store-instance'
import { registerStoreBuilder } from './builder-registry'

import type { Store, StoreBuilder, StorePlugin } from './types'

export function createStore<TState>(): StoreBuilder<TState>
export function createStore<TState>(initialState: TState): StoreBuilder<TState>
export function createStore<TState>(
  initialState?: TState,
): StoreBuilder<TState> {
  const hasDeclaredInitialState = arguments.length > 0
  type PluginList = ReadonlyArray<StorePlugin<TState, any, any>>

  const createBuilder = <TPlugins>(
    plugins: PluginList,
  ): StoreBuilder<TState, TPlugins> => {
    const builder: StoreBuilder<TState, TPlugins> = {
      create(overrideInitialState?: TState) {
        const hasOverrideInitialState = arguments.length > 0
        const controller = createStoreInstance({
          initialState: hasOverrideInitialState
            ? overrideInitialState
            : initialState,
          readyOnCreate: hasOverrideInitialState || hasDeclaredInitialState,
        })

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

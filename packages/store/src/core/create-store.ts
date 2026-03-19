
import { createStoreInstance } from './store-instance'
import { registerStoreBuilder } from './builder-registry'
import {
  createBuilderLoggerMetadata,
  defineBuilderLoggerMetadata,
  emitStoreDebugEvent,
} from './logger'

import type {
  Store,
  StoreBuilder,
  StoreCreateOptions,
  StorePlugin,
} from './types'

/**
 * Declares a reusable store builder.
 *
 * The returned builder is immutable: each call to {@link StoreBuilder.extend}
 * returns a new builder, and each call to {@link StoreBuilder.create} returns a
 * fresh runtime store instance. If neither a declaration-time default nor a
 * create-time override is provided, the runtime store starts uninitialized and
 * must receive {@link Store.setInitialState} before reads or writes are valid.
 */
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
    const loggerMetadata = createBuilderLoggerMetadata()
    const builder: StoreBuilder<TState, TPlugins> = {
      create(
        overrideInitialState?: TState,
        options?: StoreCreateOptions<TState>,
      ) {
        const hasOverrideInitialState = overrideInitialState !== undefined
        const controller = createStoreInstance({
          builderId: loggerMetadata.builderId,
          debug: options?.debug,
          hasDeclaredInitialState,
          hasOverrideInitialState,
          initialState: hasOverrideInitialState
            ? overrideInitialState
            : initialState,
          readyOnCreate: hasOverrideInitialState || hasDeclaredInitialState,
        })

        for (const plugin of plugins) {
          const surface = plugin({
            logger: {
              emit(args) {
                return emitStoreDebugEvent(
                  controller.store as Store<TState, any>,
                  args,
                )
              },
            },
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

    defineBuilderLoggerMetadata(builder, loggerMetadata)

    return builder
  }

  return createBuilder<{}>([])
}

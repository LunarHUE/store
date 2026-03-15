import { createPersistController } from './controller'
import { persistBrand, persistControllerKey } from './types'

import type { PersistPlugin, PersistPluginOptions } from './types'

export function persist<TState>(
  options?: PersistPluginOptions<TState>,
): PersistPlugin<TState> {
  return ({ onDispose, store }) => {
    const controller = createPersistController(store, options)

    if (options?.flushOnDispose) {
      onDispose(async () => {
        await controller.flush()
      })
    }

    return {
      [persistBrand]: true,
      hydrate(nextState: TState) {
        return controller.hydrate(nextState)
      },
      persist: {
        flush() {
          return controller.flush()
        },
        hydrate(nextState: TState) {
          return controller.hydrate(nextState)
        },
        metaStore: controller.metaStore,
        [persistControllerKey]: controller,
      },
    }
  }
}

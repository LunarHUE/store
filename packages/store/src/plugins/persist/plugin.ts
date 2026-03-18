import { createPersistController } from './controller'
import { persistControllerKey } from './types'

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
      persist: {
        flush() {
          return controller.flush()
        },
        meta: controller.meta,
        [persistControllerKey]: controller,
      },
    }
  }
}

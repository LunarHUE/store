import { createPersistController } from './controller'
import { persistControllerKey } from './types'

import type { PersistPlugin, PersistPluginOptions } from './types'

/**
 * Attaches persistence metadata and flush controls to `store.persist`.
 *
 * Declaration-time options provide defaults for runtime persistence wiring.
 * `onPersist` may be supplied here or later through `PersistStoreProvider`,
 * but it must exist in one of those places before persistence can run.
 */
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

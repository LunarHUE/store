import { createStore as createTanStackStore } from '@tanstack/store'

import type {
  Updater,
  StoreCleanup,
  StoreInstance,
  StoreSubscription,
} from './types'

type StoreInstanceController<TState> = {
  store: StoreInstance<TState>
  onDispose(cleanup: StoreCleanup): void
  attachSurface(surface: object): void
}

export function createStoreInstance<TState>(
  initialState: TState,
): StoreInstanceController<TState> {
  const store = createTanStackStore(initialState)
  const cleanups: StoreCleanup[] = []
  let disposePromise: Promise<void> | null = null

  const instance: StoreInstance<TState> = {
    ...store,
    dispose: async () => {
      if (disposePromise) {
        return disposePromise
      }

      disposePromise = (async () => {
        for (const cleanup of [...cleanups].reverse()) {
          await cleanup()
        }
      })()

      return disposePromise
    },
  }

  return {
    store: instance,
    onDispose(cleanup) {
      cleanups.push(cleanup)
    },
    attachSurface(surface) {
      for (const key of Reflect.ownKeys(surface)) {
        if (key in instance) {
          throw new Error(`Store plugin surface collision on "${String(key)}".`)
        }
      }

      Object.defineProperties(
        instance,
        Object.getOwnPropertyDescriptors(surface),
      )
    },
  }
}

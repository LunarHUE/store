import { createStore as createTanStackStore } from '@tanstack/store'

import type {
  SetStateUpdater,
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
    get state() {
      return store.state
    },
    get() {
      return store.get()
    },
    setState(updater: SetStateUpdater<TState>) {
      if (typeof updater === 'function') {
        store.setState(updater as (prev: TState) => TState)
        return
      }

      store.setState(() => updater)
    },
    subscribe(listener: (state: TState) => void): StoreSubscription {
      return store.subscribe(listener)
    },
    async dispose() {
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

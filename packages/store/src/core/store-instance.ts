import {
  createStore as createTanStackStore,
  type Observer,
  type Store as BaseStore,
  type Subscription,
} from '@tanstack/store'

import type {
  StoreCleanup,
  Store,
  StoreLifecycleMeta,
  ReadableStore,
} from './types'

type StoreController<TState> = {
  store: Store<TState>
  onDispose(cleanup: StoreCleanup): void
  attachSurface(surface: object): void
}

type CreateStoreInstanceOptions<TState> = {
  initialState?: TState
  readyOnCreate: boolean
}

const UNINITIALIZED = Symbol('lunarhue.store.uninitialized')

export function createStoreInstance<TState>({
  initialState,
  readyOnCreate,
}: CreateStoreInstanceOptions<TState>): StoreController<TState> {
  const store = createTanStackStore<TState | typeof UNINITIALIZED>(
    readyOnCreate ? (initialState as TState) : UNINITIALIZED,
  )
  const lifecycleMeta = createTanStackStore<StoreLifecycleMeta>({
    status: readyOnCreate ? 'ready' : 'uninitialized',
    error: null,
  })
  const cleanups: StoreCleanup[] = []
  let disposePromise: Promise<void> | null = null

  const nativeStateGetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(store),
    'state',
  )?.get

  if (!nativeStateGetter) {
    throw new Error('Failed to resolve the TanStack Store state getter.')
  }

  const nativeGet = () => nativeStateGetter.call(store)
  const nativeSetState = store.setState.bind(store)
  const nativeSubscribe = store.subscribe.bind(store)
  const instance = store as unknown as Store<TState>

  const assertReady = (value: TState | typeof UNINITIALIZED): TState => {
    if (value === UNINITIALIZED) {
      throw new Error('Store has not been initialized.')
    }

    return value
  }

  const getState = () => assertReady(nativeGet())
  const lifecycle = {
    meta: lifecycleMeta as ReadableStore<StoreLifecycleMeta>,
  }
  const subscribe = ((
    observerOrFn: Observer<TState> | ((value: TState) => void),
    error?: (error: any) => void,
    complete?: () => void,
  ): Subscription => {
    const observer =
      typeof observerOrFn === 'function'
        ? {
            next: observerOrFn,
            error,
            complete,
          }
        : observerOrFn

    return nativeSubscribe((value) => {
      if (value === UNINITIALIZED) {
        return
      }

      observer.next?.(value)
    })
  }) as BaseStore<TState>['subscribe']

  Object.defineProperty(instance, 'dispose', {
    configurable: true,
    enumerable: true,
    value: async () => {
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
  })

  Object.defineProperties(instance, {
    get: {
      configurable: true,
      enumerable: true,
      value: () => getState(),
    },
    state: {
      configurable: true,
      enumerable: true,
      get() {
        return getState()
      },
    },
    setState: {
      configurable: true,
      enumerable: true,
      value: (updater: (prev: TState) => TState) => {
        nativeSetState((prev) => updater(assertReady(prev)))
      },
    },
    subscribe: {
      configurable: true,
      enumerable: true,
      value: subscribe,
    },
    initialize: {
      configurable: true,
      enumerable: true,
      value: async (nextState: TState) => {
        nativeSetState(() => nextState)
        lifecycleMeta.setState(() => ({
          status: 'ready',
          error: null,
        }))
      },
    },
    lifecycle: {
      configurable: true,
      enumerable: true,
      value: lifecycle,
    },
  })

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

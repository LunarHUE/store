import {
    type Store as BaseStore,
    type Observer,
    type Subscription,
    createStore as createTanStackStore,
} from '@tanstack/store'

import {
    createStoreLoggerMetadata,
    createSubscriptionLoggerId,
    defineStoreLoggerMetadata,
    emitStoreDebugEvent,
    transitionStoreLifecycle,
} from './logger'
import type {
    ReadableStore,
    Store,
    StoreCleanup,
    StoreCreateOptions,
    StoreLifecycleMeta,
} from './types'

type StoreController<TState> = {
    store: Store<TState>
    onDispose(cleanup: StoreCleanup): void
    attachSurface(surface: object): void
}

type CreateStoreInstanceOptions<TState> = {
    builderId?: string
    debug?: StoreCreateOptions<TState>['debug']
    hasDeclaredInitialState?: boolean
    hasOverrideInitialState?: boolean
    initialState?: TState
    readyOnCreate: boolean
}

const UNINITIALIZED = Symbol('lunarhue.store.uninitialized')

export function createStoreInstance<TState>({
    builderId = 'b0',
    debug,
    hasDeclaredInitialState,
    hasOverrideInitialState,
    initialState,
    readyOnCreate,
}: CreateStoreInstanceOptions<TState>): StoreController<TState> {
    const store = createTanStackStore<TState | typeof UNINITIALIZED>(
        readyOnCreate ? (initialState as TState) : UNINITIALIZED
    )
    const lifecycleMeta = createTanStackStore<StoreLifecycleMeta>({
        status: readyOnCreate ? 'ready' : 'uninitialized',
        error: null,
    })
    const cleanups: StoreCleanup[] = []
    let disposePromise: Promise<void> | null = null

    const nativeStateGetter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(store),
        'state'
    )?.get

    if (!nativeStateGetter) {
        throw new Error('Failed to resolve the TanStack Store state getter.')
    }

    const nativeGet = () => nativeStateGetter.call(store)
    const nativeSetState = store.setState.bind(store)
    const nativeSubscribe = store.subscribe.bind(store)
    const instance = store as unknown as Store<TState>
    const lifecycleMetaStore =
        lifecycleMeta as WritableReadableStore<StoreLifecycleMeta>

    defineStoreLoggerMetadata(
        instance,
        createStoreLoggerMetadata({
            builderId,
            debug,
        })
    )

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
    const subscribe = (
        observerOrFn: Observer<TState> | ((value: TState) => void),
        error?: (error: any) => void,
        complete?: () => void
    ): Subscription => {
        const subscriptionId = createSubscriptionLoggerId()
        const observer =
            typeof observerOrFn === 'function'
                ? {
                      next: observerOrFn,
                      error,
                      complete,
                  }
                : observerOrFn
        const observerKind =
            typeof observerOrFn === 'function' ? 'function' : 'observer'

        emitStoreDebugEvent(instance, {
            detail: { observerKind },
            event: 'subscription.connected',
            source: 'core',
            subscriptionId,
        })

        const subscription = nativeSubscribe({
            next(value) {
                if (value === UNINITIALIZED) {
                    emitStoreDebugEvent(instance, {
                        event: 'subscription.notify.skipped_uninitialized',
                        minimumLevel: 'trace',
                        source: 'core',
                        subscriptionId,
                    })
                    return
                }

                emitStoreDebugEvent(instance, {
                    event: 'subscription.notify',
                    minimumLevel: 'verbose',
                    nextState: value,
                    source: 'core',
                    subscriptionId,
                })

                try {
                    observer.next?.(value)
                } catch (notifyError) {
                    emitStoreDebugEvent(instance, {
                        error: notifyError,
                        event: 'subscription.notify.error',
                        minimumLevel: 'trace',
                        nextState: value,
                        source: 'core',
                        subscriptionId,
                    })
                    throw notifyError
                }
            },
            error(err) {
                observer.error?.(err)
            },
            complete() {
                observer.complete?.()
            },
        })
        let unsubscribed = false

        return {
            unsubscribe() {
                if (unsubscribed) {
                    return
                }

                unsubscribed = true
                subscription.unsubscribe()
                emitStoreDebugEvent(instance, {
                    event: 'subscription.disconnected',
                    source: 'core',
                    subscriptionId,
                })
            },
        }
    }

    Object.defineProperty(instance, 'dispose', {
        configurable: true,
        enumerable: true,
        value: async () => {
            if (disposePromise) {
                return disposePromise
            }

            emitStoreDebugEvent(instance, {
                event: 'store.dispose.started',
                source: 'core',
            })

            disposePromise = (async () => {
                for (const cleanup of [...cleanups].reverse()) {
                    await cleanup()
                }

                emitStoreDebugEvent(instance, {
                    event: 'store.dispose.completed',
                    source: 'core',
                })
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
                let previousState: TState | undefined
                let nextState: TState | undefined

                try {
                    nativeSetState((prev) => {
                        const readyPreviousState = assertReady(prev)
                        previousState = readyPreviousState
                        nextState = updater(readyPreviousState)

                        return nextState
                    })
                } catch (stateError) {
                    emitStoreDebugEvent(instance, {
                        error: stateError,
                        event: 'store.state.set.error',
                        minimumLevel: 'trace',
                        nextState,
                        previousState,
                        source: 'core',
                    })
                    throw stateError
                }

                emitStoreDebugEvent(instance, {
                    event: 'store.state.set',
                    minimumLevel: 'verbose',
                    nextState,
                    previousState,
                    source: 'core',
                })
            },
        },
        subscribe: {
            configurable: true,
            enumerable: true,
            value: subscribe,
        },
        setInitialState: {
            configurable: true,
            enumerable: true,
            value: async (nextState: TState) => {
                try {
                    if (nativeGet() !== UNINITIALIZED) {
                        throw new Error(
                            'Store initial state has already been set.'
                        )
                    }

                    nativeSetState(() => nextState)
                } catch (initialStateError) {
                    emitStoreDebugEvent(instance, {
                        error: initialStateError,
                        event: 'store.initial_state.set.error',
                        minimumLevel: 'trace',
                        nextState,
                        source: 'core',
                    })
                    throw initialStateError
                }

                emitStoreDebugEvent(instance, {
                    event: 'store.initial_state.set',
                    minimumLevel: 'verbose',
                    nextState,
                    source: 'core',
                })

                transitionStoreLifecycle(
                    instance,
                    lifecycleMetaStore,
                    {
                        status: 'ready',
                        error: null,
                    },
                    {
                        source: 'core',
                    }
                )
            },
        },
        lifecycle: {
            configurable: true,
            enumerable: true,
            value: lifecycle,
        },
    })

    emitStoreDebugEvent(instance, {
        detail: {
            hasDeclaredInitialState: hasDeclaredInitialState ?? false,
            hasOverrideInitialState: hasOverrideInitialState ?? false,
        },
        event: 'store.created',
        source: 'core',
        status: readyOnCreate ? 'ready' : 'uninitialized',
    })

    return {
        store: instance,
        onDispose(cleanup) {
            cleanups.push(cleanup)
        },
        attachSurface(surface) {
            for (const key of Reflect.ownKeys(surface)) {
                if (key in instance) {
                    throw new Error(
                        `Store plugin surface collision on "${String(key)}".`
                    )
                }
            }

            Object.defineProperties(
                instance,
                Object.getOwnPropertyDescriptors(surface)
            )
        },
    }
}

type WritableReadableStore<TState> = ReadableStore<TState> & {
    setState(updater: (prev: TState) => TState): void
}

import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { Store, StoreBuilder, StoreInitialStateLoader } from '../core'
import type { StoreDebugOptions, StoreLifecycleMeta } from '../core'
import { emitStoreDebugEvent, transitionStoreLifecycle } from '../core/logger'

type LocalStoreOptionsBase<TState> = {
    debug?: StoreDebugOptions<TState>
}

type LocalStoreWithInitialStateOptions<TState> =
    LocalStoreOptionsBase<TState> & {
        initialState: TState
        loadInitialState?: never
    }

type LocalStoreWithLoadInitialStateOptions<TState, TPlugins> =
    LocalStoreOptionsBase<TState> & {
        initialState?: never
        loadInitialState: StoreInitialStateLoader<TState, TPlugins>
    }

type LocalStoreDeclaredInitialStateOptions<TState> =
    LocalStoreOptionsBase<TState> & {
        initialState?: never
        loadInitialState?: never
    }

type LocalStoreOptions<TState, TPlugins> =
    | LocalStoreDeclaredInitialStateOptions<TState>
    | LocalStoreWithInitialStateOptions<TState>
    | LocalStoreWithLoadInitialStateOptions<TState, TPlugins>

/**
 * Creates and owns a local runtime store for the current hook call site.
 *
 * The returned store is disposed on unmount. Pass `initialState` to start the
 * local store ready immediately, or `loadInitialState` to initialize a builder
 * that was declared without a default value. Without a declared default or one
 * of those options, the returned runtime store begins uninitialized.
 */
export function useLocalStore<TState, TPlugins>(
    builder: StoreBuilder<TState, TPlugins>,
    options?: LocalStoreOptions<TState, TPlugins>
): Store<TState, TPlugins> {
    const initializeStartedRef = useRef(false)
    const localStoreRef = useRef<Store<TState, TPlugins> | null>(null)
    const [, forceRender] = useState(0)
    const hasInitialState =
        options !== undefined &&
        Object.prototype.hasOwnProperty.call(options, 'initialState')

    if (!localStoreRef.current) {
        localStoreRef.current = builder.create(
            hasInitialState ? (options?.initialState as TState) : undefined,
            { debug: options?.debug }
        )
    }

    const initializeStore = useEffectEvent(async () => {
        const localStore = localStoreRef.current

        if (!localStore || !options?.loadInitialState) {
            return
        }

        emitStoreDebugEvent(localStore, {
            detail: {
                initMode: 'loadInitialState',
                owner: 'local',
            },
            event: 'local.initialize.started',
            source: 'react',
        })
        transitionStoreLifecycle(
            localStore,
            localStore.lifecycle
                .meta as unknown as WritableReadableStore<StoreLifecycleMeta>,
            {
                status: 'initializing',
                error: null,
            },
            {
                source: 'react',
            }
        )

        try {
            const nextState = await options.loadInitialState({
                store: localStore,
            })
            await localStore.setInitialState(nextState)
            emitStoreDebugEvent(localStore, {
                detail: {
                    initMode: 'loadInitialState',
                    owner: 'local',
                },
                event: 'local.initialize.completed',
                source: 'react',
            })
        } catch (error) {
            emitStoreDebugEvent(localStore, {
                detail: {
                    initMode: 'loadInitialState',
                    owner: 'local',
                },
                error,
                event: 'local.initialize.failed',
                source: 'react',
            })
            transitionStoreLifecycle(
                localStore,
                localStore.lifecycle
                    .meta as unknown as WritableReadableStore<StoreLifecycleMeta>,
                {
                    status: 'error',
                    error,
                },
                {
                    source: 'react',
                }
            )
        }
    })

    useEffect(() => {
        const localStore = localStoreRef.current

        if (!localStore) {
            return
        }

        const subscription = localStore.lifecycle.meta.subscribe(() => {
            forceRender((value) => value + 1)
        })

        if (
            localStore &&
            !initializeStartedRef.current &&
            localStore.lifecycle.meta.get().status === 'uninitialized' &&
            options?.loadInitialState
        ) {
            initializeStartedRef.current = true
            void initializeStore()
        }

        return () => {
            subscription.unsubscribe()

            if (!localStore) {
                return
            }

            void localStore.dispose()
        }
    }, [initializeStore, options?.loadInitialState])

    return localStoreRef.current
}

type WritableReadableStore<TState> = {
    get(): TState
    setState(updater: (prev: TState) => TState): void
}

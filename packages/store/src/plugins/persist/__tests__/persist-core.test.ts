import { afterEach, describe, expect, it, vi } from 'vitest'

import { type StoreDebugEvent, createStore } from '../../../core'
import { persist } from '../plugin'
import type {
    InternalPersistedStore,
    PersistPersistArgs,
    PersistedStore,
} from '../types'
import { persistControllerKey } from '../types'

function getPersistController<TState>(
    store: PersistedStore<TState>
): InternalPersistedStore<TState>['persist'][typeof persistControllerKey] {
    return (store as InternalPersistedStore<TState>).persist[
        persistControllerKey
    ]
}

describe('persist core', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('exposes persistence meta without readiness state', () => {
        const builder = createStore({ count: 0 }).extend(persist())
        const store = builder.create()

        expect(store.persist.meta.get()).toEqual({
            pending: false,
            persisting: false,
            lastPersistedAt: null,
            error: null,
        })
        expect('hydrate' in store).toBe(false)
        expect('hydrate' in store.persist).toBe(false)
    })

    it('debounces persistence and flushes the latest state transition', async () => {
        vi.useFakeTimers()

        const onPersist = vi.fn(async () => {})
        const builder = createStore({ count: 0 }).extend(persist())
        const store = builder.create()
        const disconnect = getPersistController(store).connect(store, {
            delay: 50,
            onPersist,
            enabled: true,
        })

        store.setState(() => ({ count: 1 }))
        store.setState(() => ({ count: 2 }))

        await vi.advanceTimersByTimeAsync(50)

        expect(onPersist).toHaveBeenCalledTimes(1)
        expect(onPersist).toHaveBeenCalledWith({
            previousState: { count: 0 },
            nextState: { count: 2 },
        })
        expect(store.persist.meta.get().pending).toBe(false)
        expect(store.persist.meta.get().persisting).toBe(false)

        disconnect()
    })

    it('collapses concurrent flush calls into one in-flight persist', async () => {
        let resolvePersist!: () => void
        const persistPromise = new Promise<void>((resolve) => {
            resolvePersist = resolve
        })
        const onPersist = vi.fn(async () => {
            await persistPromise
        })
        const builder = createStore({ count: 0 }).extend(persist())
        const store = builder.create()

        getPersistController(store).connect(store, {
            onPersist,
            enabled: true,
        })

        store.setState(() => ({ count: 1 }))

        const firstFlush = store.persist.flush()
        const secondFlush = store.persist.flush()

        expect(firstFlush).toBe(secondFlush)
        expect(onPersist).toHaveBeenCalledTimes(1)

        resolvePersist()
        await firstFlush
    })

    it('flushes during dispose when configured', async () => {
        const onPersist = vi.fn(async () => {})
        const builder = createStore({ count: 0 }).extend(
            persist({
                flushOnDispose: true,
            })
        )
        const store = builder.create()

        getPersistController(store).connect(store, {
            onPersist,
            enabled: true,
        })

        store.setState(() => ({ count: 1 }))
        await store.dispose()

        expect(onPersist).toHaveBeenCalledTimes(1)
    })

    it('flushes queued work after the runtime disconnects', async () => {
        const onPersist = vi.fn(async () => {})
        const builder = createStore({ count: 0 }).extend(persist())
        const store = builder.create()
        const disconnect = getPersistController(store).connect(store, {
            onPersist,
            enabled: true,
            delay: 1000,
        })

        store.setState(() => ({ count: 1 }))
        disconnect()

        await store.persist.flush()

        expect(onPersist).toHaveBeenCalledTimes(1)
        expect(onPersist).toHaveBeenCalledWith({
            previousState: { count: 0 },
            nextState: { count: 1 },
        })
    })

    it('captures persistence errors in meta state', async () => {
        const failure = new Error('persist failed')
        const builder = createStore({ count: 0 }).extend(persist())
        const store = builder.create()

        getPersistController(store).connect(store, {
            onPersist: async () => {
                throw failure
            },
            enabled: true,
        })

        store.setState(() => ({ count: 1 }))

        await expect(store.persist.flush()).rejects.toThrow('persist failed')
        expect(store.persist.meta.get().error).toBe(failure)
        expect(store.persist.meta.get().pending).toBe(true)
    })

    it('uses declaration-time onPersist defaults when runtime onPersist is omitted', async () => {
        const onPersist = vi.fn(async () => {})
        const builder = createStore({ count: 0 }).extend(
            persist({
                onPersist,
            })
        )
        const store = builder.create()

        getPersistController(store).connect(store, {})

        store.setState(() => ({ count: 1 }))
        await store.persist.flush()

        expect(onPersist).toHaveBeenCalledTimes(1)
        expect(onPersist).toHaveBeenCalledWith({
            previousState: { count: 0 },
            nextState: { count: 1 },
        })
    })

    it('prefers runtime onPersist over declaration-time defaults', async () => {
        const defaultOnPersist = vi.fn(async () => {})
        const runtimeOnPersist = vi.fn(async () => {})
        const builder = createStore({ count: 0 }).extend(
            persist({
                onPersist: defaultOnPersist,
            })
        )
        const store = builder.create()

        getPersistController(store).connect(store, {
            onPersist: runtimeOnPersist,
        })

        store.setState(() => ({ count: 1 }))
        await store.persist.flush()

        expect(defaultOnPersist).not.toHaveBeenCalled()
        expect(runtimeOnPersist).toHaveBeenCalledTimes(1)
    })

    it('uses declaration-time delay defaults when runtime delay is omitted', async () => {
        vi.useFakeTimers()

        const onPersist = vi.fn(async () => {})
        const builder = createStore({ count: 0 }).extend(
            persist({
                delay: 50,
                onPersist,
            })
        )
        const store = builder.create()

        getPersistController(store).connect(store, {
            onPersist,
        })

        store.setState(() => ({ count: 1 }))

        await vi.advanceTimersByTimeAsync(49)
        expect(onPersist).not.toHaveBeenCalled()

        await vi.advanceTimersByTimeAsync(1)
        expect(onPersist).toHaveBeenCalledTimes(1)
    })

    it('throws when neither declaration nor runtime provides onPersist', () => {
        const builder = createStore({ count: 0 }).extend(persist())
        const store = builder.create()

        expect(() => getPersistController(store).connect(store, {})).toThrow(
            /requires onPersist/
        )
    })

    it('generates a stable fallback key when one is not provided', async () => {
        const onPersist = vi.fn(
            async (_args: PersistPersistArgs<{ count: number }>) => {}
        )
        const builder = createStore({ count: 0 }).extend(persist())
        const store = builder.create()
        const controller = getPersistController(store)

        const disconnect = controller.connect(store, {
            enabled: true,
            onPersist,
        })

        store.setState(() => ({ count: 1 }))
        await store.persist.flush()
        disconnect()

        controller.connect(store, {
            enabled: true,
            onPersist,
        })

        store.setState(() => ({ count: 2 }))
        await store.persist.flush()

        expect(onPersist).toHaveBeenCalledTimes(2)
    })

    it('emits persist runtime events through the store debug sink', async () => {
        vi.useFakeTimers()

        const events: StoreDebugEvent<{ count: number }>[] = []
        const builder = createStore({ count: 0 }).extend(persist())
        const store = builder.create(undefined, {
            debug: {
                console: false,
                level: 'trace',
                sink(event) {
                    events.push(event)
                },
            },
        })
        const disconnect = getPersistController(store).connect(store, {
            delay: 50,
            enabled: true,
            onPersist: async () => {},
        })

        store.setState(() => ({ count: 1 }))
        await vi.advanceTimersByTimeAsync(50)
        disconnect()

        expect(
            events.some((event) => event.event === 'persist.connected')
        ).toBe(true)
        expect(
            events.some((event) => event.event === 'persist.transition.queued')
        ).toBe(true)
        expect(
            events.some((event) => event.event === 'persist.flush.scheduled')
        ).toBe(true)
        expect(
            events.some((event) => event.event === 'persist.flush.started')
        ).toBe(true)
        expect(
            events.some((event) => event.event === 'persist.flush.completed')
        ).toBe(true)
        expect(
            events.some((event) => event.event === 'persist.disconnected')
        ).toBe(true)

        const completedEvent = events.find(
            (event) => event.event === 'persist.flush.completed'
        )

        expect(completedEvent?.previousState).toEqual({ count: 0 })
        expect(completedEvent?.nextState).toEqual({ count: 1 })
    })

    it('emits persist failures through the store debug sink', async () => {
        const failure = new Error('persist failed')
        const events: StoreDebugEvent<{ count: number }>[] = []
        const builder = createStore({ count: 0 }).extend(persist())
        const store = builder.create(undefined, {
            debug: {
                console: false,
                level: 'trace',
                sink(event) {
                    events.push(event)
                },
            },
        })

        getPersistController(store).connect(store, {
            enabled: true,
            onPersist: async () => {
                throw failure
            },
        })

        store.setState(() => ({ count: 1 }))

        await expect(store.persist.flush()).rejects.toThrow('persist failed')
        expect(
            events.some(
                (event) =>
                    event.event === 'persist.flush.failed' &&
                    event.error === failure
            )
        ).toBe(true)
    })
})

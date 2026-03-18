import { afterEach, describe, expect, it, vi } from 'vitest'

import { createStore } from '../../../core'

import { persist } from '../plugin'
import type {
  InternalPersistedStore,
  PersistPersistArgs,
  PersistedStore,
} from '../types'
import { persistControllerKey } from '../types'

function getPersistController<TState>(
  store: PersistedStore<TState>,
): InternalPersistedStore<TState>['persist'][typeof persistControllerKey] {
  return (store as InternalPersistedStore<TState>).persist[persistControllerKey]
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
      key: 'demo',
      delay: 50,
      onPersist,
      enabled: true,
    })

    store.setState(() => ({ count: 1 }))
    store.setState(() => ({ count: 2 }))

    await vi.advanceTimersByTimeAsync(50)

    expect(onPersist).toHaveBeenCalledTimes(1)
    expect(onPersist).toHaveBeenCalledWith({
      key: 'demo',
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
      key: 'flush',
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
      }),
    )
    const store = builder.create()

    getPersistController(store).connect(store, {
      key: 'dispose',
      onPersist,
      enabled: true,
    })

    store.setState(() => ({ count: 1 }))
    await store.dispose()

    expect(onPersist).toHaveBeenCalledTimes(1)
  })

  it('captures persistence errors in meta state', async () => {
    const failure = new Error('persist failed')
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()

    getPersistController(store).connect(store, {
      key: 'errors',
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
      }),
    )
    const store = builder.create()

    getPersistController(store).connect(store, {
      key: 'declared-persist',
    })

    store.setState(() => ({ count: 1 }))
    await store.persist.flush()

    expect(onPersist).toHaveBeenCalledTimes(1)
    expect(onPersist).toHaveBeenCalledWith({
      key: 'declared-persist',
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
      }),
    )
    const store = builder.create()

    getPersistController(store).connect(store, {
      key: 'override-persist',
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
      }),
    )
    const store = builder.create()

    getPersistController(store).connect(store, {
      key: 'declared-delay',
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

    expect(() =>
      getPersistController(store).connect(store, {
        key: 'missing-persist',
      }),
    ).toThrow(/requires onPersist/)
  })

  it('generates a stable fallback key when one is not provided', async () => {
    const onPersist = vi.fn(
      async (_args: PersistPersistArgs<{ count: number }>) => {},
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

    const firstKey = onPersist.mock.calls[0]?.[0]?.key
    const secondKey = onPersist.mock.calls[1]?.[0]?.key

    expect(firstKey).toBeTypeOf('string')
    expect(firstKey).toBe(secondKey)
  })
})

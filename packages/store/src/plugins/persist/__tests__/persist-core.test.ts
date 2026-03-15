import { afterEach, describe, expect, it, vi } from 'vitest'

import { createStore } from '../../../core'

import { createPersistController } from '../controller'
import { persist } from '../plugin'
import { persistControllerKey } from '../types'

describe('persist core', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('hydrates through the top-level and plugin surfaces', async () => {
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()

    await store.hydrate({ count: 2 })
    expect(store.get().count).toBe(2)

    await store.persist.hydrate({ count: 4 })
    expect(store.get().count).toBe(4)
    expect(store.persist.metaStore.get().isHydrated).toBe(true)
  })

  it('debounces persistence and flushes the latest state transition', async () => {
    vi.useFakeTimers()

    const onPersist = vi.fn(async () => {})
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()
    const disconnect = store.persist[persistControllerKey].connect(store, {
      key: 'demo',
      delay: 50,
      onPersist,
      ready: true,
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
    expect(store.persist.metaStore.get().pending).toBe(false)
    expect(store.persist.metaStore.get().persisting).toBe(false)

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

    store.persist[persistControllerKey].connect(store, {
      key: 'flush',
      onPersist,
      ready: true,
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

    store.persist[persistControllerKey].connect(store, {
      key: 'dispose',
      onPersist,
      ready: true,
    })

    store.setState(() => ({ count: 1 }))
    await store.dispose()

    expect(onPersist).toHaveBeenCalledTimes(1)
  })

  it('captures persistence errors in meta state', async () => {
    const failure = new Error('persist failed')
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()

    store.persist[persistControllerKey].connect(store, {
      key: 'errors',
      onPersist: async () => {
        throw failure
      },
      ready: true,
    })

    store.setState(() => ({ count: 1 }))

    await expect(store.persist.flush()).rejects.toThrow('persist failed')
    expect(store.persist.metaStore.get().error).toBe(failure)
    expect(store.persist.metaStore.get().pending).toBe(true)
  })

  it('does not mark pending on hydration', async () => {
    const baseStore = createStore({ count: 0 }).create()
    const controller = createPersistController(baseStore)

    await controller.hydrate({ count: 3 })

    expect(controller.metaStore.get().isHydrated).toBe(true)
    expect(controller.metaStore.get().pending).toBe(false)
    expect(baseStore.get().count).toBe(3)
  })
})

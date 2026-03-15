import { describe, expect, it, vi } from 'vitest'

import { createStore } from '../../src/core'

describe('core store', () => {
  it('reads and writes state', () => {
    const definition = createStore({ count: 0 })
    const store = definition.create()

    store.setState((prev) => ({ count: prev.count + 1 }))

    expect(store.state.count).toBe(1)
    expect(store.get().count).toBe(1)
  })

  it('subscribes to updates', () => {
    const definition = createStore({ count: 0 })
    const store = definition.create()
    const listener = vi.fn()

    const subscription = store.subscribe(listener)

    store.setState({ count: 2 })
    subscription.unsubscribe()
    store.setState({ count: 3 })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({ count: 2 })
  })

  it('extends store instances with plugin surfaces in order', () => {
    const definition = createStore({ count: 0 })
      .extend(() => ({ first: 'first' as const }))
      .extend(({ store }) => ({
        second: `${store.first}-second` as const,
      }))

    const store = definition.create()

    expect(store.first).toBe('first')
    expect(store.second).toBe('first-second')
  })

  it('runs dispose handlers in reverse registration order and only once', async () => {
    const calls: string[] = []

    const definition = createStore({ count: 0 })
      .extend(({ onDispose }) => {
        onDispose(() => {
          calls.push('first')
        })
        return {}
      })
      .extend(({ onDispose }) => {
        onDispose(() => {
          calls.push('second')
        })
        return {}
      })

    const store = definition.create()

    await store.dispose()
    await store.dispose()

    expect(calls).toEqual(['second', 'first'])
  })
})

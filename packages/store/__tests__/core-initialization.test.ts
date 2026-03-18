import { describe, expect, it } from 'vitest'

import { createStore } from '../src/core'

type CounterState = { count: number }

describe('core store initialization', () => {
  it('creates an uninitialized store when no default state or override is provided', () => {
    const builder = createStore<CounterState>()
    const store = builder.create()

    expect(store.lifecycle.meta.get().status).toBe('uninitialized')
    expect(() => store.get()).toThrow('Store has not been initialized.')
    expect(() => store.setState((prev) => ({ count: prev.count + 1 }))).toThrow(
      'Store has not been initialized.',
    )
  })

  it('becomes ready after initialize is called', async () => {
    const builder = createStore<CounterState>()
    const store = builder.create()

    await store.initialize({ count: 3 })

    expect(store.lifecycle.meta.get().status).toBe('ready')
    expect(store.get()).toEqual({ count: 3 })
  })

  it('starts ready when the builder declares a default state', () => {
    const store = createStore({ count: 0 }).create()

    expect(store.lifecycle.meta.get().status).toBe('ready')
    expect(store.get().count).toBe(0)
  })

  it('starts ready when create receives an override state', () => {
    const builder = createStore<CounterState>()
    const store = builder.create({ count: 42 })

    expect(store.lifecycle.meta.get().status).toBe('ready')
    expect(store.get().count).toBe(42)
  })

  it('does not notify subscribers until the store has a real state', async () => {
    const builder = createStore<CounterState>()
    const store = builder.create()
    const seen: CounterState[] = []

    const subscription = store.subscribe((value) => {
      seen.push(value)
    })

    await store.initialize({ count: 7 })
    subscription.unsubscribe()

    expect(seen).toEqual([{ count: 7 }])
  })
})

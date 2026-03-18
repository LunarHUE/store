import { describe, expect, it } from 'vitest'
import { createStore } from '../create-store'

describe('createStore — initialState override', () => {
  it('creates a store seeded with the override state', () => {
    const builder = createStore({ count: 0 })
    const store = builder.create({ count: 42 })
    expect(store.get().count).toBe(42)
  })

  it('falls back to the builder default when no override is provided', () => {
    const builder = createStore({ count: 0 })
    const store = builder.create()
    expect(store.get().count).toBe(0)
  })

  it('does not affect the builder default for future create calls', () => {
    const builder = createStore({ count: 0 })
    builder.create({ count: 99 })
    const store2 = builder.create()
    expect(store2.get().count).toBe(0)
  })
})

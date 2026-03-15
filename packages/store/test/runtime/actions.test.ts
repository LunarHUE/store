import { describe, expect, it } from 'vitest'

import { createStore } from '../../src/core'
import { actions } from '../../src/plugins/actions'

describe('actions plugin', () => {
  it('attaches typed actions outside state', () => {
    const builder = createStore({ count: 0 }).extend(
      actions(({ getState, setState }) => ({
        increment() {
          const current = getState().count
          setState(() => ({ count: current + 1 }))
        },
      })),
    )

    const store = builder.create()

    store.actions.increment()

    expect(store.get().count).toBe(1)
  })

  it('allows actions to preserve object identity for no-op updates', () => {
    const initialState = { value: 'same' }
    const builder = createStore(initialState).extend(
      actions(({ setState }) => ({
        setValue(value: string) {
          setState((prev) => (prev.value === value ? prev : { value }))
        },
      })),
    )

    const store = builder.create()
    const previous = store.get()

    store.actions.setValue('same')

    expect(store.get()).toBe(previous)
  })
})

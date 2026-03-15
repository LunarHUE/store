import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createStore } from '../../src/core'
import { createStoreContext, useSelector, useStore } from '../../src/react'

describe('react bindings', () => {
  it('reads a provider-scoped store instance', () => {
    const builder = createStore({ count: 0 })
    const store = builder.create()
    const StoreContext = createStoreContext(builder)

    function Probe() {
      const scopedStore = useStore(builder)
      return <span>{scopedStore.get().count}</span>
    }

    render(
      <StoreContext.Provider value={store}>
        <Probe />
      </StoreContext.Provider>,
    )

    expect(screen.getByText('0')).toBeTruthy()
  })

  it('creates a local store instance when no provider exists', () => {
    const builder = createStore({ count: 3 })

    function Probe() {
      const localStore = useStore(builder)
      return <span>{localStore.get().count}</span>
    }

    render(<Probe />)

    expect(screen.getByText('3')).toBeTruthy()
  })

  it('subscribes to selector updates', () => {
    const builder = createStore({ count: 0 })
    const store = builder.create()

    function Probe() {
      const count = useSelector(store, (state) => state.count)
      return <span>{count}</span>
    }

    render(<Probe />)

    act(() => {
      store.setState((prev) => ({ count: prev.count + 1 }))
    })

    expect(screen.getByText('1')).toBeTruthy()
  })
})

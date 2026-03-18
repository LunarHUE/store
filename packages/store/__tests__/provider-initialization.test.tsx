import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createStore } from '../src/core'
import { StoreProvider, useLocalStore, useStore } from '../src/react'

type CounterState = { count: number }

describe('StoreProvider initialization', () => {
  afterEach(() => {
    cleanup()
  })

  it('runs initialize once when no initialState is provided', async () => {
    const builder = createStore<CounterState>()
    let resolveInitialize!: () => void
    const initializeGate = new Promise<void>((resolve) => {
      resolveInitialize = resolve
    })
    const initialize = vi.fn(
      async ({ store }: { store: ReturnType<typeof builder.create> }) => {
        await initializeGate
        await store.initialize({ count: 5 })
      },
    )

    function Probe() {
      const store = useStore(builder)
      return <span>{store.get().count}</span>
    }

    render(
      <StoreProvider builder={builder} initialize={initialize}>
        <Probe />
      </StoreProvider>,
    )

    expect(screen.queryByText('5')).toBeNull()
    expect(initialize).toHaveBeenCalledTimes(1)

    resolveInitialize()

    await waitFor(() => {
      expect(screen.getByText('5')).toBeTruthy()
    })
  })

  it('skips initialize when initialState is provided', () => {
    const builder = createStore<CounterState>()
    const initialize = vi.fn(
      async ({ store }: { store: ReturnType<typeof builder.create> }) => {
        await store.initialize({ count: 8 })
      },
    )

    function Probe() {
      const store = useStore(builder)
      return <span>{store.get().count}</span>
    }

    render(
      <StoreProvider
        builder={builder}
        initialState={{ count: 2 }}
        initialize={initialize}
      >
        <Probe />
      </StoreProvider>,
    )

    expect(screen.getByText('2')).toBeTruthy()
    expect(initialize).not.toHaveBeenCalled()
  })

  it('throws when an uninitialized builder has no initialState or initialize callback', () => {
    const builder = createStore<CounterState>()

    function Probe() {
      useStore(builder)
      return null
    }

    expect(() =>
      render(
        <StoreProvider builder={builder}>
          <Probe />
        </StoreProvider>,
      ),
    ).toThrow(
      'StoreProvider requires initialState or initialize when the builder has no declared initial state.',
    )
  })
})

describe('useLocalStore initialization', () => {
  afterEach(() => {
    cleanup()
  })

  it('supports local initialization for builders without defaults', () => {
    const builder = createStore<CounterState>()

    function Probe() {
      const store = useLocalStore(builder, {
        initialState: { count: 11 },
      })

      return <span>{store.get().count}</span>
    }

    render(<Probe />)

    expect(screen.getByText('11')).toBeTruthy()
  })
})

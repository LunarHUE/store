// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createStore } from '../src/core'
import {
  StoreProvider,
  useLocalStore,
  useSelector,
  useStore,
} from '../src/react'

type CounterState = { count: number }

describe('StoreProvider initialization', () => {
  afterEach(() => {
    cleanup()
  })

  it('runs loadInitialState once when no initialState is provided', async () => {
    const builder = createStore<CounterState>()
    let resolveLoad!: () => void
    const loadGate = new Promise<void>((resolve) => {
      resolveLoad = resolve
    })
    const loadInitialState = vi.fn(
      async ({ store }: { store: ReturnType<typeof builder.create> }) => {
        expect(store.lifecycle.meta.get().status).toBe('initializing')
        await loadGate
        return { count: 5 }
      }
    )

    function Probe() {
      const store = useStore(builder)
      return <span>{store.get().count}</span>
    }

    render(
      <StoreProvider builder={builder} loadInitialState={loadInitialState}>
        <Probe />
      </StoreProvider>
    )

    expect(screen.queryByText('5')).toBeNull()
    expect(loadInitialState).toHaveBeenCalledTimes(1)

    resolveLoad()

    await waitFor(() => {
      expect(screen.getByText('5')).toBeTruthy()
    })
  })

  it('starts ready when initialState is provided', () => {
    const builder = createStore<CounterState>()

    function Probe() {
      const store = useStore(builder)
      return <span>{store.get().count}</span>
    }

    render(
      <StoreProvider builder={builder} initialState={{ count: 2 }}>
        <Probe />
      </StoreProvider>
    )

    expect(screen.getByText('2')).toBeTruthy()
  })

  it('throws when an uninitialized builder has no initialState or loadInitialState callback', () => {
    const builder = createStore<CounterState>()

    function Probe() {
      useStore(builder)
      return null
    }

    expect(() =>
      render(
        <StoreProvider builder={builder}>
          <Probe />
        </StoreProvider>
      )
    ).toThrow(
      'StoreProvider requires initialState or loadInitialState when the builder has no declared initial state.'
    )
  })
})

describe('useLocalStore initialization', () => {
  afterEach(() => {
    cleanup()
  })

  it('supports local initial state loading for builders without defaults', async () => {
    const builder = createStore<CounterState>()
    const loadInitialState = vi.fn(async () => ({ count: 11 }))

    function Probe() {
      const store = useLocalStore(builder, {
        loadInitialState,
      })
      const status = useSelector(store.lifecycle.meta, (meta) => meta.status)

      if (status !== 'ready') {
        return <span>{status}</span>
      }

      return <span>{store.get().count}</span>
    }

    render(<Probe />)

    await waitFor(() => {
      expect(screen.getByText('11')).toBeTruthy()
    })
    expect(loadInitialState).toHaveBeenCalledTimes(1)
  })
})

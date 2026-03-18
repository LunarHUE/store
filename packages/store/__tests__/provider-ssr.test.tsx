import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'

import { createStore } from '../src/core'
import { StoreProvider, useStore } from '../src/react'

describe('StoreProvider — initialState wiring', () => {
  afterEach(() => {
    cleanup()
  })

  it('seeds the store with server-provided initialState', () => {
    const builder = createStore({ count: 0 })

    function Probe() {
      const store = useStore(builder)
      return <div>{store.get().count}</div>
    }

    render(
      <StoreProvider builder={builder} initialState={{ count: 42 }}>
        <Probe />
      </StoreProvider>,
    )

    expect(screen.getByText('42')).toBeTruthy()
  })

  it('falls back to the builder default when initialState is not provided', () => {
    const builder = createStore({ count: 0 })

    function Probe() {
      const store = useStore(builder)
      return <div>{store.get().count}</div>
    }

    render(
      <StoreProvider builder={builder}>
        <Probe />
      </StoreProvider>,
    )

    expect(screen.getByText('0')).toBeTruthy()
  })

  it('ignores initialState changes after the store is created', () => {
    const builder = createStore({ count: 0 })

    function Probe() {
      const store = useStore(builder)
      return <div>{store.get().count}</div>
    }

    const { rerender } = render(
      <StoreProvider builder={builder} initialState={{ count: 42 }}>
        <Probe />
      </StoreProvider>,
    )

    rerender(
      <StoreProvider builder={builder} initialState={{ count: 99 }}>
        <Probe />
      </StoreProvider>,
    )

    // Still 42 — the store was already created with the first value
    expect(screen.getByText('42')).toBeTruthy()
  })
})

describe('StoreProvider — SSR', () => {
  it('renders initialState into the server HTML string', () => {
    const builder = createStore({ count: 0 })

    function Probe() {
      const store = useStore(builder)
      return <div>{store.get().count}</div>
    }

    const html = renderToString(
      <StoreProvider builder={builder} initialState={{ count: 42 }}>
        <Probe />
      </StoreProvider>,
    )

    expect(html).toContain('42')
  })
})

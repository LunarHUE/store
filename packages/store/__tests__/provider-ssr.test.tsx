import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'

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
  afterEach(() => {
    cleanup()
  })

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

  it('does not run initialize during server render when initialState is omitted', () => {
    const builder = createStore<{ count: number }>()
    const initialize = vi.fn(async () => {})

    renderToString(
      <StoreProvider builder={builder} initialize={initialize}>
        <div>probe</div>
      </StoreProvider>,
    )

    expect(initialize).not.toHaveBeenCalled()
  })

  it('hydrates without a mismatch when initialState matches server render', async () => {
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

    const container = document.createElement('div')
    container.innerHTML = html

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await act(async () => {
      hydrateRoot(
        container,
        <StoreProvider builder={builder} initialState={{ count: 42 }}>
          <Probe />
        </StoreProvider>,
      )
    })

    expect(container.textContent).toContain('42')
    // React logs hydration mismatches via console.error
    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})

import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'

import { createStore } from '../src/core'
import { useStoreSelector } from '../src/react'
import { persist } from '../src/plugins/persist/plugin'
import { PersistStoreProvider } from '../src/plugins/persist/react'

describe('PersistStoreProvider — initialState wiring', () => {
  afterEach(() => {
    cleanup()
  })

  it('seeds the store with server-provided initialState before the first render', () => {
    const builder = createStore({ count: 0 }).extend(persist())

    function Probe() {
      const count = useStoreSelector(builder, (state) => state.count)
      return <div>{count}</div>
    }

    render(
      <PersistStoreProvider
        builder={builder}
        initialState={{ count: 42 }}
        persist={{
          onPersist: async () => {},
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    expect(screen.getByText('42')).toBeTruthy()
  })

  it('falls back to the builder default when initialState is not provided', () => {
    const builder = createStore({ count: 0 }).extend(persist())

    function Probe() {
      const count = useStoreSelector(builder, (state) => state.count)
      return <div>{count}</div>
    }

    render(
      <PersistStoreProvider
        builder={builder}
        persist={{
          onPersist: async () => {},
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    expect(screen.getByText('0')).toBeTruthy()
  })

  it('loads initial state through the provider when the builder has no default state', async () => {
    const builder = createStore<{ count: number }>().extend(
      persist({
        onPersist: async () => {},
      }),
    )

    function Probe() {
      const count = useStoreSelector(builder, (state) => state.count)
      return <div>{count}</div>
    }

    render(
      <PersistStoreProvider
        builder={builder}
        loadInitialState={async ({ store }) => {
          expect(store.lifecycle.meta.get().status).toBe('initializing')
          return { count: 42 }
        }}
        persist={{}}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    expect(await screen.findByText('42')).toBeTruthy()
  })
})

describe('PersistStoreProvider — SSR', () => {
  afterEach(() => {
    cleanup()
  })

  it('does not access browser APIs during renderToString', () => {
    const builder = createStore({ count: 0 }).extend(persist())

    function Probe() {
      const count = useStoreSelector(builder, (state) => state.count)
      return <div>{count}</div>
    }

    expect(() =>
      renderToString(
        <PersistStoreProvider
          builder={builder}
          initialState={{ count: 42 }}
          persist={{
            onPersist: async () => {},
          }}
        >
          <Probe />
        </PersistStoreProvider>,
      ),
    ).not.toThrow()
  })

  it('does not run loadInitialState during server render when initialState is omitted', () => {
    const builder = createStore<{ count: number }>().extend(
      persist({
        onPersist: async () => {},
      }),
    )
    const loadInitialState = vi.fn(async () => ({ count: 1 }))

    renderToString(
      <PersistStoreProvider
        builder={builder}
        loadInitialState={loadInitialState}
        persist={{}}
      >
        <div>probe</div>
      </PersistStoreProvider>,
    )

    expect(loadInitialState).not.toHaveBeenCalled()
  })

  it('renders initialState into the server HTML string', () => {
    const builder = createStore({ count: 0 }).extend(persist())

    function Probe() {
      const count = useStoreSelector(builder, (state) => state.count)
      return <div>{count}</div>
    }

    const html = renderToString(
      <PersistStoreProvider
        builder={builder}
        initialState={{ count: 42 }}
        persist={{
          onPersist: async () => {},
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    expect(html).toContain('42')
  })

  it('hydrates without a mismatch when initialState matches server render', async () => {
    const builder = createStore({ count: 0 }).extend(persist())

    function Probe() {
      const count = useStoreSelector(builder, (state) => state.count)
      return <div>{count}</div>
    }

    const html = renderToString(
      <PersistStoreProvider
        builder={builder}
        initialState={{ count: 42 }}
        persist={{
          onPersist: async () => {},
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    const container = document.createElement('div')
    container.innerHTML = html

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await act(async () => {
      hydrateRoot(
        container,
        <PersistStoreProvider
          builder={builder}
          initialState={{ count: 42 }}
          persist={{
            onPersist: async () => {},
          }}
        >
          <Probe />
        </PersistStoreProvider>,
      )
    })

    expect(container.textContent).toContain('42')
    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})

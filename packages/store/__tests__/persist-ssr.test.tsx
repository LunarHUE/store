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
          key: 'test-initial-state',
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
          key: 'test-fallback',
          onPersist: async () => {},
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    expect(screen.getByText('0')).toBeTruthy()
  })

  it('initializes through the provider when the builder has no default state', async () => {
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
        initialize={async ({ store }) => {
          await store.initialize({ count: 42 })
        }}
        persist={{
          key: 'test-provider-initialize',
        }}
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
            key: 'test-ssr-browser',
            onPersist: async () => {},
          }}
        >
          <Probe />
        </PersistStoreProvider>,
      ),
    ).not.toThrow()
  })

  it('does not run initialize during server render when initialState is omitted', () => {
    const builder = createStore<{ count: number }>().extend(
      persist({
        onPersist: async () => {},
      }),
    )
    const initialize = vi.fn(async () => {})

    renderToString(
      <PersistStoreProvider
        builder={builder}
        initialize={initialize}
        persist={{
          key: 'test-ssr-initialize',
        }}
      >
        <div>probe</div>
      </PersistStoreProvider>,
    )

    expect(initialize).not.toHaveBeenCalled()
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
          key: 'test-ssr-html',
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
          key: 'test-ssr-hydrate',
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
            key: 'test-ssr-hydrate',
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

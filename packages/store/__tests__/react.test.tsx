// @vitest-environment jsdom

import { act, cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createStore,
  type StoreDebugEvent,
  type StorePlugin,
} from '../src/core'
import {
  StoreProvider,
  useLocalStore,
  useSelector,
  useStore,
  useStoreSelector,
} from '../src/react'

describe('react bindings', () => {
  afterEach(() => {
    cleanup()
  })

  it('reads a builder-owned provider-scoped store instance', () => {
    const builder = createStore({ count: 0 })

    function Probe() {
      const scopedStore = useStore(builder)
      return <span>{scopedStore.get().count}</span>
    }

    render(
      <StoreProvider builder={builder}>
        <Probe />
      </StoreProvider>,
    )

    expect(screen.getByText('0')).toBeTruthy()
  })

  it('passes a builder-owned store to render-prop children', () => {
    const builder = createStore({ count: 2 })

    render(
      <StoreProvider builder={builder}>
        {({ store }) => <span>{store.get().count}</span>}
      </StoreProvider>,
    )

    expect(screen.getByText('2')).toBeTruthy()
  })

  it('reads an externally provided store instance', () => {
    const builder = createStore({ count: 4 })
    const store = builder.create()

    function Probe() {
      const scopedStore = useStore(builder)
      return <span>{scopedStore.get().count}</span>
    }

    render(
      <StoreProvider store={store}>
        <Probe />
      </StoreProvider>,
    )

    expect(screen.getByText('4')).toBeTruthy()
  })

  it('passes an external store to render-prop children', () => {
    const builder = createStore({ count: 7 })
    const store = builder.create()

    render(
      <StoreProvider store={store}>
        {({ store: scopedStore }) => <span>{scopedStore.get().count}</span>}
      </StoreProvider>,
    )

    expect(screen.getByText('7')).toBeTruthy()
  })

  it('fails loudly when no matching provider exists', () => {
    const builder = createStore({ count: 3 })

    function Probe() {
      useStore(builder)
      return null
    }

    expect(() => render(<Probe />)).toThrow(
      /useStore\(builder\) requires a matching/,
    )
  })

  it('creates a local store instance explicitly', () => {
    const builder = createStore({ count: 3 })

    function Probe() {
      const localStore = useLocalStore(builder)
      return <span>{localStore.get().count}</span>
    }

    const view = render(<Probe />)

    expect(screen.getByText('3')).toBeTruthy()
  })

  it('subscribes to selector updates from a store instance', () => {
    const builder = createStore({ count: 0 })
    const store = builder.create()

    function Probe() {
      const count = useSelector(store, (state) => state.count)
      return <span>{count}</span>
    }

    const view = render(<Probe />)

    act(() => {
      store.setState((prev) => ({ count: prev.count + 1 }))
    })

    expect(within(view.container).getByText('1')).toBeTruthy()
  })

  it('subscribes to selector updates from a provider-scoped builder', () => {
    const builder = createStore({ count: 0 })
    const store = builder.create()

    function Probe() {
      const count = useStoreSelector(builder, (state) => state.count)
      return <span>{count}</span>
    }

    const view = render(
      <StoreProvider store={store}>
        <Probe />
      </StoreProvider>,
    )

    act(() => {
      store.setState((prev) => ({ count: prev.count + 1 }))
    })

    expect(within(view.container).getByText('1')).toBeTruthy()
  })

  it('disposes builder-owned stores on unmount but not external stores', () => {
    const ownedCleanupSpy = vi.fn()
    const externalCleanupSpy = vi.fn()
    const createCleanupPlugin = (
      cleanupSpy: () => void,
    ): StorePlugin<{ count: number }, any, {}> => {
      return ({ onDispose }) => {
        onDispose(() => {
          cleanupSpy()
        })

        return {}
      }
    }

    const ownedBuilder = createStore({ count: 0 }).extend(
      createCleanupPlugin(ownedCleanupSpy),
    )
    const externalBuilder = createStore({ count: 0 }).extend(
      createCleanupPlugin(externalCleanupSpy),
    )
    const externalStore = externalBuilder.create()

    const ownedView = render(
      <StoreProvider builder={ownedBuilder}>
        <span>owned</span>
      </StoreProvider>,
    )
    const externalView = render(
      <StoreProvider store={externalStore}>
        <span>external</span>
      </StoreProvider>,
    )

    ownedView.unmount()
    externalView.unmount()

    expect(ownedCleanupSpy).toHaveBeenCalledTimes(1)
    expect(externalCleanupSpy).not.toHaveBeenCalled()
  })

  it('forwards debug config through builder-owned providers', async () => {
    const builder = createStore<{ count: number }>()
    const events: StoreDebugEvent<{ count: number }>[] = []

    render(
      <StoreProvider
        builder={builder}
        debug={{
          console: false,
          level: 'verbose',
          sink(event) {
            events.push(event)
          },
        }}
        loadInitialState={async () => ({ count: 8 })}
      >
        {({ store }) => <span>{store.get().count}</span>}
      </StoreProvider>,
    )

    await screen.findByText('8')

    expect(events.some((event) => event.event === 'provider.mount')).toBe(true)
    expect(
      events.some((event) => event.event === 'provider.initialize.started'),
    ).toBe(true)
    expect(
      events.some((event) => event.event === 'provider.initialize.completed'),
    ).toBe(true)
    expect(
      events.some((event) => event.event === 'store.lifecycle.changed'),
    ).toBe(true)
  })

  it('forwards debug config through local stores', async () => {
    const builder = createStore<{ count: number }>()
    const events: StoreDebugEvent<{ count: number }>[] = []

    function Probe() {
      const localStore = useLocalStore(builder, {
        debug: {
          console: false,
          level: 'verbose',
          sink(event) {
            events.push(event)
          },
        },
        loadInitialState: async () => ({ count: 5 }),
      })

      if (localStore.lifecycle.meta.get().status !== 'ready') {
        return <span>loading</span>
      }

      return <span>{localStore.get().count}</span>
    }

    render(<Probe />)

    await screen.findByText('5')

    expect(
      events.some((event) => event.event === 'local.initialize.started'),
    ).toBe(true)
    expect(
      events.some((event) => event.event === 'local.initialize.completed'),
    ).toBe(true)
    expect(
      events.some((event) => event.event === 'store.lifecycle.changed'),
    ).toBe(true)
  })
})

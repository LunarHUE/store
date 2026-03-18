import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createStore } from '../../../core'
import { useSelector, useStore, useStoreSelector } from '../../../react'

import { persist } from '../plugin'
import type { PersistPersistArgs } from '../types'
import { PersistStoreProvider, usePersistentStore } from '../react'

describe('persist react bindings', () => {
  afterEach(() => {
    cleanup()
  })

  it('composes PersistStoreProvider with core initialization', async () => {
    const onPersist = vi.fn(async () => {})
    const builder = createStore<{ count: number }>().extend(
      persist({
        onPersist,
      }),
    )

    function Probe() {
      const store = useStore(builder)
      const count = useStoreSelector(builder, (state) => state.count)
      const pending = useSelector(store.persist.meta, (meta) => meta.pending)

      return (
        <span>
          {count}:{pending ? 'pending' : 'idle'}
        </span>
      )
    }

    render(
      <PersistStoreProvider
        builder={builder}
        loadInitialState={async ({ store }) => {
          expect(store.lifecycle.meta.get().status).toBe('initializing')
          return { count: 4 }
        }}
        persist={{
          key: 'provider-builder',
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('4:idle')).toBeTruthy()
    })
  })

  it('supports render-prop children with external stores', () => {
    const builder = createStore({ count: 0 }).extend(
      persist({
        onPersist: async () => {},
      }),
    )
    const store = builder.create()

    function Probe() {
      const { store } = usePersistentStore(builder)
      const persistMeta = useSelector(store.persist.meta, (meta) => meta)
      const count = useSelector(store, (state) => state.count)

      return <span>{`${persistMeta.pending ? 'pending' : 'idle'}:${count}`}</span>
    }

    render(
      <PersistStoreProvider store={store} persist={{ key: 'provider-store' }}>
        <Probe />
      </PersistStoreProvider>,
    )

    expect(screen.getByText('idle:0')).toBeTruthy()
  })

  it('flushes pending work on unmount through PersistStoreProvider', async () => {
    const onPersist = vi.fn(async () => {})
    const builder = createStore({ count: 0 }).extend(persist())
    let runtimeStore!: ReturnType<typeof builder.create>

    const view = render(
      <PersistStoreProvider
        builder={builder}
        flushOnUnmount
        persist={{
          key: 'provider-unmount',
          enabled: true,
          delay: 1000,
          onPersist,
        }}
      >
        {({ store }) => {
          runtimeStore = store
          return <span>mounted</span>
        }}
      </PersistStoreProvider>,
    )

    act(() => {
      runtimeStore.setState(() => ({ count: 1 }))
    })

    view.unmount()

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
    })
  })

  it('flushes pending work on pagehide through PersistStoreProvider', async () => {
    const onPersist = vi.fn(async () => {})
    const builder = createStore({ count: 0 }).extend(persist())
    let runtimeStore!: ReturnType<typeof builder.create>

    render(
      <PersistStoreProvider
        builder={builder}
        flushOnPageHide
        persist={{
          key: 'provider-pagehide',
          enabled: true,
          delay: 1000,
          onPersist,
        }}
      >
        {({ store }) => {
          runtimeStore = store
          return <span>mounted</span>
        }}
      </PersistStoreProvider>,
    )

    act(() => {
      runtimeStore.setState(() => ({ count: 1 }))
    })

    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
    })
  })

  it('exposes persistence meta through usePersistentStore', () => {
    const builder = createStore({ count: 2 }).extend(persist())
    const store = builder.create()

    function Probe() {
      const persistMeta = useSelector(store.persist.meta, (meta) => meta)
      const persistentStore = usePersistentStore(builder)

      return (
        <span>
          {persistMeta.pending ? 'pending' : 'idle'}:
          {persistentStore.store.get().count}
        </span>
      )
    }

    render(
      <PersistStoreProvider
        store={store}
        persist={{
          key: 'demo',
          onPersist: async () => {},
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    expect(screen.getByText('idle:2')).toBeTruthy()
  })

  it('uses declaration-time persist defaults through usePersistentStore', async () => {
    const onPersist = vi.fn(async () => {})
    const builder = createStore({ count: 0 }).extend(
      persist({
        onPersist,
      }),
    )
    const store = builder.create()

    function Probe() {
      const { store } = usePersistentStore(builder)
      const count = useSelector(store, (state) => state.count)

      return <span>{count}</span>
    }

    render(
      <PersistStoreProvider
        store={store}
        persist={{ key: 'declared-defaults' }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    expect(screen.getByText('0')).toBeTruthy()

    act(() => {
      store.setState(() => ({ count: 3 }))
    })

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
    })
  })

  it('prefers runtime persist callbacks over declaration defaults through usePersistentStore', async () => {
    const defaultOnPersist = vi.fn(async () => {})
    const runtimeOnPersist = vi.fn(
      async (_args: PersistPersistArgs<{ count: number }>) => {},
    )
    const builder = createStore({ count: 0 }).extend(
      persist({
        onPersist: defaultOnPersist,
      }),
    )
    const store = builder.create()

    function Probe() {
      const { store } = usePersistentStore(builder)
      const count = useSelector(store, (state) => state.count)

      return <span>{count}</span>
    }

    render(
      <PersistStoreProvider
        store={store}
        persist={{
          key: 'runtime-overrides',
          onPersist: runtimeOnPersist,
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    act(() => {
      store.setState(() => ({ count: 4 }))
    })

    await waitFor(() => {
      expect(runtimeOnPersist).toHaveBeenCalledTimes(1)
    })

    expect(defaultOnPersist).not.toHaveBeenCalled()
  })

  it('treats flushOnBackground as a web no-op', () => {
    const builder = createStore({ count: 0 }).extend(persist())

    render(
      <PersistStoreProvider
        builder={builder}
        flushOnBackground
        persist={{
          key: 'background-noop',
          onPersist: async () => {},
        }}
      >
        <span>mounted</span>
      </PersistStoreProvider>,
    )

    expect(screen.getByText('mounted')).toBeTruthy()
  })

  it('passes the resolved key to runtime callbacks when the key is omitted', async () => {
    const onPersist = vi.fn(
      async (_args: PersistPersistArgs<{ count: number }>) => {},
    )
    const builder = createStore({ count: 0 }).extend(persist())
    let runtimeStore!: ReturnType<typeof builder.create>

    render(
      <PersistStoreProvider
        builder={builder}
        persist={{
          onPersist,
        }}
      >
        {({ store }) => {
          runtimeStore = store
          return <span>mounted</span>
        }}
      </PersistStoreProvider>,
    )

    act(() => {
      runtimeStore.setState(() => ({ count: 1 }))
    })

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
    })

    const persistKey = onPersist.mock.calls[0]?.[0]?.key

    expect(persistKey).toBeTypeOf('string')
  })

  it('fails loudly when usePersistentStore is used outside PersistStoreProvider', () => {
    const builder = createStore({ count: 0 }).extend(
      persist({
        onPersist: async () => {},
      }),
    )

    function Probe() {
      usePersistentStore(builder)
      return null
    }

    expect(() => render(<Probe />)).toThrow(
      'usePersistentStore(builder) requires a matching <PersistStoreProvider builder={...}> or <PersistStoreProvider store={...}> ancestor.',
    )
  })
})

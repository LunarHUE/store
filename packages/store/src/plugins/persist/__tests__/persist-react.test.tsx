import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createStore } from '../../../core'
import { useStoreSelector } from '../../../react'

import { persist } from '../plugin'
import type {
  PersistHydrateArgs,
  PersistPersistArgs,
} from '../types'
import {
  PersistStoreProvider,
  PersistenceBoundary,
  usePersistentStore,
  usePersistSelector,
} from '../react'

describe('persist react bindings', () => {
  it('provides a builder-owned persisted store and connects persistence', async () => {
    const onPersist = vi.fn(async () => {})
    const builder = createStore({ count: 0 }).extend(
      persist({
        onPersist,
      }),
    )

    function Probe() {
      const count = useStoreSelector(builder, (state) => state.count)
      const pending = usePersistSelector(builder, (meta) => meta.pending)

      return <span>{count}:{pending ? 'pending' : 'idle'}</span>
    }

    render(
      <PersistStoreProvider
        builder={builder}
        persist={{
          key: 'provider-builder',
          hydrate: async ({ store }) => {
            await store.hydrate({ count: 2 })
          },
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('2:idle')).toBeTruthy()
    })
  })

  it('supports render-prop children with external stores', async () => {
    const builder = createStore({ count: 0 }).extend(
      persist({
        onPersist: async () => {},
      }),
    )
    const store = builder.create()

    render(
      <PersistStoreProvider
        store={store}
        persist={{
          key: 'provider-store',
          hydrate: async ({ store: runtimeStore }) => {
            await runtimeStore.hydrate({ count: 4 })
          },
        }}
      >
        {({ store: scopedStore, isHydrated }) => (
          <span>
            {String(isHydrated)}:{scopedStore.get().count}
          </span>
        )}
      </PersistStoreProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('true:4')).toBeTruthy()
    })
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

  it('hydrates through usePersistentStore and exposes meta', async () => {
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()
    const onPersist = vi.fn(async () => {})

    function Probe() {
      const persistentStore = usePersistentStore(builder)

      return (
        <span>
          {String(persistentStore.isHydrated)}:
          {persistentStore.meta.pending ? 'pending' : 'idle'}:
          {persistentStore.store.get().count}
        </span>
      )
    }

    render(
      <PersistStoreProvider
        store={store}
        persist={{
          key: 'demo',
          enabled: true,
          onPersist,
          hydrate: async ({ store: runtimeStore }) => {
            await runtimeStore.hydrate({ count: 2 })
          },
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('true:idle:2')).toBeTruthy()
    })
  })

  it('gates hydration until the runtime is enabled', async () => {
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()
    const hydrate = vi.fn(
      async ({
        store: runtimeStore,
      }: PersistHydrateArgs<{ count: number }>) => {
        await runtimeStore.hydrate({ count: 5 })
      },
    )

    function Probe(props: { enabled: boolean }) {
      const persistentStore = usePersistentStore(builder)

      return (
        <span>
          {String(persistentStore.isHydrated)}:
          {persistentStore.store.get().count}
        </span>
      )
    }

    const view = render(
      <PersistStoreProvider
        store={store}
        persist={{
          key: 'ready-gate',
          enabled: false,
          onPersist: async () => {},
          hydrate,
        }}
      >
        <Probe enabled={false} />
      </PersistStoreProvider>,
    )

    expect(screen.getByText('false:0')).toBeTruthy()
    expect(hydrate).not.toHaveBeenCalled()

    view.rerender(
      <PersistStoreProvider
        store={store}
        persist={{
          key: 'ready-gate',
          enabled: true,
          onPersist: async () => {},
          hydrate,
        }}
      >
        <Probe enabled />
      </PersistStoreProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('true:5')).toBeTruthy()
    })
    expect(hydrate).toHaveBeenCalledTimes(1)
  })

  it('selects persistence meta through usePersistSelector', async () => {
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()

    function Probe() {
      const pending = usePersistSelector(builder, (meta) => meta.pending)
      return <span>{pending ? 'pending' : 'idle'}</span>
    }

    render(
      <PersistStoreProvider
        store={store}
        persist={{
          key: 'selector',
          enabled: true,
          delay: 1000,
          onPersist: async () => {},
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )
    expect(screen.getByText('idle')).toBeTruthy()

    act(() => {
      store.setState(() => ({ count: 1 }))
    })

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeTruthy()
    })
  })

  it('uses declaration-time persist defaults through usePersistentStore', async () => {
    const onPersist = vi.fn(async () => {})
    const builder = createStore({ count: 0 }).extend(
      persist({
        onPersist,
        hydrate: async ({ store: runtimeStore }) => {
          await runtimeStore.hydrate({ count: 2 })
        },
      }),
    )
    const store = builder.create()

    function Probe() {
      const persistentStore = usePersistentStore(builder)

      return (
        <span>
          {String(persistentStore.isHydrated)}:
          {persistentStore.store.get().count}
        </span>
      )
    }

    render(
      <PersistStoreProvider store={store} persist={{ key: 'declared-defaults' }}>
        <Probe />
      </PersistStoreProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('true:2')).toBeTruthy()
    })

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
    const defaultHydrate = vi.fn(async () => {})
    const runtimeHydrate = vi.fn(
      async ({
        store: runtimeStore,
      }: PersistHydrateArgs<{ count: number }>) => {
        await runtimeStore.hydrate({ count: 4 })
      },
    )
    const builder = createStore({ count: 0 }).extend(
      persist({
        onPersist: defaultOnPersist,
        hydrate: defaultHydrate,
      }),
    )
    const store = builder.create()

    function Probe() {
      const persistentStore = usePersistentStore(builder)

      return <span>{persistentStore.store.get().count}</span>
    }

    render(
      <PersistStoreProvider
        store={store}
        persist={{
          key: 'runtime-overrides',
          onPersist: runtimeOnPersist,
          hydrate: runtimeHydrate,
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('4')).toBeTruthy()
    })

    act(() => {
      store.setState(() => ({ count: 5 }))
    })

    await waitFor(() => {
      expect(runtimeOnPersist).toHaveBeenCalledTimes(1)
    })

    expect(defaultHydrate).not.toHaveBeenCalled()
    expect(defaultOnPersist).not.toHaveBeenCalled()
  })

  it('flushes pending work on unmount when requested', async () => {
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()
    const onPersist = vi.fn(async () => {})

    const view = render(
      <PersistStoreProvider
        store={store}
        persist={{
          key: 'unmount',
          enabled: true,
          delay: 1000,
          onPersist,
        }}
      >
        <PersistenceBoundary store={store} flushOnUnmount>
          <span>mounted</span>
        </PersistenceBoundary>
      </PersistStoreProvider>,
    )

    act(() => {
      store.setState(() => ({ count: 1 }))
    })

    view.unmount()

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
    })
  })

  it('flushes pending work on pagehide when requested', async () => {
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()
    const onPersist = vi.fn(async () => {})

    render(
      <PersistStoreProvider
        store={store}
        persist={{
          key: 'pagehide',
          enabled: true,
          delay: 1000,
          onPersist,
        }}
      >
        <PersistenceBoundary store={store} flushOnPageHide>
          <span>mounted</span>
        </PersistenceBoundary>
      </PersistStoreProvider>,
    )

    act(() => {
      store.setState(() => ({ count: 1 }))
    })

    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
    })
  })

  it('treats flushOnBackground as a web no-op', async () => {
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()
    const onPersist = vi.fn(async () => {})

    render(
      <PersistStoreProvider
        store={store}
        persist={{
          key: 'background',
          enabled: true,
          delay: 1000,
          onPersist,
        }}
      >
        <PersistenceBoundary store={store} flushOnBackground>
          <span>mounted</span>
        </PersistenceBoundary>
      </PersistStoreProvider>,
    )

    act(() => {
      store.setState(() => ({ count: 1 }))
    })

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await waitFor(() => {
      expect(store.persist.metaStore.get().pending).toBe(true)
    })
    expect(onPersist).not.toHaveBeenCalled()
  })

  it('passes the resolved key to runtime callbacks when the key is omitted', async () => {
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()
    const hydrate = vi.fn(
      async ({
        store: runtimeStore,
      }: PersistHydrateArgs<{ count: number }>) => {
        await runtimeStore.hydrate({ count: 3 })
      },
    )
    const onPersist = vi.fn(
      async (_args: PersistPersistArgs<{ count: number }>) => {},
    )

    function Probe() {
      const persistentStore = usePersistentStore(builder)

      return <span>{persistentStore.store.get().count}</span>
    }

    render(
      <PersistStoreProvider
        store={store}
        persist={{
          enabled: true,
          hydrate,
          onPersist,
        }}
      >
        <Probe />
      </PersistStoreProvider>,
    )

    await waitFor(() => {
      expect(hydrate).toHaveBeenCalledTimes(1)
      expect(screen.getByText('3')).toBeTruthy()
    })

    act(() => {
      store.setState(() => ({ count: 4 }))
    })

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
    })

    const hydrateCall = hydrate.mock.calls[0]
    const persistCall = onPersist.mock.calls[0]

    const hydrateKey = hydrateCall?.[0]?.key
    const persistKey = persistCall?.[0]?.key

    expect(hydrateKey).toBeTypeOf('string')
    expect(hydrateKey).toBe(persistKey)
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

  it('fails loudly when usePersistSelector is used outside PersistStoreProvider', () => {
    const builder = createStore({ count: 0 }).extend(
      persist({
        onPersist: async () => {},
      }),
    )

    function Probe() {
      usePersistSelector(builder, (meta) => meta.pending)
      return null
    }

    expect(() => render(<Probe />)).toThrow(
      'usePersistentStore(builder) requires a matching <PersistStoreProvider builder={...}> or <PersistStoreProvider store={...}> ancestor.',
    )
  })
})

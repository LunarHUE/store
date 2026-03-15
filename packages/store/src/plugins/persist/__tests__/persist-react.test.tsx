import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createStore } from '../../../core'

import { persist } from '../plugin'
import {
  PersistenceBoundary,
  usePersistentStore,
  usePersistSelector,
} from '../react'

describe('persist react bindings', () => {
  it('hydrates through usePersistentStore and exposes meta', async () => {
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()
    const onPersist = vi.fn(async () => {})

    function Probe() {
      const persistentStore = usePersistentStore(store, {
        key: 'demo',
        ready: true,
        onPersist,
        hydrate: async (runtimeStore) => {
          await runtimeStore.hydrate({ count: 2 })
        },
      })

      return (
        <span>
          {String(persistentStore.isHydrated)}:{persistentStore.meta.pending ? 'pending' : 'idle'}:
          {persistentStore.store.get().count}
        </span>
      )
    }

    render(<Probe />)

    await waitFor(() => {
      expect(screen.getByText('true:idle:2')).toBeTruthy()
    })
  })

  it('gates hydration until the runtime is ready', async () => {
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()
    const hydrate = vi.fn(async (runtimeStore: typeof store) => {
      await runtimeStore.hydrate({ count: 5 })
    })

    function Probe(props: { ready: boolean }) {
      const persistentStore = usePersistentStore(store, {
        key: 'ready-gate',
        ready: props.ready,
        onPersist: async () => {},
        hydrate,
      })

      return <span>{String(persistentStore.isHydrated)}:{persistentStore.store.get().count}</span>
    }

    const view = render(<Probe ready={false} />)

    expect(screen.getByText('false:0')).toBeTruthy()
    expect(hydrate).not.toHaveBeenCalled()

    view.rerender(<Probe ready />)

    await waitFor(() => {
      expect(screen.getByText('true:5')).toBeTruthy()
    })
    expect(hydrate).toHaveBeenCalledTimes(1)
  })

  it('selects persistence meta through usePersistSelector', async () => {
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()

    function Probe() {
      usePersistentStore(store, {
        key: 'selector',
        ready: true,
        delay: 1000,
        onPersist: async () => {},
      })

      const pending = usePersistSelector(store, (meta) => meta.pending)
      return <span>{pending ? 'pending' : 'idle'}</span>
    }

    render(<Probe />)
    expect(screen.getByText('idle')).toBeTruthy()

    act(() => {
      store.setState(() => ({ count: 1 }))
    })

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeTruthy()
    })
  })

  it('flushes pending work on unmount when requested', async () => {
    const builder = createStore({ count: 0 }).extend(persist())
    const store = builder.create()
    const onPersist = vi.fn(async () => {})

    function Probe() {
      usePersistentStore(store, {
        key: 'unmount',
        ready: true,
        delay: 1000,
        onPersist,
      })

      return (
        <PersistenceBoundary store={store} flushOnUnmount>
          <span>mounted</span>
        </PersistenceBoundary>
      )
    }

    const view = render(<Probe />)

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

    function Probe() {
      usePersistentStore(store, {
        key: 'pagehide',
        ready: true,
        delay: 1000,
        onPersist,
      })

      return (
        <PersistenceBoundary store={store} flushOnPageHide>
          <span>mounted</span>
        </PersistenceBoundary>
      )
    }

    render(<Probe />)

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

    function Probe() {
      usePersistentStore(store, {
        key: 'background',
        ready: true,
        delay: 1000,
        onPersist,
      })

      return (
        <PersistenceBoundary store={store} flushOnBackground>
          <span>mounted</span>
        </PersistenceBoundary>
      )
    }

    render(<Probe />)

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
})

import { afterAll, afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, renderAsync, waitFor } from '@testing-library/react-native'
import { Text } from 'react-native'

import { type StoreDebugEvent, createStore } from '../../../core'
import { useSelector, useStore, useStoreSelector } from '../../../react'
import { persist } from '../plugin'
import { PersistStoreProvider, usePersistentStore } from '../react'
import type { PersistPersistArgs } from '../types'

type MockAppStateStatus = 'active' | 'inactive' | 'background'

const mockAppStateRemove = jest.fn()
let mockAppStateChangeListener: ((status: MockAppStateStatus) => void) | null =
  null
const mockAppState = {
  currentState: 'active' as MockAppStateStatus,
  addEventListener: jest.fn(
    (_eventType: 'change', listener: (status: MockAppStateStatus) => void) => {
      mockAppStateChangeListener = listener
      return {
        remove: mockAppStateRemove,
      }
    }
  ),
}

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native') as {
    Platform?: { OS?: string }
  } & object

  return {
    ...actual,
    AppState: mockAppState,
    Platform: {
      ...actual.Platform,
      OS: 'ios',
    },
  }
})

const globalRuntime = globalThis as {
  require?: typeof require
}
const originalGlobalRequire = globalRuntime.require

globalRuntime.require = require

describe('persist react bindings (native renderer)', () => {
  afterAll(() => {
    globalRuntime.require = originalGlobalRequire
  })

  afterEach(() => {
    jest.useRealTimers()
    mockAppState.currentState = 'active'
    mockAppStateChangeListener = null
    mockAppState.addEventListener.mockClear()
    mockAppStateRemove.mockClear()
  })

  it('composes PersistStoreProvider with a non-DOM renderer', async () => {
    const onPersist = jest.fn(
      async (_args: PersistPersistArgs<{ count: number }>) => {}
    )
    const builder = createStore<{ count: number }>().extend(
      persist({
        onPersist,
      })
    )
    const snapshots: string[] = []

    function Probe() {
      const store = useStore(builder)
      const count = useStoreSelector(builder, (state) => state.count)
      const pending = useSelector(store.persist.meta, (meta) => meta.pending)

      const label = `${count}:${pending ? 'pending' : 'idle'}`
      snapshots.push(label)
      return <Text>{label}</Text>
    }

    const result = await renderAsync(
      <PersistStoreProvider
        builder={builder}
        loadInitialState={async ({ store }) => {
          expect(store.lifecycle.meta.get().status).toBe('initializing')
          return { count: 4 }
        }}
        persist={{}}
      >
        <Probe />
      </PersistStoreProvider>
    )

    expect(snapshots.at(-1)).toBe('4:idle')

    await result.unmountAsync()
  })

  it('supports usePersistentStore with external stores in a non-DOM renderer', async () => {
    const builder = createStore({ count: 2 }).extend(
      persist({
        onPersist: async () => {},
      })
    )
    const store = builder.create()
    const snapshots: string[] = []

    function Probe() {
      const { store } = usePersistentStore(builder)
      const persistMeta = useSelector(store.persist.meta, (meta) => meta)
      const count = useSelector(store, (state) => state.count)

      const label = `${persistMeta.pending ? 'pending' : 'idle'}:${count}`
      snapshots.push(label)
      return <Text>{label}</Text>
    }

    const result = await renderAsync(
      <PersistStoreProvider store={store} persist={{}}>
        <Probe />
      </PersistStoreProvider>
    )

    expect(snapshots.at(-1)).toBe('idle:2')

    await result.unmountAsync()
  })

  it('flushes pending work on unmount without browser APIs', async () => {
    const onPersist = jest.fn(
      async (_args: PersistPersistArgs<{ count: number }>) => {}
    )
    const builder = createStore({ count: 0 }).extend(persist())
    let runtimeStore!: ReturnType<typeof builder.create>

    const result = await renderAsync(
      <PersistStoreProvider
        builder={builder}
        flushOnUnmount
        persist={{
          enabled: true,
          delay: 1000,
          onPersist,
        }}
      >
        {({ store }) => {
          runtimeStore = store
          return <Text>mounted</Text>
        }}
      </PersistStoreProvider>
    )

    act(() => {
      runtimeStore.setState(() => ({ count: 1 }))
    })

    await result.unmountAsync()

    expect(onPersist).toHaveBeenCalledTimes(1)
    expect(onPersist).toHaveBeenCalledWith({
      previousState: { count: 0 },
      nextState: { count: 1 },
    })
  })

  it('ignores flushOnPageHide when window is unavailable', async () => {
    const builder = createStore({ count: 0 }).extend(
      persist({
        onPersist: async () => {},
      })
    )
    const snapshots: number[] = []

    function Probe() {
      const count = useStoreSelector(builder, (state) => state.count)
      snapshots.push(count)
      return <Text>{String(count)}</Text>
    }

    const result = await renderAsync(
      <PersistStoreProvider builder={builder} flushOnPageHide persist={{}}>
        <Probe />
      </PersistStoreProvider>
    )

    expect(snapshots.at(-1)).toBe(0)

    await result.unmountAsync()
  })

  it('flushes queued work when the app backgrounds via React Native AppState', async () => {
    const onPersist = jest.fn(
      async (_args: PersistPersistArgs<{ count: number }>) => {}
    )
    const builder = createStore({ count: 0 }).extend(persist())
    let runtimeStore!: ReturnType<typeof builder.create>

    const result = await renderAsync(
      <PersistStoreProvider
        builder={builder}
        flushOnBackground
        persist={{
          enabled: true,
          delay: 60_000,
          onPersist,
        }}
      >
        {({ store }) => {
          runtimeStore = store
          return <Text>mounted</Text>
        }}
      </PersistStoreProvider>
    )

    act(() => {
      runtimeStore.setState(() => ({ count: 1 }))
    })

    expect(onPersist).not.toHaveBeenCalled()
    expect(mockAppState.addEventListener).toHaveBeenCalledTimes(1)
    expect(mockAppStateChangeListener).not.toBeNull()

    await act(async () => {
      mockAppStateChangeListener?.('background')
    })

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
    })

    expect(onPersist).toHaveBeenCalledWith({
      previousState: { count: 0 },
      nextState: { count: 1 },
    })

    await result.unmountAsync()

    expect(mockAppStateRemove).toHaveBeenCalledTimes(1)
  })

  it('emits debug events through builder-owned native persist providers', async () => {
    const events: StoreDebugEvent<{ count: number }>[] = []
    const builder = createStore({ count: 0 }).extend(
      persist({
        onPersist: async () => {},
      })
    )

    const result = await renderAsync(
      <PersistStoreProvider
        builder={builder}
        debug={{
          console: false,
          level: 'verbose',
          sink(event) {
            events.push(event)
          },
        }}
        persist={{}}
      >
        <Text>mounted</Text>
      </PersistStoreProvider>
    )

    expect(events.some((event) => event.event === 'persist.connected')).toBe(
      true
    )

    await result.unmountAsync()
  })
})

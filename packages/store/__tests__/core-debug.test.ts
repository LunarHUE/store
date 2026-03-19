import { afterEach, describe, expect, it, vi } from 'vitest'

import { createStore, type StoreDebugEvent, type StoreDebugLevel } from '../src/core'

function createDebugCapture<TState>(level: StoreDebugLevel = 'basic') {
  const events: StoreDebugEvent<TState>[] = []

  return {
    debug: {
      console: false,
      level,
      sink(event: StoreDebugEvent<TState>) {
        events.push(event)
      },
    },
    events,
  }
}

describe('core debugger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shares builder ids and creates unique store ids per runtime', () => {
    const builder = createStore({ count: 0 })
    const sink = vi.fn()

    builder.create(undefined, {
      debug: {
        console: false,
        sink,
      },
    })
    builder.create(undefined, {
      debug: {
        console: false,
        sink,
      },
    })

    const createdEvents = sink.mock.calls
      .map(([event]) => event as StoreDebugEvent<{ count: number }>)
      .filter((event) => event.event === 'store.created')

    expect(createdEvents).toHaveLength(2)
    expect(createdEvents[0]?.builderId).toBe(createdEvents[1]?.builderId)
    expect(createdEvents[0]?.storeId).not.toBe(createdEvents[1]?.storeId)
  })

  it('assigns a new builder id to extended builders', () => {
    const baseBuilder = createStore({ count: 0 })
    const extendedBuilder = baseBuilder.extend(() => ({
      label: 'extended' as const,
    }))
    const events: StoreDebugEvent<{ count: number }>[] = []
    const sink = (event: StoreDebugEvent<{ count: number }>) => {
      if (event.event === 'store.created') {
        events.push(event)
      }
    }

    baseBuilder.create(undefined, {
      debug: {
        console: false,
        sink,
      },
    })
    extendedBuilder.create(undefined, {
      debug: {
        console: false,
        sink,
      },
    })

    expect(events).toHaveLength(2)
    expect(events[0]?.builderId).not.toBe(events[1]?.builderId)
  })

  it('emits subscription lifecycle events once per subscription', () => {
    const { debug, events } = createDebugCapture<{ count: number }>()
    const store = createStore({ count: 0 }).create(undefined, { debug })

    const subscription = store.subscribe(() => {})

    subscription.unsubscribe()
    subscription.unsubscribe()

    const connectedEvents = events.filter(
      (event) => event.event === 'subscription.connected',
    )
    const disconnectedEvents = events.filter(
      (event) => event.event === 'subscription.disconnected',
    )

    expect(connectedEvents).toHaveLength(1)
    expect(disconnectedEvents).toHaveLength(1)
    expect(connectedEvents[0]?.subscriptionId).toBe(
      disconnectedEvents[0]?.subscriptionId,
    )
  })

  it('emits initialization events in order', async () => {
    const { debug, events } = createDebugCapture<{ count: number }>('verbose')
    const store = createStore<{ count: number }>().create(undefined, { debug })

    await store.setInitialState({ count: 1 })

    expect(events.map((event) => event.event)).toEqual([
      'store.created',
      'store.initial_state.set',
      'store.lifecycle.changed',
    ])
    expect(events[0]?.status).toBe('uninitialized')
    expect(events[2]?.status).toBe('ready')
  })

  it('only includes state snapshots at trace level', () => {
    const verboseCapture = createDebugCapture<{ count: number }>('verbose')
    const traceCapture = createDebugCapture<{ count: number }>('trace')
    const verboseStore = createStore({ count: 0 }).create(undefined, {
      debug: verboseCapture.debug,
    })
    const traceStore = createStore({ count: 0 }).create(undefined, {
      debug: traceCapture.debug,
    })

    verboseStore.setState((prev) => ({ count: prev.count + 1 }))
    traceStore.setState((prev) => ({ count: prev.count + 1 }))

    const verboseEvent = verboseCapture.events.find(
      (event) => event.event === 'store.state.set',
    )
    const traceEvent = traceCapture.events.find(
      (event) => event.event === 'store.state.set',
    )

    expect(verboseEvent?.previousState).toBeUndefined()
    expect(verboseEvent?.nextState).toBeUndefined()
    expect(traceEvent?.previousState).toEqual({ count: 0 })
    expect(traceEvent?.nextState).toEqual({ count: 1 })
  })

  it('does not let sink failures break store operations', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const sink = vi.fn(() => {
      throw new Error('sink failed')
    })
    const store = createStore({ count: 0 }).create(undefined, {
      debug: {
        console: false,
        sink,
      },
    })

    expect(() => {
      store.setState((prev) => ({ count: prev.count + 1 }))
    }).not.toThrow()
    expect(store.get()).toEqual({ count: 1 })
    expect(consoleError).toHaveBeenCalledWith(
      '[lunarhue/store][debug] sink failed',
      expect.any(Error),
    )
  })

  it('lets plugins emit custom debug events through the plugin logger', () => {
    const events: StoreDebugEvent<{ count: number }>[] = []
    const builder = createStore({ count: 0 }).extend(({ logger }) => {
      logger.emit({
        detail: {
          plugin: 'custom',
        },
        event: 'plugin.ready',
        minimumLevel: 'verbose',
        source: 'custom-plugin',
      })

      return {}
    })

    builder.create(undefined, {
      debug: {
        console: false,
        level: 'verbose',
        sink(event) {
          events.push(event)
        },
      },
    })

    expect(
      events.some(
        (event) =>
          event.source === 'custom-plugin' && event.event === 'plugin.ready',
      ),
    ).toBe(true)
  })
})

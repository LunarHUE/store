import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createStore } from '../../../core'

import { actions, createAction } from '../plugin'
import { useActions } from '../react'

describe('actions plugin', () => {
  it('attaches typed actions outside state', () => {
    const builder = createStore({ count: 0 }).extend(
      actions(({ getState, setState }) => ({
        increment() {
          const current = getState().count
          setState(() => ({ count: current + 1 }))
        },
      })),
    )

    const store = builder.create()

    store.actions.increment()

    expect(store.get().count).toBe(1)
  })

  it('allows actions to preserve object identity for no-op updates', () => {
    const initialState = { value: 'same' }
    const builder = createStore(initialState).extend(
      actions(({ setState }) => ({
        setValue(value: string) {
          setState((prev) => (prev.value === value ? prev : { value }))
        },
      })),
    )

    const store = builder.create()
    const previous = store.get()

    store.actions.setValue('same')

    expect(store.get()).toBe(previous)
  })

  it('binds reusable action definitions created outside the plugin callback', () => {
    type CounterState = { count: number }

    const add = createAction<CounterState, [value: number]>(
      ({ setState }, value) => {
        setState((prev) => ({
          count: prev.count + value,
        }))
      },
    )

    const builder = createStore<CounterState>({ count: 0 }).extend(
      actions(() => ({
        add,
      })),
    )

    const store = builder.create()

    store.actions.add(3)

    expect(store.get().count).toBe(3)
  })

  it('allows reusable and inline actions to coexist', () => {
    type CounterState = { count: number }

    const add = createAction<CounterState, [value: number]>(
      ({ setState }, value) => {
        setState((prev) => ({
          count: prev.count + value,
        }))
      },
    )

    const builder = createStore<CounterState>({ count: 1 }).extend(
      actions(({ getState, setState }) => ({
        add,
        reset() {
          const nextCount = getState().count > 0 ? 0 : getState().count
          setState(() => ({ count: nextCount }))
        },
      })),
    )

    const store = builder.create()

    store.actions.add(4)
    expect(store.get().count).toBe(5)

    store.actions.reset()
    expect(store.get().count).toBe(0)
  })

  it('returns the actions surface through useActions', () => {
    const builder = createStore({ count: 0 }).extend(
      actions(({ setState }) => ({
        increment() {
          setState((prev) => ({ count: prev.count + 1 }))
        },
      })),
    )

    const store = builder.create()

    function Probe() {
      const runtimeActions = useActions(store)

      return (
        <button onClick={() => runtimeActions.increment()} type="button">
          run
        </button>
      )
    }

    render(<Probe />)

    fireEvent.click(screen.getByRole('button'))

    expect(store.get().count).toBe(1)
  })
})

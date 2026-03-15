# `@lunarhue/store`

Framework-agnostic state built on top of `@tanstack/store`, with Lunarhue-style
plugin composition, selector-first React bindings, and plugin-owned React APIs.

This repo is a Bun workspace. The publishable package lives in
`packages/store`.

## Public entrypoints

Imports are explicit subpaths:

- `@lunarhue/store/core`
- `@lunarhue/store/react`
- `@lunarhue/store/plugins/actions`
- `@lunarhue/store/plugins/persist`

There is no root package barrel export in the current package shape.

## Core store usage

`createStore(...)` returns a reusable `StoreBuilder`, not a live store
instance.

```ts
import { createStore } from '@lunarhue/store/core'

const CounterStore = createStore({
  count: 0,
})

const store = CounterStore.create()

store.get().count
store.setState((prev) => ({
  ...prev,
  count: prev.count + 1,
}))

await store.dispose()
```

Why the builder exists:

- it lets you compose plugins before runtime
- it can create multiple independent store instances
- React can scope those instances through providers without mutating the store declaration itself

## React usage

The generic React layer gives you:

- `createStoreContext(builder)`
- `useStore(builder)`
- `useSelector(store, selector, compare?)`

```tsx
import { createStore } from '@lunarhue/store/core'
import {
  createStoreContext,
  useSelector,
  useStore,
} from '@lunarhue/store/react'

const CounterStore = createStore({ count: 0 })
const CounterContext = createStoreContext(CounterStore)

function CounterValue() {
  const store = useStore(CounterStore)
  const count = useSelector(store, (state) => state.count)

  return <span>{count}</span>
}

function App() {
  const store = CounterStore.create()

  return (
    <CounterContext.Provider value={store}>
      <CounterValue />
    </CounterContext.Provider>
  )
}
```

If no provider exists, `useStore(builder)` creates a local store instance and
disposes it on unmount.

## Actions plugin

The actions plugin adds a typed mutation surface without putting actions into
state.

```ts
import { createStore } from '@lunarhue/store/core'
import { actions } from '@lunarhue/store/plugins/actions'

const CounterStore = createStore({ count: 0 }).extend(
  actions(({ setState }) => ({
    increment() {
      setState((prev) => ({
        ...prev,
        count: prev.count + 1,
      }))
    },
  })),
)
```

In React:

```tsx
import { useActions } from '@lunarhue/store/plugins/actions'
import { useStore } from '@lunarhue/store/react'

function IncrementButton() {
  const store = useStore(CounterStore)
  const actions = useActions(store)

  return <button onClick={() => actions.increment()}>Increment</button>
}
```

## Persist plugin

The persist plugin adds:

- `store.hydrate(...)`
- `store.persist.flush()`
- `store.persist.hydrate(...)`
- `store.persist.metaStore`
- `usePersistentStore(...)`
- `usePersistSelector(...)`
- `PersistenceBoundary`

Store declaration:

```ts
import { createStore } from '@lunarhue/store/core'
import { persist } from '@lunarhue/store/plugins/persist'

const DraftStore = createStore({
  body: '',
}).extend(
  persist({
    flushOnDispose: true,
  }),
)
```

React wiring:

```tsx
import {
  PersistenceBoundary,
  usePersistentStore,
  usePersistSelector,
} from '@lunarhue/store/plugins/persist'
import { useStore } from '@lunarhue/store/react'

function DraftScreen() {
  const store = useStore(DraftStore)
  const { isHydrated, flush } = usePersistentStore(store, {
    key: 'draft',
    ready: true,
    delay: 500,
    async hydrate(runtimeStore) {
      const serialized = window.localStorage.getItem('draft')

      if (!serialized) {
        await runtimeStore.hydrate(runtimeStore.get())
        return
      }

      await runtimeStore.hydrate(JSON.parse(serialized))
    },
    async onPersist({ nextState }) {
      window.localStorage.setItem('draft', JSON.stringify(nextState))
    },
  })

  const pending = usePersistSelector(store, (meta) => meta.pending)

  return (
    <PersistenceBoundary store={store} flushOnUnmount flushOnPageHide>
      <div>
        <span>Hydrated: {String(isHydrated)}</span>
        <span>Pending: {String(pending)}</span>
        <button onClick={() => void flush()}>Flush</button>
      </div>
    </PersistenceBoundary>
  )
}
```

On web:

- `flushOnPageHide` is implemented
- `flushOnBackground` is accepted but currently a no-op

## How plugins work

Plugins are additive. They attach new runtime surface area to the store
instance, not to the store state.

```ts
const SubmissionStore = createStore({})
  .extend(actions(...))
  .extend(persist(...))
```

At the type level, a plugin is:

```ts
type StorePlugin<TState, TPlugins, TNextPlugins> = (
  context: StorePluginContext<TState, TPlugins>,
) => TNextPlugins
```

And the plugin context is:

```ts
type StorePluginContext<TState, TPlugins> = {
  store: Store<TState, TPlugins>
  onDispose(cleanup: StoreCleanup): void
}
```

That means a plugin can:

- read current state through `context.store.get()`
- update state through `context.store.setState(...)`
- subscribe or inspect existing plugin surface on the store
- register teardown logic through `onDispose(...)`
- return a new plugin-owned surface that gets attached to the runtime store

## Writing your own plugin

This is the smallest useful custom plugin shape:

```ts
import type { StorePlugin } from '@lunarhue/store/core'

type LoggerSurface = {
  logSnapshot(): void
}

export function logger<TState>(label: string): StorePlugin<
  TState,
  any,
  LoggerSurface
> {
  return ({ store, onDispose }) => {
    const subscription = store.subscribe((state) => {
      console.log(label, state)
    })

    onDispose(() => {
      subscription.unsubscribe()
    })

    return {
      logSnapshot() {
        console.log(label, store.get())
      },
    }
  }
}
```

Usage:

```ts
const DebugStore = createStore({ ready: false }).extend(logger('debug'))

const store = DebugStore.create()
store.logSnapshot()
```

Plugin authoring guidelines:

- attach capability to the store surface, not the state object
- keep React-specific APIs inside the plugin if they only make sense when that plugin is installed
- use `onDispose(...)` for subscriptions, timers, and external resources
- avoid colliding with existing store keys when returning your plugin surface

## Repo guide

- `packages/store`: publishable package
- `examples/react-basic`: Vite React example using the public API
- `docs`: additional architecture, API, migration, and phase notes

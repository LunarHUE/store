# `@lunarhue/store`

[npm version](https://www.npmjs.com/package/@lunarhue/store)

Framework-agnostic state built on top of `@tanstack/store`, with
plugin composition, selector-first React bindings, and plugin-owned React APIs.

This repo is a Bun workspace. The publishable package lives in
`packages/store`.

## Install

Package: [https://www.npmjs.com/package/@lunarhue/store](https://www.npmjs.com/package/@lunarhue/store)

```sh
npm install @lunarhue/store
```

## Public entrypoints

Imports are explicit subpaths:

- `@lunarhue/store/core`
- `@lunarhue/store/react`
- `@lunarhue/store/plugins/actions`
- `@lunarhue/store/plugins/persist`

There is no root package barrel export in the current package shape.

## Core store usage

`createStore(...)` and `createStore<TState>()` return a reusable `StoreBuilder`, not a live store
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

You can also declare a builder without a default state and set its initial state later:

```ts
type DraftState = { body: string }

const DraftStore = createStore<DraftState>()

const draftStore = DraftStore.create()
await draftStore.setInitialState({ body: '' })
```

Why the builder exists:

- it lets you compose plugins before runtime
- it can create multiple independent store instances
- React can scope those instances through providers without mutating the store declaration itself

The builder itself is immutable. Calling `.extend(...)` returns a new builder,
and calling `.create()` returns a new runtime store instance.

Each runtime store instance has stable identity for its lifetime. The state
inside it changes, but the store object itself is the thing plugins and React
hold onto.

## Built-in runtime debugging

Runtime debugging is explicit and scoped to each created store instance. The
package does not read env vars itself, so apps can decide how to wire that
toggle for web, Next.js, or React Native.

```ts
const events = []
const store = CounterStore.create(undefined, {
  debug: {
    level: 'trace',
    console: false,
    sink(event) {
      events.push(event)
    },
  },
})
```

Builder-owned `StoreProvider` and `PersistStoreProvider` accept the same
`debug` option, and `useLocalStore(builder, { debug: ... })` forwards it for
locally owned runtimes. Built-in event names autocomplete, but custom plugin
events are allowed too.

## React usage

The generic React layer gives you:

- `StoreProvider`
- `useStore(builder)`
- `useLocalStore(builder)`
- `useSelector(store, selector, compare?)`
- `useStoreSelector(builder, selector, compare?)`

```tsx
import { createStore } from '@lunarhue/store/core'
import { StoreProvider, useSelector, useStore } from '@lunarhue/store/react'

const CounterStore = createStore({ count: 0 })

function CounterValue() {
  const store = useStore(CounterStore)
  const count = useSelector(store, (state) => state.count)

  return <span>{count}</span>
}

function App() {
  return (
    <StoreProvider builder={CounterStore}>
      <CounterValue />
    </StoreProvider>
  )
}
```

`StoreProvider` also accepts a render-prop child when you need direct access to
the scoped store instance at the provider boundary:

```tsx
function App() {
  return (
    <StoreProvider builder={CounterStore}>
      {({ store }) => <></>}
    </StoreProvider>
  )
}
```

`useStore(builder)` is provider-only. If no matching provider exists, it throws.

If a builder has no declaration-time state, `StoreProvider` can make it ready
with either `initialState` or `loadInitialState`:

```tsx
const CounterStore = createStore<{ count: number }>()

function App() {
  return (
    <StoreProvider
      builder={CounterStore}
      loadInitialState={async () => ({ count: 0 })}
    >
      <CounterValue />
    </StoreProvider>
  )
}
```

Use `useLocalStore(builder)` when you want explicit local ownership:

```tsx
function LocalCounter() {
  const store = useLocalStore(CounterStore)
  const count = useSelector(store, (state) => state.count)

  return <span>{count}</span>
}
```

Under the hood, React context lookup is keyed by the builder through an
internal `WeakMap`. That means:

- if a matching provider exists for that builder, every `useStore(builder)` call reads the same provided store instance
- `StoreProvider builder={...}` creates and owns a store instance for that builder
- `StoreProvider store={externalStore}` reuses an existing store created from that builder
- `StoreProvider` children can be plain JSX or a render prop that receives `{ store }`

`useStoreSelector(builder, selector)` is the provider-scoped convenience form of
state selection:

```tsx
function CounterValue() {
  const count = useStoreSelector(CounterStore, (state) => state.count)
  return <span>{count}</span>
}
```

## Actions plugin

The actions plugin adds a typed mutation surface without putting actions into
state.

```ts
import { createStore } from '@lunarhue/store/core'
import { actions, createAction } from '@lunarhue/store/plugins/actions'

const increment = createAction<{ count: number }>(({ setState }) => {
  setState((prev) => ({
    ...prev,
    count: prev.count + 1,
  }))
})

const CounterStore = createStore({ count: 0 }).extend(
  actions(({ setState }) => ({
    increment,
    decrement() {
      setState((prev) => ({
        ...prev,
        count: prev.count - 1,
      }))
    },
  })),
)
```

Reusable actions are bound to the store helpers when the plugin installs. Inline
actions still work too, so you can mix both styles in the same `actions(...)`
object.

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

The core store adds:

- `store.setInitialState(...)`
- `store.lifecycle.meta`

The persist plugin adds:

- `store.persist.flush()`
- `store.persist.meta`
- `PersistStoreProvider`
- `usePersistentStore(builder)`

Store declaration:

```ts
import { createStore } from '@lunarhue/store/core'
import { persist } from '@lunarhue/store/plugins/persist'

const DraftStore = createStore<{ body: string }>().extend(
  persist({
    flushOnDispose: true,
    delay: 500,
    async onPersist({ key, nextState }) {
      window.localStorage.setItem(key, JSON.stringify(nextState))
    },
  }),
)
```

Declaration-time persist callbacks act as defaults. Runtime wiring can override
them when a specific screen or provider needs different behavior.

React wiring:

```tsx
import {
  PersistStoreProvider,
  usePersistentStore,
} from '@lunarhue/store/plugins/persist'
import { useSelector } from '@lunarhue/store/react'

function DraftScreen() {
  const { flush, store } = usePersistentStore(DraftStore)
  const status = store.lifecycle.meta.get().status
  const persistMeta = useSelector(store.persist.meta, (meta) => meta)

  return (
      <div>
        <span>Status: {status}</span>
        <span>Pending: {String(persistMeta.pending)}</span>
        <button onClick={() => void flush()}>Flush</button>
      </div>
  )
}

function App() {
  return (
    <PersistStoreProvider
      builder={DraftStore}
      flushOnUnmount
      flushOnPageHide
      loadInitialState={async () => {
        const serialized = window.localStorage.getItem('draft')

        return serialized ? JSON.parse(serialized) : { body: '' }
      }}
      persist={{
        key: 'draft',
        enabled: true,
        onPersist: async ({ nextState }) => {
          window.localStorage.setItem('draft', JSON.stringify(nextState))
        },
      }}
    >
      <DraftScreen />
    </PersistStoreProvider>
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
- emit custom debug events through `context.logger.emit(...)`
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

export function logger<TState>(
  label: string,
): StorePlugin<TState, any, LoggerSurface> {
  return ({ store, logger, onDispose }) => {
    logger.emit({
      source: 'plugin.logger',
      event: 'plugin.logger.ready',
      minimumLevel: 'verbose',
      detail: { label },
    })

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

const store = DebugStore.create(undefined, {
  debug: {
    level: 'verbose',
  },
})

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
- `examples/nextjs`: Next.js App Router example using the public API
- `docs`: additional architecture, API, migration, and phase notes

## Release flow

Stable releases for `@lunarhue/store` use Changesets and GitHub Actions.

- add a changeset for user-facing package changes
- merge to `main`
- review and merge the generated release PR
- verify the npm package and GitHub release artifacts

See [docs/releases.md](./docs/releases.md) for the full maintainer workflow,
including npm trusted publisher setup.

# API

`@lunarhue/store` ships four public entry points:

- `@lunarhue/store/core`
- `@lunarhue/store/react`
- `@lunarhue/store/plugins/actions`
- `@lunarhue/store/plugins/persist`

There is no root package barrel export.

## Core

```ts
import { createStore } from '@lunarhue/store/core'
```

`createStore(...)` returns an immutable `StoreBuilder<TState, TPlugins>`.
Builder declarations are reusable, and each call to `.create()` produces a
fresh runtime store instance.

### Builder contract

```ts
type StoreCreateOptions<TState> = {
  debug?: StoreDebugOptions<TState>
}

type StoreBuilder<TState, TPlugins = {}> = {
  create(): Store<TState, TPlugins>
  create(initialState: TState): Store<TState, TPlugins>
  create(
    initialState: TState | undefined,
    options: StoreCreateOptions<TState>,
  ): Store<TState, TPlugins>
  extend<TNextPlugins>(
    plugin: StorePlugin<TState, TPlugins, TNextPlugins>,
  ): StoreBuilder<TState, TPlugins & TNextPlugins>
}
```

- `.extend(...)` never mutates the original builder.
- `.create(initialState)` makes the runtime store ready immediately.
- If the builder was declared with a default state, `.create()` is ready
  immediately.
- If the builder has no declared default and `.create()` is called without an
  override, the runtime store starts `uninitialized`.
- Pass `create(undefined, { debug: ... })` to enable opt-in runtime debugging
  without overriding the builder's default readiness behavior.

### Runtime store contract

`Store<TState, TPlugins>` is the TanStack store instance plus:

- `dispose(): Promise<void>`
- `setInitialState(nextState): Promise<void>`
- `lifecycle.meta`
- any attached plugin surface in `TPlugins`

Runtime store identity is stable for the lifetime of the instance. State
updates do not replace the runtime store object itself.

### Lifecycle states

`store.lifecycle.meta` exposes:

- `status: 'uninitialized' | 'initializing' | 'ready' | 'error'`
- `error: unknown | null`

Behavior:

- `uninitialized`: no usable state exists yet
- `initializing`: a loader is resolving initial state
- `ready`: reads, writes, selectors, and plugins can use the state normally
- `error`: initialization failed and the captured error is exposed

### Uninitialized store behavior

If a runtime store is created without ready state:

- `store.get()` throws
- `store.state` throws
- `store.setState(...)` throws
- `store.subscribe(...)` does not notify until real state exists
- `store.setInitialState(nextState)` may be called once to make the store ready

### Runtime debugging

`StoreCreateOptions<TState>` supports:

- `debug?: StoreDebugOptions<TState>`

`StoreDebugOptions<TState>` supports:

- `level?: 'basic' | 'verbose' | 'trace'`
- `console?: boolean`
- `sink?: (event) => void`

Notes:

- debugging is off by default
- debugging is configured per runtime store instance
- `basic` and `verbose` are metadata-first
- `trace` includes `previousState` and `nextState` on stateful events
- built-in event names autocomplete, but custom event names are allowed
- `source` is an open string so internal modules and custom plugins can use
  their own namespaces

Example:

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

Plugins can emit custom events through `StorePluginContext.logger.emit(...)`.

## React

```ts
import {
  StoreProvider,
  useLocalStore,
  useSelector,
  useStore,
  useStoreSelector,
} from '@lunarhue/store/react'
```

React context is builder-scoped through an internal `WeakMap`, but the public
API is provider-first.

### `StoreProvider`

`StoreProvider` supports two ownership modes:

- `builder={...}`: the provider creates and owns the runtime store lifecycle
- `store={...}`: the provider reuses an external runtime store and does not own
  disposal

Children may be plain JSX or a render prop receiving `{ store }`.

Builder mode rules:

- if the builder already has declared initial state, `<StoreProvider builder={builder}>` is valid
- if the builder has no declared initial state, you must provide either
  `initialState` or `loadInitialState`
- the `builder` prop must remain stable for the lifetime of the provider
- builder mode also accepts `debug?: StoreDebugOptions<TState>`

Example:

```tsx
const CounterStore = createStore({ count: 0 })

function App() {
  return (
    <StoreProvider builder={CounterStore}>
      <CounterScreen />
    </StoreProvider>
  )
}
```

Async initialization example for a builder without declared state:

```tsx
const SubmissionStore = createStore<{ body: string }>()

function App() {
  return (
    <StoreProvider
      builder={SubmissionStore}
      loadInitialState={async () => ({ body: '' })}
    >
      <SubmissionScreen />
    </StoreProvider>
  )
}
```

### `useStore(builder)`

Returns the runtime store from the nearest matching `StoreProvider`.

Behavior:

- with a matching provider: returns the shared runtime store instance
- without a matching provider: throws

### `useLocalStore(builder, options?)`

Creates a local runtime store instance for that hook call site and disposes it
on unmount.

Options:

- `initialState`: creates a ready local store immediately
- `loadInitialState`: initializes a local store asynchronously
- `debug`: enables runtime debugging for the local store instance

Without a declared default or one of those options, the returned local store
begins `uninitialized`.

### `useSelector(store, selector, compare?)`

Subscribes to a selected slice of a runtime store instance.

Use this when you already have the runtime store object, including metadata
stores such as `store.lifecycle.meta` or `store.persist.meta`.

### `useStoreSelector(builder, selector, compare?)`

Convenience hook that resolves the runtime store with `useStore(builder)` and
then subscribes with `useSelector(...)`.

## Actions plugin

```ts
import {
  actions,
  createAction,
  useActions,
} from '@lunarhue/store/plugins/actions'
```

### `actions(builder)`

Attaches `store.actions` outside application state.

The builder receives helpers bound to the runtime store instance:

- `getState()`
- `setState(updater)`

### `createAction(callback)`

Creates a reusable typed action definition that can be declared outside the
plugin builder and bound later when the store instance is created.

Inline actions and reusable actions can be mixed in the same `actions(...)`
surface.

Example:

```ts
const increment = createAction<{ count: number }>(({ setState }) => {
  setState((prev) => ({ count: prev.count + 1 }))
})

const CounterStore = createStore({ count: 0 }).extend(
  actions(({ setState }) => ({
    increment,
    decrement() {
      setState((prev) => ({ count: prev.count - 1 }))
    },
  })),
)
```

### `useActions(store)`

Returns the typed `store.actions` surface from a runtime store created with the
actions plugin.

## Persist plugin

```ts
import {
  persist,
  PersistStoreProvider,
  usePersistentStore,
} from '@lunarhue/store/plugins/persist'
```

The persist plugin separates declaration-time defaults from runtime wiring.

### `persist(options?)`

Attaches `store.persist` with:

- `flush(): Promise<void>`
- `meta`

Declaration-time options:

- `delay?: number`
- `onPersist?: (args) => Promise<void>`
- `flushOnDispose?: boolean`
- `serializeState?: (state) => state`

Notes:

- `delay` and `onPersist` act as defaults for runtime wiring
- `enabled` is runtime-only and is not accepted by `persist(...)`
- `onPersist` must be provided either here or at runtime before persistence can
  run

### Persist metadata

`store.persist.meta` exposes:

- `pending: boolean`
- `persisting: boolean`
- `lastPersistedAt: number | null`
- `error: unknown | null`

`onPersist` receives:

```ts
type PersistPersistArgs<TState> = {
  previousState: TState
  nextState: TState
}
```

If `serializeState` is configured, `nextState` is the serialized value passed to
`onPersist`.

### `PersistStoreProvider`

`PersistStoreProvider` composes the core `StoreProvider`.

It supports:

- `builder={...}` or `store={...}` ownership modes
- `debug?: StoreDebugOptions<TState>` in builder-owned mode
- `persist?: { enabled?, delay?, onPersist? }`
- `flushOnUnmount?: boolean`
- `flushOnPageHide?: boolean`
- `flushOnBackground?: boolean`

Rules:

- builder mode follows the same initialization rules as `StoreProvider`
- runtime `persist` options override declaration-time defaults
- `flushOnUnmount` flushes pending work when the provider unmounts
- `flushOnPageHide` flushes pending work on the browser `pagehide` event
- `flushOnBackground` is currently a web no-op

Example:

```tsx
const SubmissionStore = createStore({ body: '' }).extend(persist())

function App() {
  return (
    <PersistStoreProvider
      builder={SubmissionStore}
      flushOnUnmount
      persist={{
        enabled: true,
        delay: 500,
        onPersist: async ({ nextState }) => {
          window.localStorage.setItem('submission', JSON.stringify(nextState))
        },
      }}
    >
      <SubmissionScreen />
    </PersistStoreProvider>
  )
}
```

### `usePersistentStore(builder)`

Returns:

- `store`
- `flush()`

This hook requires a matching `PersistStoreProvider` ancestor. The returned
`store` is a `PersistedStore<TState, TPlugins>`, so `store.persist.flush()` and
`store.persist.meta` are also available directly on the runtime store.

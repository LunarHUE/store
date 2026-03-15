# API

## Core

```ts
import { createStore } from '@lunarhue/store/core'
```

`createStore(initialState)` returns a `StoreBuilder<TState>`.

Builder API:

```ts
type StoreBuilder<TState, TPlugins = {}> = {
  create(): Store<TState, TPlugins>
  extend<TNextPlugins>(
    plugin: StorePlugin<TState, TPlugins, TNextPlugins>,
  ): StoreBuilder<TState, TPlugins & TNextPlugins>
}
```

Runtime store API:

```ts
type Store<TState, TPlugins = {}> = TanStackStore<TState> & {
  dispose(): Promise<void>
} & TPlugins
```

Notes:

- `StoreBuilder` is immutable; `.extend(...)` returns a new builder
- `.create()` returns a fresh runtime store instance
- runtime store identity is stable for the lifetime of that instance

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

Context lookup is builder-scoped through an internal `WeakMap`.

`useStore(builder)` behavior:

- with a matching provider: returns the shared provided store instance
- without a provider: throws

`useLocalStore(builder)` behavior:

- creates a new local store instance for that hook call site
- disposes it on unmount

Provider usage:

```tsx
<StoreProvider builder={SubmissionStore}>
  <Child />
</StoreProvider>

<StoreProvider store={externalStore}>
  <Child />
</StoreProvider>

<StoreProvider builder={SubmissionStore}>
  {({ store }) => <PersistenceBoundary store={store} flushOnUnmount />}
</StoreProvider>
```

Generic selector usage:

```ts
const store = useStore(SubmissionStore)
const value = useSelector(store, (state) => state.count)
```

Provider-scoped selector usage:

```ts
const value = useStoreSelector(SubmissionStore, (state) => state.count)
```

## Actions plugin

```ts
import {
  actions,
  createAction,
  useActions,
} from '@lunarhue/store/plugins/actions'
```

Example:

```ts
const increment = createAction<{ count: number }>(({ setState }) => {
  setState((prev) => ({ ...prev, count: prev.count + 1 }))
})

const CounterStore = createStore({ count: 0 }).extend(
  actions(({ setState }) => ({
    increment,
    decrement() {
      setState((prev) => ({ ...prev, count: prev.count - 1 }))
    },
  })),
)
```

`createAction(...)` lets you declare reusable typed actions outside the plugin
callback. The plugin binds them to `getState` and `setState` when the store is
created. Plain inline functions still work and can be mixed with reusable
actions.

Runtime use:

```ts
const store = useStore(CounterStore)
const actions = useActions(store)
actions.increment()
```

## Persist plugin

```ts
import {
  persist,
  PersistStoreProvider,
  usePersistentStore,
  usePersistSelector,
} from '@lunarhue/store/plugins/persist'
```

Plugin install:

```ts
const SubmissionStore = createStore({}).extend(
  persist({
    flushOnDispose: true,
    delay: 500,
    async onPersist({ key, nextState }) {
      await saveByKey(key, nextState)
    },
  }),
)
```

Persist callbacks and debounce settings may be declared on `persist(...)` as
defaults. Runtime config passed to `PersistStoreProvider` overrides those
defaults when present.

React runtime wiring:

```ts
const persistentStore = usePersistentStore(SubmissionStore)
const pending = usePersistSelector(SubmissionStore, (meta) => meta.pending)
```

```tsx
<PersistStoreProvider
  builder={SubmissionStore}
  persist={{
    key: 'submission',
    enabled: true,
    delay: 500,
    async hydrate({ store: runtimeStore }) {
      await runtimeStore.hydrate(initialState)
    },
  }}
>
  <SubmissionScreen />
</PersistStoreProvider>
```

Boundary:

```tsx
<PersistStoreProvider
  builder={SubmissionStore}
  flushOnUnmount
  flushOnPageHide
  flushOnBackground
>
  <SubmissionScreen />
</PersistStoreProvider>
```

`usePersistentStore(builder)` returns:

- `store`
- `meta`
- `flush()`

`PersistenceBoundary` is still exported as a compatibility escape hatch when
only a nested sub-tree should own flush behavior, but `PersistStoreProvider` is
the primary lifecycle API.

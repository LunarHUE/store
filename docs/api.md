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
    plugin: StorePlugin<TState, TPlugins, TNextPlugins>
  ): StoreBuilder<TState, TPlugins & TNextPlugins>
}
```

Runtime store API:

```ts
type Store<TState, TPlugins = {}> = TanStackStore<TState> & {
  dispose(): Promise<void>
} & TPlugins
```

## React

```ts
import {
  createStoreContext,
  useSelector,
  useStore,
} from '@lunarhue/store/react'
```

`createStoreContext(builder)` returns:

- `Provider`
- `useStore()`

Generic selector usage:

```ts
const store = useStore(SubmissionStore)
const value = useSelector(store, (state) => state.count)
```

## Actions plugin

```ts
import { actions, useActions } from '@lunarhue/store/plugins/actions'
```

Example:

```ts
const CounterStore = createStore({ count: 0 }).extend(
  actions(({ setState }) => ({
    increment() {
      setState((prev) => ({ ...prev, count: prev.count + 1 }))
    },
  })),
)
```

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
  PersistenceBoundary,
  usePersistentStore,
  usePersistSelector,
} from '@lunarhue/store/plugins/persist'
```

Plugin install:

```ts
const SubmissionStore = createStore({})
  .extend(persist({ flushOnDispose: true }))
```

React runtime wiring:

```ts
const store = useStore(SubmissionStore)

const persistentStore = usePersistentStore(store, {
  key: 'submission',
  ready: true,
  delay: 500,
  async hydrate(runtimeStore) {
    await runtimeStore.hydrate(initialState)
  },
  async onPersist({ nextState }) {
    await save(nextState)
  },
})
```

Meta selection:

```ts
const pending = usePersistSelector(store, (meta) => meta.pending)
```

Boundary:

```tsx
<PersistenceBoundary
  store={store}
  flushOnUnmount
  flushOnPageHide
  flushOnBackground
>
  {children}
</PersistenceBoundary>
```

`usePersistentStore(...)` returns:

- `store`
- `meta`
- `isHydrated`
- `flush()`

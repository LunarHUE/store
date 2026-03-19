# `@lunarhue/store`

Framework-agnostic state built on top of `@tanstack/store`, with typed plugins
and React bindings.

## Install

Package: <https://www.npmjs.com/package/@lunarhue/store>

```sh
npm install @lunarhue/store
```

## Entry points

- `@lunarhue/store/core`
- `@lunarhue/store/react`
- `@lunarhue/store/plugins/actions`
- `@lunarhue/store/plugins/persist`

There is no root package barrel export.

## Basic usage

```ts
import { createStore } from '@lunarhue/store/core'

const CounterStore = createStore({ count: 0 })
const store = CounterStore.create()

store.setState((prev) => ({
  count: prev.count + 1,
}))
```

If a builder is declared without initial state, `.create()` returns an
uninitialized runtime store. In that case, provide `initialState` or
`loadInitialState` when using the React provider, or call
`store.setInitialState(...)` before reading or writing state directly.

## React usage

```tsx
import { createStore } from '@lunarhue/store/core'
import { StoreProvider, useStoreSelector } from '@lunarhue/store/react'

const CounterStore = createStore({ count: 0 })

function CounterValue() {
  const count = useStoreSelector(CounterStore, (state) => state.count)
  return <span>{count}</span>
}

export function App() {
  return (
    <StoreProvider builder={CounterStore}>
      <CounterValue />
    </StoreProvider>
  )
}
```

## Plugins

- `actions(...)` attaches typed runtime actions on `store.actions`
- `persist(...)` attaches `store.persist`, with runtime wiring handled by `PersistStoreProvider`

## Docs

- Repo README: <https://github.com/LunarHUE/store#readme>
- API reference: <https://github.com/LunarHUE/store/blob/main/docs/api.md>
- Architecture notes: <https://github.com/LunarHUE/store/blob/main/docs/architecture.md>

# `@lunarhue/store`

Framework-agnostic state built on top of `@tanstack/store`, with plugin
composition and React bindings.

## Install

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

const CounterStore = createStore({
  count: 0,
})

const store = CounterStore.create()

store.setState((prev) => ({
  ...prev,
  count: prev.count + 1,
}))
```

## React usage

```tsx
import { createStore } from '@lunarhue/store/core'
import { StoreProvider, useStoreSelector } from '@lunarhue/store/react'

const CounterStore = createStore({ count: 0 })

function CounterValue() {
  const count = useStoreSelector(CounterStore, (state) => state.count)
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

## Docs

- Repo README: https://github.com/LunarHUE/store#readme
- API and architecture docs: https://github.com/LunarHUE/store/tree/main/docs

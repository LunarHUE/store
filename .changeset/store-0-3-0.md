---
"@lunarhue/store": minor
---

Move store readiness into the core runtime so builders can be declared without fake initial values. Add explicit initialization APIs with `store.setInitialState(...)`, `store.lifecycle.meta`, `StoreBuilder.create(initialState)`, and provider-managed `initialState` / `loadInitialState` flows in React and SSR.

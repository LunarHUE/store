# @lunarhue/store

## 0.3.0

### Minor Changes

- [#47](https://github.com/LunarHUE/store/pull/47) [`7f4cb37`](https://github.com/LunarHUE/store/commit/7f4cb3703c6f88beb045d888af52a6c03353c2ec) Thanks [@tristendillon](https://github.com/tristendillon)! - Move store readiness into the core runtime so builders can be declared without fake initial values. Add explicit initialization APIs with `store.setInitialState(...)`, `store.lifecycle.meta`, `StoreBuilder.create(initialState)`, and provider-managed `initialState` / `loadInitialState` flows in React and SSR.

## Unreleased

### Minor Changes

- Move store readiness into the core runtime with `store.setInitialState(...)`,
  `loadInitialState`, and `store.lifecycle.meta`, so builders can be declared
  as `createStore<TState>()` without fake initial values.
- Reduce the persist plugin to persistence-only behavior by removing its
  hydration APIs and keeping `PersistStoreProvider` focused on persistence
  wiring.

## 0.2.0

### Minor Changes

- [`a874c19`](https://github.com/LunarHUE/store/commit/a874c19bd8170893139f2375acf4d64bf75c7ee0) Thanks [@tristendillon](https://github.com/tristendillon)! - Trim the published package surface to the documented subpath exports and add
  package contract checks to keep future releases aligned with that public API.

## 0.1.0

### Minor Changes

- Publish the initial public release of `@lunarhue/store` at `0.1.0` with the
  current core, React, actions, and persist entry points.

- 0.1.0 is the first public release of @lunarhue/store, a framework-agnostic state library built on @tanstack/store. It ships a typed core store builder API, selector-first React bindings, an actions plugin for typed mutations, and a persist plugin for hydration, flush control, and provider-scoped persistence behavior.

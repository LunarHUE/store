# Architecture

`@lunarhue/store` is a single package with explicit subpath exports:

- `@lunarhue/store/core`
- `@lunarhue/store/react`
- `@lunarhue/store/plugins/actions`
- `@lunarhue/store/plugins/persist`

## Layering

The package is intentionally split by dependency direction:

- `core/*` depends only on `@tanstack/store`
- `react/*` depends on `core/*` and `@tanstack/react-store`
- `plugins/*` depend on `core/*`
- plugin React bindings stay inside the plugin folder and can depend on both the plugin and the generic React layer

This keeps the low-level store runtime framework-agnostic while still giving plugin-owned React ergonomics where they belong.

## Builder vs runtime store

`createStore(...)` returns a `StoreBuilder`, not a live store instance.

That separation matters:

- the builder is a reusable declaration
- plugins are composed once on the builder
- `.create()` produces a fresh runtime store instance
- scoped React usage can create or provide multiple independent instances from the same builder

The builder is immutable. Chaining `.extend(...)` returns a new builder instead
of mutating the original declaration.

At runtime, a Lunarhue `Store<TState, TPlugins>` is the TanStack store instance plus:

- `dispose(): Promise<void>`
- any attached plugin surfaces such as `actions` or `persist`

The runtime store object has stable identity for its lifetime. State changes do
not replace the store instance itself.

## Plugin model

Plugins are additive and compositional:

```ts
const SubmissionStore = createStore({})
  .extend(actions(...))
  .extend(persist(...))
```

Each plugin receives:

- `store`
- `onDispose(cleanup)`

Plugins never merge metadata into app state. They attach extra capability to the runtime store surface instead.

## React model

The generic React layer exposes:

- `StoreProvider`
- `useStore(builder)`
- `useLocalStore(builder)`
- `useSelector(store, selector, compare?)`
- `useStoreSelector(builder, selector, compare?)`

React context remains an internal implementation detail. A builder-specific
context is still stored in an internal `WeakMap` keyed by the builder, but the
public API is provider-first now.

`StoreProvider` supports two ownership modes:

- `builder={...}`: provider creates and owns the runtime store lifecycle
- `store={...}`: provider reuses an externally created runtime store and does not own disposal
- children may be plain JSX or a render prop receiving `{ store }`

`useStore(builder)` is provider-only:

- if a matching provider exists, all `useStore(builder)` calls under that provider receive the same runtime store instance
- if no matching provider exists, the hook throws loudly

`useLocalStore(builder)` is the explicit local-ownership escape hatch. It
creates a store instance locally and disposes it on unmount.

`useStoreSelector(builder, selector)` is the provider-scoped convenience hook
for state selection. It resolves the store from context and then subscribes via
the generic selector hook.

## Persistence model

The persistence plugin has two layers:

1. core persistence runtime
2. React bindings over that runtime

The core plugin owns:

- hydration
- debounced persistence
- flush semantics
- the persistence meta store

The React plugin layer owns:

- `usePersistentStore(store, options)`
- `usePersistSelector(store, selector, compare?)`
- `PersistenceBoundary`

On web:

- `flushOnPageHide` is implemented via `pagehide`
- `flushOnBackground` is accepted but currently a documented no-op

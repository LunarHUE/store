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

At runtime, a Lunarhue `Store<TState, TPlugins>` is the TanStack store instance plus:

- `dispose(): Promise<void>`
- any attached plugin surfaces such as `actions` or `persist`

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

- `createStoreContext(builder)`
- `useStore(builder)`
- `useSelector(store, selector, compare?)`

`useStore(builder)` reads from the nearest matching provider context if one exists. If not, it creates a local store instance and disposes it on unmount.

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

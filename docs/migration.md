# Migration

The vNext package keeps Lunarhue-style ergonomics while replacing the custom runtime with `@tanstack/store`.

## What changes

Old mental model:

- a custom internal store runtime
- persistence and actions layered onto that runtime

New mental model:

- TanStack Store owns the low-level state container
- Lunarhue owns the builder API, plugin composition, provider ergonomics, and plugin-specific React APIs

## Recommended migration path

1. Convert the store declaration to `createStore(initialState)`.
2. Move named mutations into the optional `actions(...)` plugin.
3. Move persistence into `.extend(persist(...))`.
4. Replace context helper setup with `StoreProvider`.
5. Replace generic state subscriptions with `useSelector(store, selector)` or `useStoreSelector(builder, selector)`.
6. Move persistence lifecycle wiring into `usePersistentStore(store, options)`.
7. Replace ad hoc flush handling with `PersistenceBoundary`.

## Example

Declaration:

```ts
const SubmissionStore = createStore<Record<string, string>>({})
  .extend(actions(({ setState }) => ({
    updateAttribute(attributeId: string, value: string) {
      setState((state) => {
        if (state[attributeId] === value) {
          return state
        }

        return {
          ...state,
          [attributeId]: value,
        }
      })
    },
  })))
  .extend(persist({ flushOnDispose: true }))
```

Runtime:

```ts
<StoreProvider builder={SubmissionStore}>
  {({ store }) => (
    <PersistenceBoundary store={store} flushOnUnmount>
      <SubmissionScreen />
    </PersistenceBoundary>
  )}
</StoreProvider>
```

## Notes

- there is no root barrel export in this prototype
- import only from the explicit subpaths
- `useStore(builder)` is provider-only now
- `useLocalStore(builder)` is the explicit local lifecycle API
- persisted hooks are only available from the persist plugin export
- `flushOnBackground` is reserved for future non-web lifecycle support

# Phases

The prototype was delivered in small issue-scoped branches that merged into the epic branch before the final merge to `main`.

## Completed phases

1. Repo bootstrap
   Added the Bun workspace, Turbo pipeline, package/export skeleton, and CI/Nix setup.

2. Core wrapper and plugin foundation
   Added the builder/runtime split, plugin extension, and disposal model on top of `@tanstack/store`.

3. React bindings
   Added the React binding layer, which later evolved into `StoreProvider`, `useStore`, `useLocalStore`, `useSelector`, and `useStoreSelector`.

4. Actions plugin
   Added the typed `actions(...)` plugin and `useActions(store)`.

5. Persist core
   Added debounced persistence, hydration, flush semantics, and the persistence meta store.

6. Persist React bindings and boundary
   Added the initial persist React bindings and lifecycle helpers.

8. Persist provider refactor
   Moved persistence lifecycle ownership into `PersistStoreProvider`, made
   persist hooks builder-first and provider-scoped, and left
   `PersistenceBoundary` as a compatibility escape hatch.

7. Example, docs, and package hardening
   Added the public API example, implementation-backed docs, and export smoke coverage.

## Review flow

Each phase followed the same pattern:

1. create a GitHub issue under the prototype epic
2. branch from the epic branch
3. make multiple focused commits
4. open a PR back into the epic branch
5. review in-editor and on GitHub
6. merge the phase into the epic branch

That kept each review small while still allowing the full prototype to land as one coherent branch into `main`.

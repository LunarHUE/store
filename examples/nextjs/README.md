This is a focused [Next.js](https://nextjs.org) App Router example for
[`@lunarhue/store`](../../packages/store).

It demonstrates:

- `actions(...)` for typed mutations
- `persist(...)` with `PersistStoreProvider`
- selector-first component boundaries, where badges, buttons, totals, and sync
  indicators subscribe at the leaf instead of in a broad parent
- Tailwind 4 styling with a restrained, editorial UI

## Getting Started

Run the example from this workspace:

```bash
bun run dev
```

The example build scripts compile `packages/store` first, then start the Next
app. Open [http://localhost:3000](http://localhost:3000) to view the demo.

## Files

- `app/page.tsx`: server-rendered shell
- `components/planner/*`: split client-side panels and leaf selector components
- `lib/planner-store.ts`: store builder, actions, persist wiring, and
  selectors
- `lib/catalog.ts`: shared static catalog data

## Verify

```bash
bun run typecheck
bun run lint
bun run build
```

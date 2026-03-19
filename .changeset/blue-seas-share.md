---
"@lunarhue/store": minor
---

Add an opt-in runtime debugger for `@lunarhue/store` with structured event logging for store lifecycle, subscriptions, React-owned initialization, and persist flows.

Runtime stores can now be created with `debug` options, builder-owned providers and `useLocalStore` can forward those options, and plugins can emit custom events through `StorePluginContext.logger.emit(...)`.

Also add example usage of a custom debug sink in the Next.js example app.

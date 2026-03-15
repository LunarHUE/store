import { expectType } from 'tsd'

import { createStore, type StoreBuilder } from '../../dist/core/index.js'

const definition = createStore({ count: 0 }).extend(() => ({
  pluginValue: 'ok' as const,
}))

const store = definition.create()

expectType<StoreBuilder<{ count: number }, { pluginValue: 'ok' }>>(definition)
expectType<number>(store.get().count)
expectType<'ok'>(store.pluginValue)

createStore(0).extend(({ store }) => {
  store.setState((prev) => prev + 1)
  store.setState(() => 1)

  return {}
})

import { expectType } from 'tsd'

import { createStore } from '../../dist/core/index.js'

const definition = createStore({ count: 0 }).extend(() => ({
  pluginValue: 'ok' as const,
}))

const store = definition.create()

expectType<number>(store.get().count)
expectType<'ok'>(store.pluginValue)

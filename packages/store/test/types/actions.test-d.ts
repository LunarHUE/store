import { expectType } from 'tsd'

import { createStore } from '../../dist/core/index.js'
import { actions } from '../../dist/plugins/actions/index.js'

const builder = createStore({ count: 0 }).extend(
  actions(({ setState }) => ({
    increment(step: number) {
      setState((prev) => ({ count: prev.count + step }))
    },
  })),
)

const store = builder.create()

expectType<(step: number) => void>(store.actions.increment)

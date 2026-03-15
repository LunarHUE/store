import { expectType } from 'tsd'

import { createStore, type Store } from '../../dist/core/index.js'
import {
  createStoreContext,
  useSelector,
  useStore,
} from '../../dist/react/index.js'

const builder = createStore({ count: 0 }).extend(() => ({
  label: 'ok' as const,
}))

const context = createStoreContext(builder)
const store: Store<{ count: number }, { label: 'ok' }> = builder.create()

expectType<Store<{ count: number }, { label: 'ok' }>>(useStore(builder))
expectType<(props: {
  value: Store<{ count: number }, { label: 'ok' }>
  children?: React.ReactNode
}) => React.JSX.Element>(context.Provider)
expectType<Store<{ count: number }, { label: 'ok' }>>(context.useStore())
expectType<number>(useSelector(store, (state) => state.count))

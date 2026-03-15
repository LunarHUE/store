import { createContext } from 'react'

import type { Store, StoreBuilder } from '../core'

const contextMap = new WeakMap<
  StoreBuilder<any, any>,
  ReturnType<typeof createContext<Store<any, any> | undefined>>
>()

export function getStoreContext<TState, TPlugins>(
  builder: StoreBuilder<TState, TPlugins>,
) {
  let context = contextMap.get(builder as StoreBuilder<any, any>)

  if (!context) {
    context = createContext<Store<TState, TPlugins> | undefined>(undefined)
    contextMap.set(builder as StoreBuilder<any, any>, context)
  }

  return context as ReturnType<
    typeof createContext<Store<TState, TPlugins> | undefined>
  >
}

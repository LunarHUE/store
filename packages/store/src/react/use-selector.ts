import { useStore as useTanStackStore } from '@tanstack/react-store'

import type { Store, TanStackStore } from '../core'

type StoreState<TStore> = TStore extends { get: () => infer TState }
  ? TState
  : never

export function useSelector<TStore extends Store<any, any>, TSelected>(
  store: TStore,
  selector: (state: StoreState<TStore>) => TSelected,
  compare?: (a: TSelected, b: TSelected) => boolean,
): TSelected {
  return useTanStackStore<TanStackStore<StoreState<TStore>>, TSelected>(
    store as TanStackStore<StoreState<TStore>>,
    selector,
    compare,
  )
}

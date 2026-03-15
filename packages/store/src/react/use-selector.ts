import { useStore as useTanStackStore } from '@tanstack/react-store'
import type { Store as BaseStore } from '@tanstack/store'

import type { Store, StoreState } from '../core'

export function useSelector<
  TStore extends Store<any, any>,
  TSelected,
  TState extends StoreState<TStore>,
>(
  store: TStore,
  selector: (snapshot: TState) => TSelected,
  compare?: (a: TSelected, b: TSelected) => boolean,
): TSelected {
  return useTanStackStore<BaseStore<TState>, TSelected>(
    store as BaseStore<TState>,
    selector,
    compare,
  )
}

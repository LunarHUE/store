import { useStore as useTanStackStore } from '@tanstack/react-store'

import type { AnyStore, StoreState, TanStackStore } from '../core'

export function useSelector<
  TStore extends AnyStore,
  TSelected,
  TState extends StoreState<TStore>,
>(
  store: TStore,
  selector: (snapshot: TState) => TSelected,
  compare?: (a: TSelected, b: TSelected) => boolean,
): TSelected {
  return useTanStackStore<TanStackStore<TState>, TSelected>(
    store as TanStackStore<TState>,
    selector,
    compare,
  )
}

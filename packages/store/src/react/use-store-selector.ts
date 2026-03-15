import { useStore } from './use-store'
import { useSelector } from './use-selector'

import type { StoreBuilder, StoreState } from '../core'

export function useStoreSelector<
  TState,
  TPlugins,
  TSelected,
  TBuilder extends StoreBuilder<TState, TPlugins>,
>(
  builder: TBuilder,
  selector: (snapshot: StoreState<ReturnType<TBuilder['create']>>) => TSelected,
  compare?: (a: TSelected, b: TSelected) => boolean,
): TSelected {
  const store = useStore(builder)

  return useSelector(store, selector, compare)
}

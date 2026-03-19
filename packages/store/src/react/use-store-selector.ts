import { useStore } from './use-store'
import { useSelector } from './use-selector'

import type { StoreBuilder, StoreState } from '../core'

/**
 * Convenience hook that resolves a builder-scoped runtime store from context
 * and subscribes to a selected slice of its state.
 *
 * This has the same matching-provider requirement as {@link useStore}.
 */
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

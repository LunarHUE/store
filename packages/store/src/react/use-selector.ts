import { useStore as useTanStackStore } from '@tanstack/react-store'
import type { Store as BaseStore } from '@tanstack/store'

import type { Store, StoreState } from '../core'

/**
 * Subscribes to a selected slice of a runtime store instance.
 *
 * Use this when you already have a runtime store object. For builder-scoped
 * selection through context, use {@link useStoreSelector}.
 */
export function useSelector<
    TStore extends Store<any, any>,
    TSelected,
    TState extends StoreState<TStore>,
>(
    store: TStore,
    selector: (snapshot: TState) => TSelected,
    compare?: (a: TSelected, b: TSelected) => boolean
): TSelected {
    return useTanStackStore<BaseStore<TState>, TSelected>(
        store as BaseStore<TState>,
        selector,
        compare
    )
}

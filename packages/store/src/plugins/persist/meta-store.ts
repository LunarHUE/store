import { createStoreInstance } from '../../core/store-instance'

import type { PersistMeta } from './types'

export function createPersistMetaStore(initialState: PersistMeta) {
  return createStoreInstance(initialState).store
}

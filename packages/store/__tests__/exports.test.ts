import { describe, expect, it } from 'vitest'

describe('package exports', () => {
  it('exposes the built subpath entrypoints', async () => {
    const core = await import('../dist/core/index.js')
    const react = await import('../dist/react/index.js')
    const actions = await import('../dist/plugins/actions/index.js')
    const persist = await import('../dist/plugins/persist/index.js')

    expect(core.createStore).toBeTypeOf('function')
    expect(react.StoreProvider).toBeTypeOf('function')
    expect(react.useLocalStore).toBeTypeOf('function')
    expect(react.useStore).toBeTypeOf('function')
    expect(react.useStoreSelector).toBeTypeOf('function')
    expect(react.useSelector).toBeTypeOf('function')
    expect(actions.actions).toBeTypeOf('function')
    expect(actions.createAction).toBeTypeOf('function')
    expect(actions.useActions).toBeTypeOf('function')
    expect(persist.persist).toBeTypeOf('function')
    expect(persist.PersistStoreProvider).toBeTypeOf('function')
    expect(persist.usePersistentStore).toBeTypeOf('function')
    expect(persist.usePersistSelector).toBeTypeOf('function')
    expect(persist.PersistenceBoundary).toBeTypeOf('function')
  })
})

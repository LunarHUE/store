import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const packageJson = JSON.parse(
  readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
)

const expectedExports = {
  './core': {
    import: './dist/core/index.js',
    types: './dist/core/index.d.ts',
  },
  './react': {
    import: './dist/react/index.js',
    types: './dist/react/index.d.ts',
  },
  './plugins/actions': {
    import: './dist/plugins/actions/index.js',
    types: './dist/plugins/actions/index.d.ts',
  },
  './plugins/persist': {
    import: './dist/plugins/persist/index.js',
    types: './dist/plugins/persist/index.d.ts',
  },
}

function assertExportsMatchPackageContract() {
  assert.equal(
    packageJson.types,
    undefined,
    'package root should not declare a types entry without a root export',
  )
  assert.deepEqual(
    packageJson.exports,
    expectedExports,
    'package exports map should match the supported public entrypoints exactly',
  )

  for (const target of Object.values(expectedExports)) {
    assert.ok(
      existsSync(path.join(packageRoot, target.import)),
      `Missing built import target: ${target.import}`,
    )
    assert.ok(
      existsSync(path.join(packageRoot, target.types)),
      `Missing built type target: ${target.types}`,
    )
  }
}

async function assertRuntimeImports() {
  for (const specifier of Object.keys(expectedExports).map((subpath) =>
    `@lunarhue/store${subpath.slice(1)}`,
  )) {
    await import(specifier)
  }

  await assert.rejects(
    () => import('@lunarhue/store'),
    (error) => error?.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED',
    'package root should not be importable',
  )
  await assert.rejects(
    () => import('@lunarhue/store/core/types'),
    (error) => error?.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED',
    'private core internals should not be importable',
  )
  await assert.rejects(
    () => import('@lunarhue/store/plugins/persist/types'),
    (error) => error?.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED',
    'private plugin internals should not be importable',
  )
}

function runTypeScriptCheck(cwd, files, shouldPass) {
  const tscPath = require.resolve('typescript/bin/tsc')
  const result = spawnSync(
    process.execPath,
    [
      tscPath,
      '--noEmit',
      '--target',
      'ES2022',
      '--lib',
      'ES2022,DOM',
      '--module',
      'nodenext',
      '--moduleResolution',
      'nodenext',
      '--jsx',
      'react-jsx',
      '--skipLibCheck',
      '--types',
      'node',
      ...files,
    ],
    {
      cwd,
      encoding: 'utf8',
    },
  )

  if (shouldPass) {
    assert.equal(
      result.status,
      0,
      `Expected TypeScript to pass.\n${result.stdout}${result.stderr}`,
    )
    return
  }

  assert.notEqual(result.status, 0, 'Expected TypeScript to fail')
  assert.match(
    `${result.stdout}${result.stderr}`,
    /Cannot find module '@lunarhue\/store|Cannot find module '@lunarhue\/store\/core\/types|Cannot find module '@lunarhue\/store\/plugins\/persist\/types/,
    'Expected TypeScript to reject private or missing package entrypoints',
  )
}

function writeTypeFixtures() {
  const tempDir = mkdtempSync(path.join(packageRoot, '.contract-'))
  const packageLinkDir = path.join(tempDir, 'node_modules', '@lunarhue')
  mkdirSync(packageLinkDir, { recursive: true })
  symlinkSync(packageRoot, path.join(packageLinkDir, 'store'), 'dir')

  const consumerFixturePath = path.join(tempDir, 'consumer.ts')
  writeFileSync(
    consumerFixturePath,
    `import { createStore, type StoreDebugEventName, type StoreDebugLevel, type StoreState } from '@lunarhue/store/core'
import { actions, createAction, useActions } from '@lunarhue/store/plugins/actions'
import { PersistStoreProvider, persist, type PersistStoreProviderProps, type PersistedStore, usePersistentStore } from '@lunarhue/store/plugins/persist'
import { StoreProvider, type StoreProviderProps, useLocalStore, useSelector, useStore, useStoreSelector } from '@lunarhue/store/react'

type CounterState = { count: number }

const increment = createAction<CounterState>(({ setState }) => {
  setState((prev) => ({ count: prev.count + 1 }))
})

const CounterStore = createStore<CounterState>()
  .extend(actions(() => ({ increment })))
  .extend(persist({ onPersist: async () => {} }))

type CounterRuntime = ReturnType<typeof CounterStore.create>
type CounterSnapshot = StoreState<CounterRuntime>
const debugLevel: StoreDebugLevel = 'trace'

const store: PersistedStore<CounterState, { actions: { increment(): void } }> =
  CounterStore.create(undefined, {
    debug: {
      level: debugLevel,
      console: false,
      sink(event) {
        const eventName: StoreDebugEventName = event.event
        void eventName
      },
    },
  })
const initializePromise: Promise<void> = store.setInitialState({ count: 0 })
const snapshot: CounterSnapshot = store.get()
const status = store.lifecycle.meta.get().status
const flushPromise: Promise<void> = store.persist.flush()
const providerInitialStateProps: StoreProviderProps<CounterState> = {
  builder: CounterStore,
  debug: { console: false },
  initialState: { count: 1 },
}
const providerLoadInitialStateProps: StoreProviderProps<CounterState> = {
  builder: CounterStore,
  debug: { level: 'verbose' },
  loadInitialState: async () => ({ count: 2 }),
}
const persistProviderInitialStateProps: PersistStoreProviderProps<CounterState> = {
  builder: CounterStore,
  debug: { console: false },
  initialState: { count: 3 },
}
const persistProviderLoadInitialStateProps: PersistStoreProviderProps<CounterState> = {
  builder: CounterStore,
  debug: { level: 'verbose' },
  loadInitialState: async () => ({ count: 4 }),
}
useLocalStore(CounterStore, {
  debug: { level: 'trace' },
  loadInitialState: async () => ({ count: 5 }),
})
// @ts-expect-error initialState and loadInitialState are mutually exclusive
const invalidProviderProps: StoreProviderProps<CounterState> = { builder: CounterStore, initialState: { count: 6 }, loadInitialState: async () => ({ count: 7 }) }
// @ts-expect-error initialState and loadInitialState are mutually exclusive
const invalidPersistProviderProps: PersistStoreProviderProps<CounterState> = { builder: CounterStore, initialState: { count: 8 }, loadInitialState: async () => ({ count: 9 }) }
// @ts-expect-error initialState and loadInitialState are mutually exclusive
useLocalStore(CounterStore, { initialState: { count: 10 }, loadInitialState: async () => ({ count: 11 }) })

store.actions.increment()
void initializePromise
void snapshot
void status
void debugLevel
void flushPromise
void providerInitialStateProps
void providerLoadInitialStateProps
void persistProviderInitialStateProps
void persistProviderLoadInitialStateProps
void invalidProviderProps
void invalidPersistProviderProps
void StoreProvider
void PersistStoreProvider
void useActions
void useLocalStore
void usePersistentStore
void useSelector
void useStore
void useStoreSelector
`,
  )

  const pluginAuthorFixturePath = path.join(tempDir, 'plugin-author.ts')
  writeFileSync(
    pluginAuthorFixturePath,
    `import { createStore, type StorePlugin } from '@lunarhue/store/core'

type CounterState = { count: number }
type LoggerSurface = {
  logSnapshot(): void
}

function logger(label: string): StorePlugin<CounterState, any, LoggerSurface> {
  return ({ store, logger, onDispose }) => {
    logger.emit({
      source: 'plugin.logger',
      event: 'plugin.logger.ready',
      minimumLevel: 'verbose',
      detail: { label },
    })

    const subscription = store.subscribe((state) => {
      console.log(label, state.count)
    })

    onDispose(() => {
      subscription.unsubscribe()
    })

    return {
      logSnapshot() {
        console.log(label, store.get().count)
      },
    }
  }
}

const CounterStore = createStore<CounterState>({ count: 0 }).extend(
  logger('demo'),
)

const store = CounterStore.create()
store.logSnapshot()
`,
  )

  const invalidFixturePath = path.join(tempDir, 'invalid-imports.ts')
  writeFileSync(
    invalidFixturePath,
    `import type { Store } from '@lunarhue/store'
import type { StoreState } from '@lunarhue/store/core/types'
import type { PersistMeta } from '@lunarhue/store/plugins/persist/types'

type RootStore = Store<unknown>
type InternalStoreState = StoreState<any>
type InternalPersistMeta = PersistMeta
`,
  )

  return {
    consumerFixturePath,
    invalidFixturePath,
    pluginAuthorFixturePath,
    tempDir,
  }
}

async function main() {
  assertExportsMatchPackageContract()
  await assertRuntimeImports()

  const fixtures = writeTypeFixtures()

  try {
    runTypeScriptCheck(
      fixtures.tempDir,
      [fixtures.consumerFixturePath, fixtures.pluginAuthorFixturePath],
      true,
    )
    runTypeScriptCheck(fixtures.tempDir, [fixtures.invalidFixturePath], false)
  } finally {
    rmSync(fixtures.tempDir, { force: true, recursive: true })
  }

  console.log('Package contract checks passed.')
}

await main()

import type { Store } from './types'
import type {
  StoreDebugEvent,
  StoreDebugEventName,
  StoreDebugLevel,
  StoreDebugOptions,
  StoreLifecycleMeta,
} from './types'

const builderDebugMetadataKey = Symbol('lunarhue.store.debug.builder')
const storeDebugMetadataKey = Symbol('lunarhue.store.debug.store')

const debugLevelRank: Record<StoreDebugLevel, number> = {
  basic: 0,
  verbose: 1,
  trace: 2,
}

let nextBuilderId = 1
let nextStoreId = 1
let nextSubscriptionId = 1

type ResolvedStoreDebugOptions<TState> = {
  enabled: boolean
  level: StoreDebugLevel
  console: boolean
  sink?: ((event: StoreDebugEvent<TState>) => void) | undefined
}

export type StoreBuilderDebugMetadata = {
  builderId: string
}

export type StoreDebugMetadata<TState> = {
  builderId: string
  storeId: string
  sequence: number
  options: ResolvedStoreDebugOptions<TState>
}

type WritableReadableStore<TState> = {
  get(): TState
  setState(updater: (prev: TState) => TState): void
}

export function createBuilderDebugMetadata(): StoreBuilderDebugMetadata {
  return {
    builderId: `b${nextBuilderId++}`,
  }
}

export function defineBuilderDebugMetadata<TBuilder extends object>(
  builder: TBuilder,
  metadata: StoreBuilderDebugMetadata,
): void {
  Object.defineProperty(builder, builderDebugMetadataKey, {
    configurable: false,
    enumerable: false,
    value: metadata,
    writable: false,
  })
}

export function getBuilderDebugMetadata<TBuilder extends object>(
  builder: TBuilder,
): StoreBuilderDebugMetadata | undefined {
  return (
    builder as TBuilder & {
      [builderDebugMetadataKey]?: StoreBuilderDebugMetadata
    }
  )[builderDebugMetadataKey]
}

export function createStoreDebugMetadata<TState>(args: {
  builderId: string
  debug?: StoreDebugOptions<TState>
}): StoreDebugMetadata<TState> {
  return {
    builderId: args.builderId,
    storeId: `s${nextStoreId++}`,
    sequence: 0,
    options: resolveStoreDebugOptions(args.debug),
  }
}

export function defineStoreDebugMetadata<TState>(
  store: Store<TState, any>,
  metadata: StoreDebugMetadata<TState>,
): void {
  Object.defineProperty(store, storeDebugMetadataKey, {
    configurable: false,
    enumerable: false,
    value: metadata,
    writable: false,
  })
}

export function getStoreDebugMetadata<TState>(
  store: Store<TState, any>,
): StoreDebugMetadata<TState> | undefined {
  return (
    store as Store<TState, any> & {
      [storeDebugMetadataKey]?: StoreDebugMetadata<TState>
    }
  )[storeDebugMetadataKey]
}

export function createSubscriptionDebugId(): string {
  return `sub${nextSubscriptionId++}`
}

export function shouldEmitStoreDebugEvent(
  configuredLevel: StoreDebugLevel,
  minimumLevel: StoreDebugLevel,
): boolean {
  return debugLevelRank[configuredLevel] >= debugLevelRank[minimumLevel]
}

export function emitStoreDebugEvent<TState>(
  store: Store<TState, any>,
  args: {
    event: StoreDebugEventName
    source: StoreDebugEvent<TState>['source']
    minimumLevel?: StoreDebugLevel
    status?: StoreLifecycleMeta['status']
    subscriptionId?: string
    detail?: Record<string, unknown>
    previousState?: TState
    nextState?: TState
    error?: unknown
  },
): StoreDebugEvent<TState> | null {
  const metadata = getStoreDebugMetadata(store)

  if (!metadata?.options.enabled) {
    return null
  }

  const minimumLevel = args.minimumLevel ?? 'basic'

  if (!shouldEmitStoreDebugEvent(metadata.options.level, minimumLevel)) {
    return null
  }

  const event: StoreDebugEvent<TState> = {
    builderId: metadata.builderId,
    event: args.event,
    level: metadata.options.level,
    sequence: ++metadata.sequence,
    source: args.source,
    storeId: metadata.storeId,
    timestamp: Date.now(),
  }

  if (args.detail !== undefined) {
    event.detail = args.detail
  }

  if (args.error !== undefined) {
    event.error = args.error
  }

  if (args.status !== undefined) {
    event.status = args.status
  }

  if (args.subscriptionId !== undefined) {
    event.subscriptionId = args.subscriptionId
  }

  if (metadata.options.level === 'trace') {
    if (args.previousState !== undefined) {
      event.previousState = args.previousState
    }

    if (args.nextState !== undefined) {
      event.nextState = args.nextState
    }
  }

  if (metadata.options.console) {
    writeStoreDebugConsoleEvent(event)
  }

  if (metadata.options.sink) {
    try {
      metadata.options.sink(event)
    } catch (error) {
      console.error('[lunarhue/store][debug] sink failed', error)
    }
  }

  return event
}

export function transitionStoreLifecycle<TState>(
  store: Store<TState, any>,
  lifecycleMeta: WritableReadableStore<StoreLifecycleMeta>,
  nextState: StoreLifecycleMeta,
  args?: {
    source?: StoreDebugEvent<TState>['source']
    minimumLevel?: StoreDebugLevel
    detail?: Record<string, unknown>
  },
): void {
  const previousState = lifecycleMeta.get()
  lifecycleMeta.setState(() => nextState)

  if (
    previousState.status === nextState.status &&
    Object.is(previousState.error, nextState.error)
  ) {
    return
  }

  emitStoreDebugEvent(store, {
    detail: args?.detail,
    error: nextState.error ?? undefined,
    event: 'store.lifecycle.changed',
    minimumLevel: args?.minimumLevel,
    source: args?.source ?? 'core',
    status: nextState.status,
  })
}

function resolveStoreDebugOptions<TState>(
  debug?: StoreDebugOptions<TState>,
): ResolvedStoreDebugOptions<TState> {
  if (!debug) {
    return {
      console: false,
      enabled: false,
      level: 'basic',
    }
  }

  return {
    console: debug.console ?? true,
    enabled: true,
    level: debug.level ?? 'basic',
    sink: debug.sink,
  }
}

function writeStoreDebugConsoleEvent<TState>(
  event: StoreDebugEvent<TState>,
): void {
  const method =
    event.error !== undefined ||
    event.event.endsWith('.error') ||
    event.event.endsWith('.failed')
      ? console.error
      : console.log

  method('[lunarhue/store][debug]', event)
}

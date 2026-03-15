import React, { useRef } from 'react'
import ReactDOM from 'react-dom/client'

import { createStore } from '@lunarhue/store/core'
import {
  actions,
  createAction,
  useActions,
} from '@lunarhue/store/plugins/actions'
import {
  PersistStoreProvider,
  persist,
  usePersistentStore,
} from '@lunarhue/store/plugins/persist'
import { useSelector, useStore, useStoreSelector } from '@lunarhue/store/react'

type DemoState = {
  count: number
  draft: string
  items: string[]
}

const STORAGE_KEY = 'lunarhue.store.react-basic'
const DEMO_INITIAL_STATE: DemoState = {
  count: 0,
  draft: '',
  items: [],
}

const increment = createAction<DemoState>(({ setState }) => {
  setState((prev) => ({
    ...prev,
    count: prev.count + 1,
  }))
})

const setDraft = createAction<DemoState, [draft: string]>(
  ({ setState }, draft) => {
    setState((prev) =>
      prev.draft === draft
        ? prev
        : {
            ...prev,
            draft,
          },
    )
  },
)

const DemoStore = createStore<DemoState>(DEMO_INITIAL_STATE)
  .extend(
    actions(({ setState }) => ({
      increment,
      setDraft,
      addItem() {
        setState((prev) => {
          const label = prev.draft.trim()

          if (!label) {
            return prev
          }

          return {
            ...prev,
            draft: '',
            items: [...prev.items, label],
          }
        })
      },
      removeItem(index: number) {
        setState((prev) => ({
          ...prev,
          items: prev.items.filter((_, currentIndex) => currentIndex !== index),
        }))
      },
    })),
  )
  .extend(
    persist({
      flushOnDispose: true,
      delay: 400,
      async hydrate({ store: runtimeStore }) {
        const serialized = window.localStorage.getItem(STORAGE_KEY)

        if (!serialized) {
          await runtimeStore.hydrate(runtimeStore.get())
          return
        }

        await runtimeStore.hydrate(JSON.parse(serialized) as DemoState)
      },
      async onPersist({ nextState }) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
      },
    }),
  )

const panelSurface = {
  background: 'rgba(255, 255, 255, 0.84)',
  border: '1px solid rgba(19, 33, 47, 0.08)',
  borderRadius: 24,
  padding: 24,
} as const

function formatPersistLabel(lastPersistedAt: number | null) {
  if (!lastPersistedAt) {
    return 'Not persisted yet'
  }

  return new Date(lastPersistedAt).toLocaleTimeString()
}

interface RenderBadgeProps {
  name: string
}

function RenderBadge(props: RenderBadgeProps) {
  const renders = useRef(0)
  renders.current += 1

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        background: 'rgba(19, 33, 47, 0.08)',
        color: '#31465c',
        fontSize: 12,
        letterSpacing: '0.08em',
        padding: '6px 10px',
        textTransform: 'uppercase',
      }}
    >
      <span>{props.name}</span>
      <strong>{renders.current}x</strong>
    </div>
  )
}

function CountPanel() {
  const store = useStore(DemoStore)
  const actions = useActions(store)
  const count = useStoreSelector(DemoStore, (state) => state.count)

  return (
    <article
      style={{
        background: '#13212f',
        color: '#f8f2e6',
        borderRadius: 24,
        padding: 24,
      }}
    >
      <RenderBadge name="Count panel renders: " />
      <p
        style={{ margin: '18px 0 0', opacity: 0.7, textTransform: 'uppercase' }}
      >
        Count
      </p>
      <p style={{ margin: '12px 0', fontSize: 56, lineHeight: 1 }}>{count}</p>
      <button
        onClick={() => actions.increment()}
        style={{
          border: 0,
          borderRadius: 999,
          background: '#f1c27d',
          color: '#13212f',
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 700,
          padding: '12px 18px',
        }}
      >
        Increment via actions()
      </button>
    </article>
  )
}

function PersistMetaPanel() {
  const { flush, store } = usePersistentStore(DemoStore)
  // Subscribe to the meta store
  const persistMeta = useSelector(store.persist.meta, (meta) => meta)

  const resetDemo = async (): Promise<void> => {
    window.localStorage.removeItem(STORAGE_KEY)
    await store.hydrate(DEMO_INITIAL_STATE)
    store.persist.meta.setState(() => ({
      isHydrated: true,
      pending: false,
      persisting: false,
      lastPersistedAt: null,
      error: null,
    }))
  }

  return (
    <article style={panelSurface}>
      <RenderBadge name="Persist panel renders: " />
      <p
        style={{ margin: '18px 0 0', opacity: 0.7, textTransform: 'uppercase' }}
      >
        Persist meta
      </p>
      <dl
        style={{
          margin: '16px 0 0',
          display: 'grid',
          gap: 10,
          fontSize: 15,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <dt>Hydrated</dt>
          <dd style={{ margin: 0 }}>{String(persistMeta.isHydrated)}</dd>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <dt>Pending</dt>
          <dd style={{ margin: 0 }}>{String(persistMeta.pending)}</dd>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <dt>Persisting</dt>
          <dd style={{ margin: 0 }}>{String(persistMeta.persisting)}</dd>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <dt>Last persisted</dt>
          <dd style={{ margin: 0 }}>
            {formatPersistLabel(persistMeta.lastPersistedAt)}
          </dd>
        </div>
      </dl>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => {
            void flush()
          }}
          style={{
            marginTop: 18,
            borderRadius: 999,
            border: '1px solid rgba(19, 33, 47, 0.14)',
            background: '#fff',
            color: '#13212f',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            padding: '10px 16px',
          }}
        >
          Flush now
        </button>
        <button
          onClick={() => {
            void resetDemo()
          }}
          style={{
            marginTop: 18,
            borderRadius: 999,
            border: '1px solid rgba(19, 33, 47, 0.14)',
            background: '#13212f',
            color: '#fff8ec',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            padding: '10px 16px',
          }}
        >
          Reset demo
        </button>
      </div>
      <p
        style={{
          margin: '16px 0 0',
          color: '#55697f',
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        Typing in the draft field should not bump this render count. Persist
        updates only rerender this panel.
      </p>
    </article>
  )
}

function DraftComposer() {
  const store = useStore(DemoStore)
  const actions = useActions(store)
  const draft = useStoreSelector(DemoStore, (state) => state.draft)

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 16,
      }}
    >
      <div style={{ flex: '1 1 100%', marginBottom: 4 }}>
        <RenderBadge name="Draft input renders: " />
      </div>
      <input
        value={draft}
        onChange={(event) => actions.setDraft(event.currentTarget.value)}
        placeholder="Add something worth persisting"
        style={{
          flex: '1 1 240px',
          minWidth: 0,
          borderRadius: 14,
          border: '1px solid rgba(19, 33, 47, 0.12)',
          padding: '14px 16px',
          fontSize: 16,
        }}
      />
      <button
        onClick={() => actions.addItem()}
        style={{
          border: 0,
          borderRadius: 14,
          background: '#13212f',
          color: '#fff8ec',
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 700,
          padding: '14px 18px',
        }}
      >
        Add item
      </button>
    </div>
  )
}

function ItemsList() {
  const store = useStore(DemoStore)
  const actions = useActions(store)
  const items = useStoreSelector(DemoStore, (state) => state.items)

  return (
    <>
      <RenderBadge name="Items list renders: " />
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '16px 0 0',
          display: 'grid',
          gap: 12,
        }}
      >
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'center',
              padding: '14px 16px',
              borderRadius: 16,
              background: '#f8f5ef',
            }}
          >
            <span>{item}</span>
            <button
              onClick={() => actions.removeItem(index)}
              style={{
                border: 0,
                borderRadius: 999,
                background: '#edd9b8',
                color: '#58381f',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                padding: '8px 12px',
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

function ExampleScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(255, 211, 145, 0.45), transparent 40%), linear-gradient(135deg, #fff8ec 0%, #f3efe7 55%, #e6eff6 100%)',
        color: '#13212f',
        fontFamily: 'Georgia, Cambria, "Times New Roman", serif',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'grid',
          gap: 24,
        }}
      >
        <section
          style={{
            background: 'rgba(255, 255, 255, 0.78)',
            border: '1px solid rgba(19, 33, 47, 0.08)',
            borderRadius: 28,
            padding: 28,
            boxShadow: '0 24px 60px rgba(19, 33, 47, 0.08)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#7f5a34',
            }}
          >
            @lunarhue/store
          </p>
          <h1
            style={{
              margin: '12px 0 10px',
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              lineHeight: 0.95,
            }}
          >
            Builder-based state with plugin-owned React APIs
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: 680,
              fontSize: 18,
              lineHeight: 1.6,
              color: '#31465c',
            }}
          >
            This example uses the public subpath exports only: a store builder
            in core, selector-driven React reads, typed actions, persisted
            hydration, meta selectors, and a flush boundary.
          </p>
          <p
            style={{
              margin: '18px 0 0',
              maxWidth: 680,
              fontSize: 14,
              lineHeight: 1.6,
              color: '#55697f',
            }}
          >
            The render badges below let you see which selector consumer actually
            rerenders. Typing into the draft input should mainly move the draft
            badge. Incrementing should mainly move the count badge.
          </p>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          <CountPanel />
          <PersistMetaPanel />
        </section>

        <section style={panelSurface}>
          <DraftComposer />
          <ItemsList />
        </section>
      </div>
    </div>
  )
}

function App() {
  return (
    <PersistStoreProvider
      builder={DemoStore}
      flushOnUnmount
      flushOnPageHide
      flushOnBackground
    >
      <ExampleScreen />
    </PersistStoreProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

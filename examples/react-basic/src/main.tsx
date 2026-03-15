import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'

import { createStore } from '@lunarhue/store/core'
import { actions, useActions } from '@lunarhue/store/plugins/actions'
import {
  PersistenceBoundary,
  persist,
  usePersistentStore,
  usePersistSelector,
} from '@lunarhue/store/plugins/persist'
import { createStoreContext, useSelector, useStore } from '@lunarhue/store/react'

type DemoState = {
  count: number
  draft: string
  items: string[]
}

const STORAGE_KEY = 'lunarhue.store.react-basic'

const DemoStore = createStore<DemoState>({
  count: 0,
  draft: '',
  items: [],
})
  .extend(
    actions(({ setState }) => ({
      increment() {
        setState((prev) => ({
          ...prev,
          count: prev.count + 1,
        }))
      },
      setDraft(draft: string) {
        setState((prev) =>
          prev.draft === draft
            ? prev
            : {
                ...prev,
                draft,
              },
        )
      },
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
    }),
  )

const DemoStoreContext = createStoreContext(DemoStore)

function formatPersistLabel(lastPersistedAt: number | null) {
  if (!lastPersistedAt) {
    return 'Not persisted yet'
  }

  return new Date(lastPersistedAt).toLocaleTimeString()
}

function ExampleScreen() {
  const store = useStore(DemoStore)
  const actions = useActions(store)
  const count = useSelector(store, (state) => state.count)
  const draft = useSelector(store, (state) => state.draft)
  const items = useSelector(store, (state) => state.items)
  const { isHydrated, flush } = usePersistentStore(store, {
    key: STORAGE_KEY,
    delay: 400,
    ready: true,
    async hydrate(runtimeStore) {
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
  })
  const persistMeta = usePersistSelector(store, (meta) => meta)

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
            This example uses the public subpath exports only: a store builder in
            core, selector-driven React reads, typed actions, persisted hydration,
            meta selectors, and a flush boundary.
          </p>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          <article
            style={{
              background: '#13212f',
              color: '#f8f2e6',
              borderRadius: 24,
              padding: 24,
            }}
          >
            <p style={{ margin: 0, opacity: 0.7, textTransform: 'uppercase' }}>
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

          <article
            style={{
              background: 'rgba(255, 255, 255, 0.84)',
              border: '1px solid rgba(19, 33, 47, 0.08)',
              borderRadius: 24,
              padding: 24,
            }}
          >
            <p style={{ margin: 0, opacity: 0.7, textTransform: 'uppercase' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <dt>Hydrated</dt>
                <dd style={{ margin: 0 }}>{String(isHydrated)}</dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <dt>Pending</dt>
                <dd style={{ margin: 0 }}>{String(persistMeta.pending)}</dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <dt>Persisting</dt>
                <dd style={{ margin: 0 }}>{String(persistMeta.persisting)}</dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <dt>Last persisted</dt>
                <dd style={{ margin: 0 }}>
                  {formatPersistLabel(persistMeta.lastPersistedAt)}
                </dd>
              </div>
            </dl>
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
          </article>
        </section>

        <section
          style={{
            background: 'rgba(255, 255, 255, 0.84)',
            border: '1px solid rgba(19, 33, 47, 0.08)',
            borderRadius: 24,
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
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

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
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
        </section>
      </div>
    </div>
  )
}

function App() {
  const storeRef = useRef<ReturnType<typeof DemoStore.create> | null>(null)

  if (!storeRef.current) {
    storeRef.current = DemoStore.create()
  }

  useEffect(() => {
    const store = storeRef.current

    return () => {
      if (!store) {
        return
      }

      void store.dispose()
    }
  }, [])

  return (
    <DemoStoreContext.Provider value={storeRef.current}>
      <PersistenceBoundary
        store={storeRef.current}
        flushOnUnmount
        flushOnPageHide
        flushOnBackground
      >
        <ExampleScreen />
      </PersistenceBoundary>
    </DemoStoreContext.Provider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

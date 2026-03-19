import { useSelector } from '@lunarhue/store/react'
import {
  type PersistMeta,
  usePersistentStore,
} from '@lunarhue/store/plugins/persist'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MetaRow } from '@/components/ui/meta-row'
import { RenderBadge } from '@/components/ui/render-badge'
import { Separator } from '@/components/ui/separator'
import {
  DEMO_INITIAL_STATE,
  STORAGE_KEY,
  demoStoreBuilder,
} from '@/store/demo-store'

const resetPersistMeta: PersistMeta = {
  error: null,
  lastPersistedAt: null,
  pending: false,
  persisting: false,
}

function StoreStatusValue() {
  const { store } = usePersistentStore(demoStoreBuilder)
  const value = store.lifecycle.meta.get().status

  return <span>{String(value)}</span>
}

function PendingValue() {
  const { store } = usePersistentStore(demoStoreBuilder)
  const value = useSelector(store.persist.meta, (meta) => meta.pending)

  return <span>{String(value)}</span>
}

function PersistingValue() {
  const { store } = usePersistentStore(demoStoreBuilder)
  const value = useSelector(store.persist.meta, (meta) => meta.persisting)

  return <span>{String(value)}</span>
}

function LastPersistedValue() {
  const { store } = usePersistentStore(demoStoreBuilder)
  const value = useSelector(store.persist.meta, (meta) => meta.lastPersistedAt)

  return (
    <span>
      {value ? new Date(value).toLocaleTimeString() : 'Not persisted yet'}
    </span>
  )
}

function FlushButton() {
  const { flush, store } = usePersistentStore(demoStoreBuilder)
  const isBusy = useSelector(
    store.persist.meta,
    (meta) => meta.pending || meta.persisting,
  )

  return (
    <Button
      disabled={isBusy}
      onClick={() => {
        void flush()
      }}
      variant="secondary"
    >
      Flush now
    </Button>
  )
}

function ResetButton() {
  const { store } = usePersistentStore(demoStoreBuilder)

  const resetDemo = async (): Promise<void> => {
    window.localStorage.removeItem(STORAGE_KEY)
    store.setState(() => DEMO_INITIAL_STATE)
    store.persist.meta.setState(() => resetPersistMeta)
  }

  return (
    <Button
      onClick={() => {
        void resetDemo()
      }}
    >
      Reset demo
    </Button>
  )
}

export function PersistMetaPanel() {
  return (
    <Card>
      <CardHeader className="gap-3">
        <RenderBadge label="Persist meta" />
        <div className="grid gap-2">
          <Badge className="justify-self-start" variant="accent">
            Persistence
          </Badge>
          <CardTitle>
            Core readiness and persist metadata can be observed separately.
          </CardTitle>
          <CardDescription className="max-w-xl">
            Reset and flush stay as dedicated controls, while the status rows
            read from either the core lifecycle meta store or the persist meta
            store as needed.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5">
        <dl className="grid">
          <MetaRow label="Store status" value={<StoreStatusValue />} />
          <Separator />
          <MetaRow label="Pending" value={<PendingValue />} />
          <Separator />
          <MetaRow label="Persisting" value={<PersistingValue />} />
          <Separator />
          <MetaRow label="Last persisted" value={<LastPersistedValue />} />
        </dl>

        <div className="flex flex-wrap gap-3">
          <FlushButton />
          <ResetButton />
        </div>
      </CardContent>
    </Card>
  )
}

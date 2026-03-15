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
  isHydrated: true,
  lastPersistedAt: null,
  pending: false,
  persisting: false,
}

function HydratedValue() {
  const { store } = usePersistentStore(demoStoreBuilder)
  const value = useSelector(store.persist.meta, (meta) => meta.isHydrated)

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
    await store.hydrate(DEMO_INITIAL_STATE)
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
            Meta fields can each subscribe to the persist store directly.
          </CardTitle>
          <CardDescription className="max-w-xl">
            Reset and flush stay as dedicated controls, while each displayed
            value reads only the persist field it renders.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5">
        <dl className="grid">
          <MetaRow label="Hydrated" value={<HydratedValue />} />
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

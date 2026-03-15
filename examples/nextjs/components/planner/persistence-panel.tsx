'use client'

import { useSelector } from '@lunarhue/store/react'
import { Save } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { usePlannerPersistentStore } from '@/components/planner/hooks'

import { PanelHeader } from './panel-header'

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
})

export function PersistencePanel() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <PanelHeader
          eyebrow="Persistence"
          title="Runtime status"
          description="PersistStoreProvider hydrates from localStorage and the status row reads only the persistence meta store."
          action={<FlushNowButton />}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <HydrationBadge />
          <PendingBadge />
        </div>
        <LastSavedLabel />
        <PersistErrorLabel />
      </CardContent>
    </Card>
  )
}

function HydrationBadge() {
  const { store } = usePlannerPersistentStore()
  const isHydrated = useSelector(store.persist.meta, (meta) => meta.isHydrated)

  return <Badge variant={isHydrated ? 'default' : 'outline'}>{isHydrated ? 'Hydrated' : 'Waiting to hydrate'}</Badge>
}

function PendingBadge() {
  const { store } = usePlannerPersistentStore()
  const isPending = useSelector(
    store.persist.meta,
    (meta) => meta.pending || meta.persisting,
  )

  return <Badge variant={isPending ? 'secondary' : 'outline'}>{isPending ? 'Sync pending' : 'Sync idle'}</Badge>
}

function LastSavedLabel() {
  const { store } = usePlannerPersistentStore()
  const lastPersistedAt = useSelector(
    store.persist.meta,
    (meta) => meta.lastPersistedAt,
  )

  return (
    <p className="text-sm text-muted-foreground">
      {lastPersistedAt
        ? `Last saved at ${timeFormatter.format(lastPersistedAt)}.`
        : 'No persisted write yet in this session.'}
    </p>
  )
}

function PersistErrorLabel() {
  const { store } = usePlannerPersistentStore()
  const hasError = useSelector(store.persist.meta, (meta) => meta.error !== null)

  return (
    <p className={hasError ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
      {hasError
        ? 'Persistence hit an error. The next write will retry automatically.'
        : 'Local storage is used only for this example.'}
    </p>
  )
}

function FlushNowButton() {
  const { flush } = usePlannerPersistentStore()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        void flush()
      }}
    >
      <Save className="size-3.5" />
      Flush
    </Button>
  )
}

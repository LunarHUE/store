'use client'

import { useStoreSelector } from '@lunarhue/store/react'
import { Minus, Plus, RotateCcw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CATALOG_BY_ID, formatCurrency } from '@/lib/catalog'
import { PlannerStore } from '@/lib/planner-store'

import { usePlannerActions } from './hooks'
import { PanelHeader } from './panel-header'
import { StatCard } from './stat-card'
import { INITIAL_STATE } from '@/lib/cookies'

export function SummaryPanel() {
  return (
    <Card className="flex min-h-0 flex-1 flex-col shadow-none">
      <CardHeader className="gap-4">
        <PanelHeader
          eyebrow="Plan"
          title="Selections"
          description="Totals, guest count, and line items stay isolated so broad container renders don’t subscribe to the whole store."
          action={<LoadSamplePlanButton />}
        />
      </CardHeader>

      <CardContent className="flex flex-1 min-h-0 flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <EstimatedTotalStat />
          <TotalUnitsStat />
          <DistinctSelectionsStat />
        </div>

        <GuestCountCard />

        <div className="flex flex-1 min-h-0 flex-col">
          <SelectionList />

          <div className="flex justify-end pt-2">
            <ClearPlanButton />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EstimatedTotalStat() {
  const selections = useStoreSelector(PlannerStore, (state) => state.selections)
  const itemById = (id: string) => CATALOG_BY_ID[id]
  const estimatedTotal = Object.entries(selections).reduce(
    (total, [id, quantity]) => {
      const item = itemById(id)
      return total + (item?.price ?? 0) * quantity
    },
    0,
  )
  return (
    <StatCard
      label="Estimated total"
      value={formatCurrency(estimatedTotal)}
      detail="Derived from active line totals"
    />
  )
}

function TotalUnitsStat() {
  const selections = useStoreSelector(PlannerStore, (state) => state.selections)
  const totalUnits = Object.values(selections).reduce(
    (total, quantity) => total + quantity,
    0,
  )

  return (
    <StatCard
      label="Units"
      value={`${totalUnits}`}
      detail="All selected quantities"
    />
  )
}

function DistinctSelectionsStat() {
  const distinctSelections = useStoreSelector(
    PlannerStore,
    (state) => Object.keys(state.selections).length,
  )

  return (
    <StatCard
      label="Line items"
      value={`${distinctSelections}`}
      detail="Selection rows subscribe by id"
    />
  )
}

function GuestCountCard() {
  return (
    <Card size="sm" className="shadow-none">
      <CardContent className="flex items-center justify-between gap-3 px-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Guests
          </p>
          <GuestCountValue />
        </div>
        <div className="flex gap-2">
          <DecreaseGuestsButton />
          <IncreaseGuestsButton />
        </div>
      </CardContent>
    </Card>
  )
}

function GuestCountValue() {
  const guestCount = useStoreSelector(PlannerStore, (state) => state.guestCount)

  return (
    <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
      {guestCount}
    </p>
  )
}

function DecreaseGuestsButton() {
  const actions = usePlannerActions()
  const canDecrease = useStoreSelector(
    PlannerStore,
    (state) => state.guestCount > 1,
  )

  return (
    <Button
      variant="outline"
      size="icon-sm"
      disabled={!canDecrease}
      onClick={() => {
        actions.decrementGuests()
      }}
    >
      <Minus className="size-3.5" />
    </Button>
  )
}

function IncreaseGuestsButton() {
  const actions = usePlannerActions()

  return (
    <Button
      size="icon-sm"
      onClick={() => {
        actions.incrementGuests()
      }}
    >
      <Plus className="size-3.5" />
    </Button>
  )
}

const isEqualUnordered = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false
  return [...a].sort().every((v, i) => v === [...b].sort()[i])
}
function SelectionList() {
  const selectedProductIds = useStoreSelector(
    PlannerStore,
    (state) => Object.keys(state.selections),
    isEqualUnordered,
  )

  if (selectedProductIds.length === 0) {
    return (
      <div className="flex-1 rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
        No selections yet. Each row will subscribe only to its own quantity and
        line total.
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="space-y-2">
        {selectedProductIds.map((productId) => (
          <SelectionRow key={productId} productId={productId} />
        ))}
      </div>
    </div>
  )
}

function SelectionRow({ productId }: { productId: string }) {
  const item = CATALOG_BY_ID[productId]

  if (!item) {
    return null
  }

  return (
    <Card size="sm" className="shadow-none">
      <CardContent className="flex items-center justify-between gap-3 px-3">
        <div className="min-w-0">
          <CardTitle className="truncate text-sm">{item.name}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCurrency(item.price)} / {item.unitLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <SelectionQuantity productId={productId} />
            <LineTotal productId={productId} />
          </div>
          <div className="flex gap-2">
            <RowRemoveButton productId={productId} />
            <RowAddButton productId={productId} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SelectionQuantity({ productId }: { productId: string }) {
  const quantity = useStoreSelector(
    PlannerStore,
    (state) => state.selections[productId] ?? 0,
  )

  return <Badge variant="outline">{quantity} in plan</Badge>
}

function LineTotal({ productId }: { productId: string }) {
  const catalogItem = CATALOG_BY_ID[productId]
  const quantity = useStoreSelector(
    PlannerStore,
    (state) => state.selections[productId] ?? 0,
  )
  const lineTotal = quantity * (catalogItem?.price ?? 0)

  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {formatCurrency(lineTotal)}
    </p>
  )
}

function RowAddButton({ productId }: { productId: string }) {
  const actions = usePlannerActions()

  return (
    <Button
      size="icon-sm"
      onClick={() => {
        actions.addItem(productId)
      }}
    >
      <Plus className="size-3.5" />
    </Button>
  )
}

function RowRemoveButton({ productId }: { productId: string }) {
  const actions = usePlannerActions()
  const canRemove = useStoreSelector(
    PlannerStore,
    (state) => state.selections[productId] ?? 0 > 0,
  )

  return (
    <Button
      variant="outline"
      size="icon-sm"
      disabled={!canRemove}
      onClick={() => {
        actions.removeItem(productId)
      }}
    >
      <Minus className="size-3.5" />
    </Button>
  )
}

function ClearPlanButton() {
  const actions = usePlannerActions()
  const canClearPlan = useStoreSelector(
    PlannerStore,
    (state) => Object.keys(state.selections).length > 0,
  )

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={!canClearPlan}
      onClick={() => {
        actions.clearPlan()
      }}
    >
      Clear selections
    </Button>
  )
}

function LoadSamplePlanButton() {
  const actions = usePlannerActions()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        actions.loadSamplePlan(INITIAL_STATE)
      }}
    >
      <RotateCcw className="size-3.5" />
      Reload sample
    </Button>
  )
}

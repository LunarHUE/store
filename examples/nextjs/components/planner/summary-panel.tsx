'use client'

import { useStoreSelector } from '@lunarhue/store/react'
import { Minus, Plus, RotateCcw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CATALOG_BY_ID, formatCurrency } from '@/lib/catalog'
import {
  PlannerStore,
  compareStringArrays,
  selectCanClearPlan,
  selectCanDecreaseGuests,
  selectCanRemoveItem,
  selectCoverageNote,
  selectDistinctSelections,
  selectEstimatedTotal,
  selectGuestCount,
  selectLineTotal,
  selectQuantityFor,
  selectSelectedProductIds,
  selectTotalUnits,
} from '@/lib/planner-store'

import { usePlannerActions } from './hooks'
import { PanelHeader } from './panel-header'
import { StatCard } from './stat-card'

export function SummaryPanel() {
  return (
    <Card className="shadow-none h-full">
      <CardHeader className="gap-4">
        <PanelHeader
          eyebrow="Plan"
          title="Selections"
          description="Totals, guest count, and line items stay isolated so broad container renders don’t subscribe to the whole store."
          action={<LoadSamplePlanButton />}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <EstimatedTotalStat />
          <TotalUnitsStat />
          <DistinctSelectionsStat />
        </div>
        <GuestCountCard />
        <CoverageNote />
        <Separator />
        <SelectionList />
        <div className="flex justify-end">
          <ClearPlanButton />
        </div>
      </CardContent>
    </Card>
  )
}

function EstimatedTotalStat() {
  const estimatedTotal = useStoreSelector(PlannerStore, selectEstimatedTotal)

  return (
    <StatCard
      label="Estimated total"
      value={formatCurrency(estimatedTotal)}
      detail="Derived from active line totals"
    />
  )
}

function TotalUnitsStat() {
  const totalUnits = useStoreSelector(PlannerStore, selectTotalUnits)

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
    selectDistinctSelections,
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
  const guestCount = useStoreSelector(PlannerStore, selectGuestCount)

  return (
    <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
      {guestCount}
    </p>
  )
}

function DecreaseGuestsButton() {
  const actions = usePlannerActions()
  const canDecrease = useStoreSelector(PlannerStore, selectCanDecreaseGuests)

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

function CoverageNote() {
  const note = useStoreSelector(PlannerStore, selectCoverageNote)

  return (
    <div className="rounded-lg border border-border bg-muted/45 px-3 py-2.5 text-sm text-foreground">
      {note}
    </div>
  )
}

function SelectionList() {
  const selectedProductIds = useStoreSelector(
    PlannerStore,
    selectSelectedProductIds,
    compareStringArrays,
  )

  if (selectedProductIds.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
        No selections yet. Each row will subscribe only to its own quantity and
        line total.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {selectedProductIds.map((productId) => (
        <SelectionRow key={productId} productId={productId} />
      ))}
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
  const quantity = useStoreSelector(PlannerStore, selectQuantityFor(productId))

  return <Badge variant="outline">{quantity} in plan</Badge>
}

function LineTotal({ productId }: { productId: string }) {
  const lineTotal = useStoreSelector(PlannerStore, selectLineTotal(productId))

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
    selectCanRemoveItem(productId),
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
  const canClearPlan = useStoreSelector(PlannerStore, selectCanClearPlan)

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
        actions.loadSamplePlan()
      }}
    >
      <RotateCcw className="size-3.5" />
      Reload sample
    </Button>
  )
}

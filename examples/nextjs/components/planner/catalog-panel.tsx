'use client'

import { startTransition, useDeferredValue } from 'react'

import { useStoreSelector } from '@lunarhue/store/react'
import { RotateCcw, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  CATALOG,
  PRODUCT_CATEGORIES,
  formatCurrency,
  type CatalogItem,
  type ProductCategory,
} from '@/lib/catalog'
import { PlannerStore } from '@/lib/planner-store'

import { usePlannerActions } from './hooks'
import { PanelHeader } from './panel-header'

export function CatalogPanel() {
  return (
    <Card className="flex min-h-0 flex-1 flex-col shadow-none">
      <CardHeader className="gap-4">
        <PanelHeader
          eyebrow="Catalog"
          title="Build the plan"
          description="The panel stays broad, but filters, badges, and buttons subscribe only where their own state is used."
          action={<ResetFiltersButton />}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">selector-first</Badge>
          <Badge variant="secondary">client leaves</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <SearchField />
          <div className="flex flex-wrap gap-2">
            <CategoryButton category="all" label="All" />
            {PRODUCT_CATEGORIES.map((category) => (
              <CategoryButton
                key={category.id}
                category={category.id}
                label={category.label}
              />
            ))}
          </div>
        </div>
        <Separator />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CatalogList />
        </div>
      </CardContent>
    </Card>
  )
}

function SearchField() {
  const actions = usePlannerActions()
  const search = useStoreSelector(PlannerStore, (state) => state.search)

  return (
    <label className="relative flex items-center">
      <Search className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground" />
      <Input
        value={search}
        onChange={(event) => {
          startTransition(() => {
            actions.setSearch(event.target.value)
          })
        }}
        placeholder="Search coffee, pastry, supplies..."
        className="h-9 pl-8"
      />
    </label>
  )
}

function CategoryButton({
  category,
  label,
}: {
  category: ProductCategory | 'all'
  label: string
}) {
  const actions = usePlannerActions()
  const isActive = useStoreSelector(
    PlannerStore,
    (state) => state.activeCategory === category,
  )

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      aria-pressed={isActive}
      onClick={() => {
        actions.setCategory(category)
      }}
    >
      {label}
    </Button>
  )
}

function ResetFiltersButton() {
  const actions = usePlannerActions()
  const hasFilters = useStoreSelector(
    PlannerStore,
    (state) => state.search.trim().length > 0 || state.activeCategory !== 'all',
  )

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={!hasFilters}
      onClick={() => {
        actions.clearFilters()
      }}
    >
      <RotateCcw className="size-3.5" />
      Reset
    </Button>
  )
}

function CatalogList() {
  const activeCategory = useStoreSelector(
    PlannerStore,
    (state) => state.activeCategory,
  )
  const search = useStoreSelector(PlannerStore, (state) => state.search)
  const deferredSearch = useDeferredValue(search)
  const normalizedSearch = deferredSearch.trim().toLowerCase()

  const filteredItems = CATALOG.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || item.category === activeCategory
    const matchesSearch =
      normalizedSearch.length === 0 ||
      `${item.name} ${item.detail}`.toLowerCase().includes(normalizedSearch)

    return matchesCategory && matchesSearch
  })

  if (filteredItems.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
        No items match the current filter.
      </div>
    )
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {filteredItems.map((item) => (
        <ProductCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function ProductCard({ item }: { item: CatalogItem }) {
  return (
    <Card size="sm" className="shadow-none">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge variant="outline" className="capitalize">
              {item.category}
            </Badge>
            <div>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription className="mt-1.5">
                {item.detail}
              </CardDescription>
            </div>
          </div>
          <QuantityBadge productId={item.id} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div>
            <dt className="font-medium uppercase tracking-[0.16em]">Rate</dt>
            <dd className="mt-1 text-sm text-foreground">
              {formatCurrency(item.price)} / {item.unitLabel}
            </dd>
          </div>
          <div>
            <dt className="font-medium uppercase tracking-[0.16em]">
              Lead time
            </dt>
            <dd className="mt-1 text-sm text-foreground">{item.leadTime}</dd>
          </div>
        </dl>
        <div className="flex gap-2">
          <RemoveItemButton productId={item.id} />
          <AddItemButton productId={item.id} />
        </div>
      </CardContent>
    </Card>
  )
}

function QuantityBadge({ productId }: { productId: string }) {
  const quantity = useStoreSelector(
    PlannerStore,
    (state) => state.selections[productId] ?? 0,
  )

  return (
    <Badge variant={quantity > 0 ? 'default' : 'outline'}>{quantity}</Badge>
  )
}

function AddItemButton({ productId }: { productId: string }) {
  const actions = usePlannerActions()

  return (
    <Button
      className="flex-1"
      size="sm"
      onClick={() => {
        actions.addItem(productId)
      }}
    >
      Add
    </Button>
  )
}

function RemoveItemButton({ productId }: { productId: string }) {
  const actions = usePlannerActions()
  const canRemove = useStoreSelector(
    PlannerStore,
    (state) => state.selections[productId] ?? 0 > 0,
  )

  return (
    <Button
      variant="outline"
      className="flex-1"
      size="sm"
      disabled={!canRemove}
      onClick={() => {
        actions.removeItem(productId)
      }}
    >
      Remove
    </Button>
  )
}

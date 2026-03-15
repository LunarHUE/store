export const PRODUCT_CATEGORIES = [
  { id: 'coffee', label: 'Coffee' },
  { id: 'tea', label: 'Tea' },
  { id: 'pastry', label: 'Pastry' },
  { id: 'supplies', label: 'Supplies' },
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]['id']

export type CatalogItem = {
  id: string
  category: ProductCategory
  name: string
  detail: string
  price: number
  unitLabel: string
  leadTime: string
}

export const CATALOG = [
  {
    id: 'morning-roast',
    category: 'coffee',
    name: 'Morning Roast',
    detail: 'Nutty house blend that covers about eight guests.',
    price: 18,
    unitLabel: 'carafe',
    leadTime: '15 min',
  },
  {
    id: 'single-origin-service',
    category: 'coffee',
    name: 'Single Origin Service',
    detail: 'Brighter pour-over setup with tasting cards for six.',
    price: 24,
    unitLabel: 'service',
    leadTime: '20 min',
  },
  {
    id: 'jasmine-tea',
    category: 'tea',
    name: 'Jasmine Tea Pot',
    detail: 'Loose-leaf green tea with honey and lemon.',
    price: 14,
    unitLabel: 'pot',
    leadTime: '10 min',
  },
  {
    id: 'earl-grey-service',
    category: 'tea',
    name: 'Earl Grey Service',
    detail: 'Classic black tea with oat milk and raw sugar.',
    price: 13,
    unitLabel: 'pot',
    leadTime: '10 min',
  },
  {
    id: 'cardamom-buns',
    category: 'pastry',
    name: 'Cardamom Buns',
    detail: 'Warm tray of six, sliced for quick sharing.',
    price: 24,
    unitLabel: 'tray',
    leadTime: '25 min',
  },
  {
    id: 'citrus-loaf',
    category: 'pastry',
    name: 'Citrus Loaf',
    detail: 'Pre-cut loaf with yogurt glaze and sea salt.',
    price: 19,
    unitLabel: 'loaf',
    leadTime: '15 min',
  },
  {
    id: 'sparkling-water',
    category: 'supplies',
    name: 'Sparkling Water',
    detail: 'Chilled twelve-bottle crate for longer sessions.',
    price: 16,
    unitLabel: 'crate',
    leadTime: '5 min',
  },
  {
    id: 'ceramic-cup-set',
    category: 'supplies',
    name: 'Ceramic Cup Set',
    detail: 'Reusable cups and saucers for ten guests.',
    price: 9,
    unitLabel: 'set',
    leadTime: '5 min',
  },
] satisfies ReadonlyArray<CatalogItem>

export const CATALOG_BY_ID = Object.fromEntries(
  CATALOG.map((item) => [item.id, item]),
) as Record<string, CatalogItem>

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount)
}

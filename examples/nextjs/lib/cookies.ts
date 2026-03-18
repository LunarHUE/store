import { type PlannerState } from './planner-store'

const SAMPLE_SELECTIONS = {
  'ceramic-cup-set': 2,
  'citrus-loaf': 1,
  'jasmine-tea': 1,
  'morning-roast': 2,
}

export const INITIAL_STATE: PlannerState = {
  activeCategory: 'all',
  guestCount: 18,
  notes: 'Keep the setup quick to reset between team sessions.',
  search: '',
  selections: SAMPLE_SELECTIONS,
}

export const DEMO_STORAGE_KEY = 'lunarhue.store.nextjs.example'

export async function getPlannerStateFromServerCookies(): Promise<PlannerState> {
  try {
    const { cookies } = await import('next/headers')
    const store = await cookies()

    const raw = store.get(DEMO_STORAGE_KEY)?.value
    if (!raw) return INITIAL_STATE

    return JSON.parse(decodeURIComponent(raw)) as PlannerState
  } catch {
    return INITIAL_STATE
  }
}

export function getPlannerStateFromClientCookies(
  key: string = DEMO_STORAGE_KEY,
): PlannerState {
  if (typeof document === 'undefined') {
    return INITIAL_STATE
  }

  const prefix = `${key}=`
  const parts = document.cookie.split('; ')

  for (const part of parts) {
    if (part.startsWith(prefix)) {
      try {
        return JSON.parse(
          decodeURIComponent(part.slice(prefix.length)),
        ) as PlannerState
      } catch {
        return INITIAL_STATE
      }
    }
  }

  return INITIAL_STATE
}

export function setPlannerStateToClientCookies(
  state: PlannerState,
  key: string = DEMO_STORAGE_KEY,
) {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = `${key}=${encodeURIComponent(JSON.stringify(state))}`
}

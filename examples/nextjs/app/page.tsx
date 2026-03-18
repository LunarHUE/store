import { PlannerDemo } from '@/components/planner/demo'

import { getPlannerStateFromServerCookies } from '@/lib/cookies'

export default async function Home() {
  const initialState = await getPlannerStateFromServerCookies()
  return (
    <main className="h-screen overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <PlannerDemo initialState={initialState} />
      </div>
    </main>
  )
}

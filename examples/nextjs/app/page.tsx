import { PlannerDemo } from '@/components/planner/demo'

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <PlannerDemo />
      </div>
    </main>
  )
}

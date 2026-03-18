'use client'

import { startTransition } from 'react'

import { useStoreSelector } from '@lunarhue/store/react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { PlannerStore } from '@/lib/planner-store'

import { usePlannerActions } from './hooks'
import { PanelHeader } from './panel-header'

export function NotesPanel() {
  return (
    <Card className="shadow-none h-[250px]">
      <CardHeader>
        <PanelHeader
          eyebrow="Notes"
          title="Briefing"
          description="This field owns its own subscription instead of pushing note state up into a wider panel tree."
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <NotesField />
      </CardContent>
    </Card>
  )
}

function NotesField() {
  const actions = usePlannerActions()
  const notes = useStoreSelector(PlannerStore, (state) => state.notes)

  return (
    <Textarea
      value={notes}
      onChange={(event) => {
        startTransition(() => {
          actions.setNotes(event.target.value)
        })
      }}
      placeholder="Add timing, setup, or allergy notes."
      className="h-28 resize-none"
    />
  )
}

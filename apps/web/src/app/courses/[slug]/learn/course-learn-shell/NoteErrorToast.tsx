'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'

export function NoteErrorToast({ logic }: { logic: LearnPageLogicResult }) {
  if (!logic.noteError) return null
  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 shadow-lg">
      <span>{logic.noteError}</span>
      <button type="button" onClick={() => logic.setNoteError(null)} className="ml-3 text-red-300 hover:text-red-100">?</button>
    </div>
  )
}

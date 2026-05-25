export function LearningPathErrorAlert({ error }: { error: string | null }) {
  if (!error) return null

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {error}
    </div>
  )
}

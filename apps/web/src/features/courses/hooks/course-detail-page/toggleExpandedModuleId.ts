import type { SetStateAction } from 'react'

export function toggleExpandedModuleId(moduleId: string): SetStateAction<Set<string>> {
  return (previous) => {
    const next = new Set(previous)

    if (next.has(moduleId)) {
      next.delete(moduleId)
    } else {
      next.add(moduleId)
    }

    return next
  }
}

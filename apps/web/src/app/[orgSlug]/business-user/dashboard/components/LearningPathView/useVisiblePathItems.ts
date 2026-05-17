import { useCallback, useEffect, useState } from 'react'
import type { AssignedLearningPath } from '../../types'
import {
  INITIAL_VISIBLE_PATH_ITEMS,
  PATH_ITEMS_INCREMENT,
  STANDALONE_PATH_ID,
} from './constants'

export function useVisiblePathItems(
  learningPaths: AssignedLearningPath[],
  standaloneItemsLength: number,
) {
  const [visibleItemsByPath, setVisibleItemsByPath] = useState<Record<string, number>>({})

  useEffect(() => {
    setVisibleItemsByPath((current) => {
      const next: Record<string, number> = {}

      for (const learningPath of learningPaths) {
        next[learningPath.id] = Math.min(
          current[learningPath.id] ?? INITIAL_VISIBLE_PATH_ITEMS,
          learningPath.items.length,
        )
      }

      if (standaloneItemsLength > 0) {
        next[STANDALONE_PATH_ID] = Math.min(
          current[STANDALONE_PATH_ID] ?? INITIAL_VISIBLE_PATH_ITEMS,
          standaloneItemsLength,
        )
      }

      return next
    })
  }, [learningPaths, standaloneItemsLength])

  const showMorePathItems = useCallback((pathId: string, totalItems: number) => {
    setVisibleItemsByPath((current) => ({
      ...current,
      [pathId]: Math.min(
        (current[pathId] ?? INITIAL_VISIBLE_PATH_ITEMS) + PATH_ITEMS_INCREMENT,
        totalItems,
      ),
    }))
  }, [])

  return { showMorePathItems, visibleItemsByPath }
}

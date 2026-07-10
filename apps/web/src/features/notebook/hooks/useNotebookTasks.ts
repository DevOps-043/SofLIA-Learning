'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  fetchNotebookTasks,
  updateDerivedTask,
} from '../services/notebook.client.service'
import type {
  NotebookDerivedTaskListItem,
  NotebookDerivedTaskStatus,
} from '../types'

export type NotebookTaskFilter = NotebookDerivedTaskStatus | 'all'

export function useNotebookTasks(params: {
  orgSlug: string
  enabled: boolean
  status: NotebookTaskFilter
  courseId?: string
}) {
  const [tasks, setTasks] = useState<NotebookDerivedTaskListItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    if (!params.enabled || !params.orgSlug) return
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      const page = await fetchNotebookTasks(params.orgSlug, {
        status: params.status,
        courseId: params.courseId,
      })
      if (requestId !== requestIdRef.current) return
      setTasks(page.tasks)
      setNextCursor(page.nextCursor)
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [params.courseId, params.enabled, params.orgSlug, params.status])

  useEffect(() => {
    void load()
    return () => {
      requestIdRef.current += 1
    }
  }, [load])

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const page = await fetchNotebookTasks(params.orgSlug, {
        status: params.status,
        courseId: params.courseId,
        cursor: nextCursor,
      })
      setTasks((current) => {
        const seen = new Set(current.map((task) => task.taskId))
        return [...current, ...page.tasks.filter((task) => !seen.has(task.taskId))]
      })
      setNextCursor(page.nextCursor)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, nextCursor, params.courseId, params.orgSlug, params.status])

  const setTaskStatus = useCallback(
    async (
      taskId: string,
      status: Exclude<NotebookDerivedTaskStatus, 'suggested'>,
    ): Promise<boolean> => {
      const previous = tasks
      setTasks((current) =>
        current.map((task) => (task.taskId === taskId ? { ...task, status } : task)),
      )
      try {
        const updated = await updateDerivedTask(params.orgSlug, taskId, status)
        setTasks((current) =>
          current.map((task) =>
            task.taskId === taskId ? { ...task, ...updated } : task,
          ),
        )
        return true
      } catch {
        setTasks(previous)
        return false
      }
    },
    [params.orgSlug, tasks],
  )

  return {
    tasks,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    reload: load,
    loadMore,
    setTaskStatus,
  }
}

'use client'

import { useCallback, useState } from 'react'
import {
  drainTranscodingQueue,
  reprocessTranscodingJob,
  scanAndQueueVideos,
} from './api'
import type { DrainResponse, ScanResponse } from './types'

interface UseTranscodingOperationsParams {
  fetchJobs: () => Promise<void>
}

export function useTranscodingOperations({ fetchJobs }: UseTranscodingOperationsParams) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [isDraining, setIsDraining] = useState(false)
  const [drainResult, setDrainResult] = useState<DrainResponse | null>(null)

  const triggerScan = useCallback(async () => {
    setIsScanning(true)
    setScanResult(null)
    try {
      const body = await scanAndQueueVideos()
      setScanResult(body)
      if (body.success) await fetchJobs()
    } catch (issue) {
      setScanResult({
        success: false,
        totalFound: 0,
        alreadyDone: 0,
        queued: 0,
        invoked: 0,
        jobIds: [],
        error: issue instanceof Error ? issue.message : 'Error',
      })
    } finally {
      setIsScanning(false)
    }
  }, [fetchJobs])

  const triggerDrain = useCallback(async () => {
    setIsDraining(true)
    setDrainResult(null)
    try {
      const body = await drainTranscodingQueue()
      setDrainResult(body)
      if (body.success) await fetchJobs()
    } catch (issue) {
      setDrainResult({
        success: false,
        invoked: 0,
        error: issue instanceof Error ? issue.message : 'Error',
      })
    } finally {
      setIsDraining(false)
    }
  }, [fetchJobs])

  const reprocessJob = useCallback(async (
    sourcePath: string,
    bucket: string,
    contentType: string,
  ) => {
    try {
      await reprocessTranscodingJob(sourcePath, bucket, contentType)
      await fetchJobs()
    } catch {
      // La fila reflejara el error en el refresco automatico si persiste.
    }
  }, [fetchJobs])

  return {
    drainResult,
    isDraining,
    isScanning,
    reprocessJob,
    scanResult,
    triggerDrain,
    triggerScan,
  }
}

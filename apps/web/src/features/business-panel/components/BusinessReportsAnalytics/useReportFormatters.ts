import { useCallback } from 'react'
import type { ReportsAnalyticsBreakdownItem } from '../../types/reports-analytics.types'
import { translateDimension, translateKey } from './translations'
import type { ReportsAnalyticsT } from './types'

export function useReportFormatters(t: ReportsAnalyticsT) {
  const formatAgeBands = useCallback(
    (item: ReportsAnalyticsBreakdownItem) => translateDimension(t, 'ageBands', item),
    [t],
  )
  const formatGender = useCallback(
    (item: ReportsAnalyticsBreakdownItem) => translateDimension(t, 'gender', item),
    [t],
  )
  const formatProgress = useCallback(
    (item: ReportsAnalyticsBreakdownItem) => translateDimension(t, 'progressBands', item),
    [t],
  )
  const formatJobTitles = useCallback(
    (item: ReportsAnalyticsBreakdownItem) => (
      item.key === 'unspecified' ? translateKey(t, 'gender', 'unspecified') : item.label
    ),
    [t],
  )

  return { formatAgeBands, formatGender, formatProgress, formatJobTitles }
}

export type ChartDatum = Record<string, string | number | null | undefined>

export interface GroupedBarKey {
  key: string
  label: string
  color: string
}

export const getChartNumber = (value: ChartDatum[string]): number => (
  typeof value === 'number' ? value : Number(value ?? 0)
)

export const getChartLabel = (value: ChartDatum[string]): string => (
  typeof value === 'string' || typeof value === 'number' ? String(value) : ''
)

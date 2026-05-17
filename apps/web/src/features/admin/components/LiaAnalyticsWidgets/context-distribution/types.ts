export interface ContextData {
  contextType: string
  count: number
  cost: number
  tokens: number
  percentage: number
}

export interface ChartContextData extends ContextData {
  name: string
  color: string
  [key: string]: string | number
}

export interface ContextTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartContextData }>
}

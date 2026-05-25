import type { ComponentType } from 'react'
import type * as ReactGridLayout from 'react-grid-layout'

export type WidgetConfig = ReactGridLayout.Layout
export type ResponsiveGridLayoutProps = ReactGridLayout.ResponsiveProps
export type WidthProviderProps = ReactGridLayout.WidthProviderProps
export type WidgetType = 'stats' | 'users' | 'courses' | 'activity'

export interface ReactGridLayoutModule {
  default: ComponentType<ResponsiveGridLayoutProps>
  WidthProvider: <P>(component: ComponentType<P>) => ComponentType<P & WidthProviderProps>
}

export interface DashboardLayout {
  id: string | null
  name: string
  layout_config: { widgets: WidgetConfig[] }
  is_default: boolean
}

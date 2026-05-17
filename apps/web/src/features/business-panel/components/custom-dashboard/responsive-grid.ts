import type { ComponentType } from 'react'
import type { ReactGridLayoutModule, ResponsiveGridLayoutProps, WidthProviderProps } from './custom-dashboard.types'

export let ResponsiveGrid: ComponentType<ResponsiveGridLayoutProps & WidthProviderProps> | null = null

if (typeof window !== 'undefined') {
  const reactGridLayout = require('react-grid-layout') as ReactGridLayoutModule
  ResponsiveGrid = reactGridLayout.WidthProvider(reactGridLayout.default)
}

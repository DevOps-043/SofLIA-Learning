import type React from 'react';

export interface GridLayoutItem {
  h: number;
  i: string;
  minH?: number;
  minW?: number;
  w: number;
  x: number;
  y: number;
}

export type GridLayouts = {
  lg?: GridLayoutItem[];
} & Record<string, GridLayoutItem[] | undefined>;

export interface ResponsiveLayoutComponentProps {
  children: React.ReactNode;
  className: string;
  cols: Record<string, number>;
  compactType: null | 'horizontal' | 'vertical';
  draggableHandle: string;
  isDraggable: boolean;
  isResizable: boolean;
  layouts: GridLayouts;
  margin: [number, number];
  onLayoutChange: (layout: GridLayoutItem[], layouts: GridLayouts) => void;
  preventCollision: boolean;
  rowHeight: number;
}

export type ResponsiveLayoutComponent = React.ComponentType<ResponsiveLayoutComponentProps>;

export interface ReactGridLayoutModule {
  Responsive?: ResponsiveLayoutComponent;
  WidthProvider?: (component: ResponsiveLayoutComponent) => ResponsiveLayoutComponent;
  default?: ResponsiveLayoutComponent;
}

export interface WidgetConfig {
  id: string;
  type: string;
  position: { x: number; y: number; w: number; h: number };
}

export type WidgetChildElement = React.ReactElement<{ 'data-swapy-item'?: string }>;

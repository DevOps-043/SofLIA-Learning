export type NanoBananaDomain = 'ui' | 'photo' | 'diagram'
export type OutputFormat = 'wireframe' | 'mockup' | 'render' | 'diagram'
export type Emphasis = 'primary' | 'secondary' | 'background' | 'accent'
export type Position =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export interface NanoBananaMeta {
  domain: NanoBananaDomain
  style: string
  outputFormat: OutputFormat
  version: string
  createdAt: string
  title?: string
  description?: string
}

export interface NanoBananaEnvironment {
  lighting: string
  background: string
  mood: string
  colorScheme?: 'light' | 'dark' | 'custom'
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
}

export interface NanoBananaScene {
  id: string
  description: string
  environment: NanoBananaEnvironment
  dimensions?: { width: string; height: string }
}

export interface NanoBananaEntity {
  id: string
  type: string
  name: string
  properties: Record<string, unknown>
  position: Position | string
  emphasis: Emphasis
  children?: NanoBananaEntity[]
}

export interface AccessibilityConstraints {
  minTouchTarget?: string
  contrastRatio?: string
  colorBlindSafe?: boolean
  ariaLabels?: boolean
  focusIndicators?: boolean
}

export interface NanoBananaConstraints {
  accessibility?: AccessibilityConstraints
  brandGuidelines?: Record<string, unknown>
  technicalRequirements?: Record<string, unknown>
}

export interface NanoBananaVariation {
  id: string
  description: string
  changes: Record<string, unknown>
}

export interface NanoBananaSchema {
  meta: NanoBananaMeta
  scene: NanoBananaScene
  entities: NanoBananaEntity[]
  constraints: NanoBananaConstraints
  variations?: NanoBananaVariation[]
}

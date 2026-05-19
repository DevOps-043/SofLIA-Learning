'use client'

import { isValidElement } from 'react'
import type { ComponentType } from 'react'
import dynamic from 'next/dynamic'
import type { Props as JoyrideProps } from 'react-joyride'

type JoyrideModuleShape = {
  default?: unknown
}

function isJoyrideComponent(value: unknown): value is ComponentType<JoyrideProps> {
  return typeof value === 'function'
}

function resolveJoyrideModule(moduleValue: unknown): ComponentType<JoyrideProps> {
  if (isJoyrideComponent(moduleValue)) {
    return moduleValue
  }

  const moduleDefault = (moduleValue as JoyrideModuleShape | null)?.default
  if (isJoyrideComponent(moduleDefault)) {
    return moduleDefault
  }

  throw new Error('react-joyride component export could not be resolved')
}

const DynamicJoyride = dynamic<JoyrideProps>(
  () => import('react-joyride').then(resolveJoyrideModule),
  { ssr: false },
)

export function JoyrideClient(props: JoyrideProps) {
  return <DynamicJoyride {...props} />
}

export function isRenderableJoyrideIcon(icon: unknown): boolean {
  return isValidElement(icon)
}

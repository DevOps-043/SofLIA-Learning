'use client'

import { isValidElement } from 'react'
import type { ComponentType } from 'react'
import dynamic from 'next/dynamic'
import type { Props as JoyrideProps } from 'react-joyride'

type JoyrideModuleShape = {
  Component?: unknown
  Joyride?: unknown
  default?: unknown
}

function isJoyrideComponent(value: unknown): value is ComponentType<JoyrideProps> {
  return typeof value === 'function'
}

function resolveJoyrideModule(moduleValue: unknown): ComponentType<JoyrideProps> {
  if (isJoyrideComponent(moduleValue)) {
    return moduleValue
  }

  const moduleObject = moduleValue as JoyrideModuleShape | null
  const candidates = [
    moduleObject?.default,
    (moduleObject?.default as JoyrideModuleShape | null)?.default,
    moduleObject?.Joyride,
    moduleObject?.Component,
  ]

  for (const candidate of candidates) {
    if (isJoyrideComponent(candidate)) {
      return candidate
    }
  }

  const availableExports =
    typeof moduleValue === 'object' && moduleValue !== null
      ? Object.keys(moduleValue).join(', ')
      : typeof moduleValue

  throw new Error(
    `react-joyride component export could not be resolved. Available exports: ${availableExports}`,
  )
}

const DynamicJoyride = dynamic<JoyrideProps>(
  () => Promise.resolve(resolveJoyrideModule(require('react-joyride'))),
  { ssr: false },
)

export function JoyrideClient(props: JoyrideProps) {
  return <DynamicJoyride {...props} />
}

export function isRenderableJoyrideIcon(icon: unknown): boolean {
  return isValidElement(icon)
}

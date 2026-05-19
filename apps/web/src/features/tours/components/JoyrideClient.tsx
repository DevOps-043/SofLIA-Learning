'use client'

import { isValidElement } from 'react'
import type { ComponentType } from 'react'
import JoyrideDefault, * as ReactJoyrideModule from 'react-joyride'
import type { Props as JoyrideProps } from 'react-joyride'

type JoyrideModuleShape = {
  default?: ComponentType<JoyrideProps>
}

function isJoyrideComponent(value: unknown): value is ComponentType<JoyrideProps> {
  return typeof value === 'function'
}

function resolveJoyrideComponent(): ComponentType<JoyrideProps> {
  if (isJoyrideComponent(JoyrideDefault)) {
    return JoyrideDefault
  }

  const moduleDefault = (ReactJoyrideModule as JoyrideModuleShape).default
  if (isJoyrideComponent(moduleDefault)) {
    return moduleDefault
  }

  if (isJoyrideComponent(ReactJoyrideModule)) {
    return ReactJoyrideModule
  }

  throw new Error('react-joyride component export could not be resolved')
}

const ResolvedJoyride = resolveJoyrideComponent()

export function JoyrideClient(props: JoyrideProps) {
  return <ResolvedJoyride {...props} />
}

export function isRenderableJoyrideIcon(icon: unknown): boolean {
  return isValidElement(icon)
}

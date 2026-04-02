/**
 * Legacy no-op logger kept for backwards compatibility with older call sites.
 * Structured logging lives in `src/lib/logger.ts`.
 */

const noop = (..._args: readonly unknown[]) => undefined
const noopWithLabel = (_label: string) => undefined
const noopWithData = (_data: unknown) => undefined

export const logger = {
  log: noop,
  info: noop,
  warn: noop,
  debug: noop,
  error: noop,
  table: noopWithData,
  group: noopWithLabel,
  groupCollapsed: noopWithLabel,
  groupEnd: () => undefined,
  time: noopWithLabel,
  timeEnd: noopWithLabel,
  trace: noop,
}

export const componentLogger = {
  render: (_componentName: string, _props?: Record<string, unknown>) => undefined,
  mount: noopWithLabel,
  unmount: noopWithLabel,
  effect: (_componentName: string, _description: string) => undefined,
}

export const apiLogger = {
  request: (_method: string, _path: string, _data?: unknown) => undefined,
  success: (_method: string, _path: string, _data?: unknown) => undefined,
  error: (_method: string, _path: string, _error: unknown) => undefined,
}

export default logger

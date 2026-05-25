export {
  createLogger,
  logError,
  logger,
  logRequest,
  SecureLogger as Logger,
  SecureLogger,
} from '@/lib/logger';
export type { LoggerOptions, LogMetadata } from '@/lib/logger';

const noop = (..._args: readonly unknown[]) => undefined;
const noopWithLabel = (_label: string) => undefined;
const noopWithData = (_data: unknown) => undefined;

export const componentLogger = {
  render: (_componentName: string, _props?: Record<string, unknown>) => undefined,
  mount: noopWithLabel,
  unmount: noopWithLabel,
  effect: (_componentName: string, _description: string) => undefined,
};

export const apiLogger = {
  request: (_method: string, _path: string, _data?: unknown) => undefined,
  success: (_method: string, _path: string, _data?: unknown) => undefined,
  error: (_method: string, _path: string, _error: unknown) => undefined,
};

export const legacyNoopLogger = {
  log: noop,
  table: noopWithData,
  group: noopWithLabel,
  groupCollapsed: noopWithLabel,
  groupEnd: () => undefined,
  time: noopWithLabel,
  timeEnd: noopWithLabel,
  trace: noop,
};

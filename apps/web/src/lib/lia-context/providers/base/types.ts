/**
 * Tipos especificos para el sistema de providers.
 */

import type { ContextFragment, ContextRequest } from '../../types';

export {
  type ContextFragment,
  type ContextBuildOptions,
  type EnrichedMetadata,
} from '../../types';

export interface LiaContextProvider {
  readonly name: string;
  readonly priority: number;
  getContext(options: ContextRequest): Promise<ContextFragment | null>;
  shouldInclude(request: ContextRequest): boolean;
}

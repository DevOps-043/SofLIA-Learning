import type { OrganizationNodeProperties } from '../../../types/dynamicHierarchy.types';

export type HierarchyNodeModalMode = 'create' | 'edit';
export type BusinessTranslator = (key: string, options?: Record<string, unknown>) => string;
export type CommonTranslator = (key: string) => string;

export interface HierarchyNodeSavePayload {
  name: string;
  type: string;
  properties?: OrganizationNodeProperties;
  managerId?: string | null;
}

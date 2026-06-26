import type {
    OrganizationNode,
    OrganizationNodeProperties,
} from './dynamic-hierarchy-node.types';

export interface OrganizationStructure {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    template: 'regions_zones_teams' | 'regions_only' | 'zones_only' | 'flat' | 'custom' | null;
    metadata: Record<string, unknown> | null;
    is_default: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export type {
    OrganizationNode,
    OrganizationNodeManager,
    OrganizationNodeProperties,
    OrganizationNodeUser,
} from './dynamic-hierarchy-node.types';

export type {
    CreateNodeRequest,
    MoveNodeRequest,
    NodeCourseAssignment,
    NodeDetails,
    NodeObjective,
    UpdateNodeRequest,
} from './dynamic-hierarchy-operations.types';

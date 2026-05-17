import type {
    OrganizationNode,
    OrganizationNodeProperties,
} from './dynamic-hierarchy-node.types';

export interface OrganizationStructure {
    id: string;
    organization_id: string;
    name: string;
    is_default: boolean;
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

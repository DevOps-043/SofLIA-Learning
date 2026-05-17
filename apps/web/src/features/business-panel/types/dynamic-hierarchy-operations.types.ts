import type {
    OrganizationNode,
    OrganizationNodeProperties,
} from './dynamic-hierarchy-node.types';

export interface NodeObjective {
    id: string;
    node_id: string;
    title: string;
    description?: string;
    metric_type: string;
    target_value: number;
    current_value: number;
    status: string;
    deadline?: string;
    course_id?: string;
}

export interface CreateNodeRequest {
    structure_id: string;
    parent_id: string | null;
    name: string;
    type: string;
    manager_id?: string;
    properties?: OrganizationNodeProperties;
}

export interface UpdateNodeRequest {
    name?: string;
    type?: string;
    manager_id?: string | null;
    properties?: OrganizationNodeProperties;
    position?: number;
}

export interface MoveNodeRequest {
    new_parent_id: string | null;
    position?: number;
}

export interface NodeCourseAssignment {
    assignment_id: string;
    status: string;
    due_date?: string;
    id: string;
    title: string;
    thumbnail_url?: string;
    category: string;
}

export interface NodeDetails {
    node: OrganizationNode;
    children: OrganizationNode[];
    courses: NodeCourseAssignment[];
}

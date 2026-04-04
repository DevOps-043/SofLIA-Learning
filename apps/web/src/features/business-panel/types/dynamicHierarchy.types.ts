export interface OrganizationStructure {
    id: string;
    organization_id: string;
    name: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface OrganizationNode {
    id: string;
    structure_id: string;
    organization_id: string;
    parent_id: string | null;
    name: string;
    type: string; // 'root' | 'region' | 'zone' | 'team' | 'custom'
    code?: string | null;
    manager_id?: string | null;
    properties: OrganizationNodeProperties;
    path: string; // ltree path
    depth: number;
    position: number;
    created_at: string;
    updated_at: string;

    // Relations
    children?: OrganizationNode[];
    members_count?: number;
    manager?: OrganizationNodeManager;
}

export interface OrganizationNodeManager {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture_url?: string;
}

export interface OrganizationNodeProperties extends Record<string, unknown> {
    address?: string;
    city?: string;
    country?: string;
    external_number?: string;
    internal_number?: string;
    latitude?: number | string;
    longitude?: number | string;
    neighborhood?: string;
    state?: string;
    street?: string;
    zip_code?: string;
}

export interface OrganizationNodeUser {
    id: string;
    node_id: string;
    user_id: string;
    role: 'leader' | 'member' | 'viewer';
    is_primary: boolean;
    user?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_picture_url?: string;
    };
}

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
    type?: string; // Added to allow updating node type
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
    id: string; // Course ID
    title: string;
    thumbnail_url?: string;
    category: string;
}

export interface NodeDetails {
    node: OrganizationNode;
    children: OrganizationNode[];
    courses: NodeCourseAssignment[];
}

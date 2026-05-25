import { logger as techDebtLogger } from '@/lib/utils/logger'
import {
    OrganizationStructure,
    OrganizationNode,
    CreateNodeRequest,
    UpdateNodeRequest,
    MoveNodeRequest
} from '../types/dynamicHierarchy.types';

const API_BASE = '/api/business/hierarchy';

/**
 * Generic API Response wrapper
 */
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || `Error ${response.status}`,
            };
        }

        return {
            success: true,
            data: data.data ?? data,
        };
    } catch (error) {
        techDebtLogger.error('API Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export class DynamicHierarchyService {

    // Structures
    static async getStructures(): Promise<OrganizationStructure[]> {
        const res = await fetchApi<{ structures: OrganizationStructure[] }>('/structures');
        return res.success ? res.data?.structures ?? [] : [];
    }

    static async createStructure(name: string): Promise<ApiResponse<OrganizationStructure>> {
        return fetchApi('/structures', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }

    // Nodes
    static async getTree(structureId: string): Promise<OrganizationNode[]> {
        const res = await fetchApi<{ nodes: OrganizationNode[] }>(`/nodes?structureId=${structureId}`);
        return res.success ? res.data?.nodes ?? [] : [];
    }

    static async createNode(data: CreateNodeRequest): Promise<ApiResponse<OrganizationNode>> {
        return fetchApi('/nodes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async updateNode(nodeId: string, data: UpdateNodeRequest): Promise<ApiResponse<OrganizationNode>> {
        return fetchApi(`/nodes/${nodeId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    static async deleteNode(nodeId: string): Promise<ApiResponse<void>> {
        return fetchApi(`/nodes/${nodeId}`, {
            method: 'DELETE',
        });
    }

    static async moveNode(nodeId: string, data: MoveNodeRequest): Promise<ApiResponse<void>> {
        return fetchApi(`/nodes/${nodeId}/move`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
}

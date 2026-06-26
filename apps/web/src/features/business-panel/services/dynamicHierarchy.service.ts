import { logger as techDebtLogger } from '@/lib/utils/logger'
import {
    OrganizationStructure,
    OrganizationNode,
    CreateNodeRequest,
    UpdateNodeRequest,
    MoveNodeRequest
} from '../types/dynamicHierarchy.types';

function getDynamicHierarchyApiBase(orgSlug?: string | null): string {
    return orgSlug ? `/api/${orgSlug}/business/hierarchy` : '/api/business/hierarchy';
}

/**
 * Generic API Response wrapper
 */
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {},
    orgSlug?: string | null,
): Promise<ApiResponse<T>> {
    try {
        const { headers, ...fetchOptions } = options;
        const response = await fetch(`${getDynamicHierarchyApiBase(orgSlug)}${endpoint}`, {
            ...fetchOptions,
            credentials: 'include',
            headers: buildJsonHeaders(headers),
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

function buildJsonHeaders(headers?: HeadersInit): Headers {
    const mergedHeaders = new Headers(headers);
    if (!mergedHeaders.has('Content-Type')) {
        mergedHeaders.set('Content-Type', 'application/json');
    }

    return mergedHeaders;
}

export class DynamicHierarchyService {

    // Structures
    static async getStructures(orgSlug?: string | null): Promise<OrganizationStructure[]> {
        const res = await fetchApi<{ structures: OrganizationStructure[] }>('/structures', {}, orgSlug);
        return res.success ? res.data?.structures ?? [] : [];
    }

    static async createStructure(name: string, orgSlug?: string | null): Promise<ApiResponse<OrganizationStructure>> {
        return fetchApi('/structures', {
            method: 'POST',
            body: JSON.stringify({ name }),
        }, orgSlug);
    }

    static async deleteStructure(structureId: string, orgSlug?: string | null): Promise<ApiResponse<void>> {
        return fetchApi(`/structures/${encodeURIComponent(structureId)}`, {
            method: 'DELETE',
        }, orgSlug);
    }

    // Nodes
    static async getTree(structureId: string, orgSlug?: string | null): Promise<OrganizationNode[]> {
        const res = await fetchApi<{ nodes: OrganizationNode[] }>(`/nodes?structureId=${encodeURIComponent(structureId)}`, {}, orgSlug);
        return res.success ? res.data?.nodes ?? [] : [];
    }

    static async createNode(data: CreateNodeRequest, orgSlug?: string | null): Promise<ApiResponse<OrganizationNode>> {
        return fetchApi('/nodes', {
            method: 'POST',
            body: JSON.stringify(data),
        }, orgSlug);
    }

    static async updateNode(nodeId: string, data: UpdateNodeRequest, orgSlug?: string | null): Promise<ApiResponse<OrganizationNode>> {
        return fetchApi(`/nodes/${encodeURIComponent(nodeId)}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, orgSlug);
    }

    static async deleteNode(nodeId: string, orgSlug?: string | null): Promise<ApiResponse<void>> {
        return fetchApi(`/nodes/${encodeURIComponent(nodeId)}`, {
            method: 'DELETE',
        }, orgSlug);
    }

    static async moveNode(nodeId: string, data: MoveNodeRequest, orgSlug?: string | null): Promise<ApiResponse<void>> {
        return fetchApi(`/nodes/${encodeURIComponent(nodeId)}/move`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, orgSlug);
    }
}

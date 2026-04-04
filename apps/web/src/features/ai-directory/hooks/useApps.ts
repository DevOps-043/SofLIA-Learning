import { useState, useEffect } from 'react';

interface App {
  app_id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  category_id: string;
  website_url: string;
  logo_url: string;
  pricing_model: string;
  pricing_details: Record<string, unknown> | null;
  features: string[];
  use_cases: string[];
  advantages: string[];
  disadvantages: string[];
  alternatives: string[];
  tags: string[];
  supported_languages: string[];
  integrations: string[];
  api_available: boolean;
  mobile_app: boolean;
  desktop_app: boolean;
  browser_extension: boolean;
  is_featured: boolean;
  is_verified: boolean;
  view_count: number;
  like_count: number;
  rating: number;
  rating_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ai_categories: {
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseAppsOptions {
  search?: string;
  category?: string | null;
  pricing?: string | null;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface UseAppsReturn {
  apps: App[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refetch: () => void;
}

export function useApps(options: UseAppsOptions = {}): UseAppsReturn {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchApps = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (options.search) params.append('search', options.search);
      if (options.category) params.append('category', options.category);
      if (options.pricing) params.append('pricing', options.pricing);
      if (options.featured) params.append('featured', 'true');
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`/api/ai-directory/apps?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch apps');
      }

      const data = await response.json();
      setApps(data.apps || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setApps([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [
    options.search,
    options.category,
    options.pricing,
    options.featured,
    options.sortBy,
    options.sortOrder,
    options.page,
    options.limit
  ]);

  return {
    apps,
    loading,
    error,
    pagination,
    refetch: fetchApps
  };
}

import type { PageMetadata } from '../types';
import { PAGE_METADATA_BY_ROUTE } from './page-metadata/registry';

export const PAGE_METADATA: Record<string, PageMetadata> = PAGE_METADATA_BY_ROUTE;

export function getRegisteredRoutes(): string[] {
  return Object.keys(PAGE_METADATA);
}

export function hasPageMetadata(route: string): boolean {
  return route in PAGE_METADATA;
}

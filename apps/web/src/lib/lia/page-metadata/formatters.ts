import { buildCoursesNavigationNote, buildPromptCreationNote } from './link-notes';
import { PAGE_METADATA } from './metadata';
import type { PageMetadata, UserRole } from './types';

export function getPlatformContext(): string {
  return Object.values(PAGE_METADATA)
    .reduce((context, page) => `${context}${formatPlatformPage(page)}`, platformHeader());
}

export function buildDynamicUrl(template: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (url, [key, value]) => url.replace(`[${key}]`, value),
    template,
  );
}

export function getAvailablePages(userRole: UserRole | null = null): PageMetadata[] {
  return Object.values(PAGE_METADATA).filter((page) => canAccessPage(page, userRole));
}

export function getAvailableLinksForSofLIA(userRole: UserRole | null = null): string {
  const pageLinks = getAvailablePages(userRole).map(formatSofLIALink).join('');
  return [
    '\n\nLINKS DISPONIBLES EN LA PLATAFORMA:\n',
    pageLinks,
    buildPromptCreationNote(),
    buildCoursesNavigationNote(),
  ].join('');
}

function platformHeader(): string {
  return '\n\nCONTEXTO DE LA PLATAFORMA - PÁGINAS DISPONIBLES:\n';
}

function formatPlatformPage(page: PageMetadata): string {
  const lines = [
    `\n- ${page.title} (${page.path}):`,
    `  Descripción: ${page.description}`,
  ];

  if (page.features?.length) {
    lines.push(`  Funcionalidades: ${page.features.join(', ')}`);
  }

  if (page.contentSections?.length) {
    lines.push(`  Secciones de contenido: ${page.contentSections.join(', ')}`);
  }

  lines.push(`  Acciones disponibles: ${page.availableActions.join(', ')}`);

  if (page.relatedPages.length > 0) {
    lines.push(`  Páginas relacionadas: ${page.relatedPages.join(', ')}`);
  }

  if (page.specialNotes) {
    lines.push(`  ⚠️ NOTA IMPORTANTE: ${page.specialNotes}`);
  }

  return `${lines.join('\n')}\n`;
}

function canAccessPage(page: PageMetadata, userRole: UserRole | null): boolean {
  if (page.isAdminOnly) {
    return userRole === 'administrador';
  }

  if (page.isBusinessOnly) {
    return userRole === 'business' || userRole === 'administrador';
  }

  if (page.allowedRoles?.length) {
    return !userRole || page.allowedRoles.includes(userRole);
  }

  return true;
}

function formatSofLIALink(page: PageMetadata): string {
  const note = page.specialNotes ? `  ⚠️ NOTA: ${page.specialNotes}\n` : '';
  return `\n- ${page.title}: [${page.title}](${page.path})\n  Descripción: ${page.description}\n${note}`;
}

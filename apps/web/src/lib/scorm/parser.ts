import { parseStringPromise } from 'xml2js';
import JSZip from 'jszip';

/** Represents a loosely-typed xml2js parsed XML node */
type XmlNode = Record<string, unknown> & { $?: Record<string, string>; title?: string; item?: XmlNode | XmlNode[] }

export interface ScormManifest {
  version: 'SCORM_1.2' | 'SCORM_2004';
  title: string;
  description?: string;
  entryPoint: string;
  organizations: ScormOrganization[];
  resources: ScormResource[];
}

interface ScormOrganization {
  identifier: string;
  title: string;
  items: ScormItem[];
}

interface ScormItem {
  identifier: string;
  title: string;
  resourceId?: string;
  children?: ScormItem[];
}

interface ScormResource {
  identifier: string;
  type: string;
  href?: string;
  files: string[];
}

export async function parseScormManifest(xml: string): Promise<ScormManifest> {
  const result = await parseStringPromise(xml, { explicitArray: false });
  const manifest = result.manifest;

  // Detectar versión
  const schemaVersion =
    manifest.metadata?.schemaversion ||
    manifest['$']?.version ||
    '1.2';
  const version = schemaVersion.includes('2004') ? 'SCORM_2004' : 'SCORM_1.2';

  // Parsear organizaciones
  const orgs = manifest.organizations?.organization;
  const orgArray = Array.isArray(orgs) ? orgs : orgs ? [orgs] : [];

  const organizations: ScormOrganization[] = orgArray.map((org: XmlNode) => ({
    identifier: org['$']?.identifier || '',
    title: org.title || '',
    items: parseItems(org.item),
  }));

  // Parsear recursos
  const res = manifest.resources?.resource;
  const resArray = Array.isArray(res) ? res : res ? [res] : [];

  const resources: ScormResource[] = resArray.map((r: XmlNode) => ({
    identifier: r['$']?.identifier || '',
    type: r['$']?.type || '',
    href: r['$']?.href,
    files: parseFiles(r.file),
  }));

  // Encontrar entry point
  const entryPoint = resources.find((r) => r.href)?.href || 'index.html';

  // Título del curso
  const title =
    organizations[0]?.title ||
    manifest.metadata?.lom?.general?.title?.string ||
    'Untitled Course';

  return {
    version,
    title,
    description: manifest.metadata?.lom?.general?.description?.string,
    entryPoint,
    organizations,
    resources,
  };
}

function parseItems(items: XmlNode | XmlNode[] | undefined): ScormItem[] {
  if (!items) return [];
  const arr = Array.isArray(items) ? items : [items];
  return arr.map((item: XmlNode) => ({
    identifier: item['$']?.identifier || '',
    title: item.title || '',
    resourceId: item['$']?.identifierref,
    children: parseItems(item.item),
  }));
}

function parseFiles(files: XmlNode | XmlNode[] | undefined): string[] {
  if (!files) return [];
  const arr = Array.isArray(files) ? files : [files];
  return arr.map((f: XmlNode) => f['$']?.href || '').filter(Boolean);
}

export async function validateScormPackage(
  zip: JSZip,
  manifest: ScormManifest
): Promise<{ valid: boolean; error?: string }> {
  // Verificar entry point
  if (!zip.file(manifest.entryPoint)) {
    return {
      valid: false,
      error: `Entry point not found: ${manifest.entryPoint}`,
    };
  }

  // Verificar recursos críticos
  for (const resource of manifest.resources) {
    if (resource.href && !zip.file(resource.href)) {
      return { valid: false, error: `Resource not found: ${resource.href}` };
    }
  }

  return { valid: true };
}

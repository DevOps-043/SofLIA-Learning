import 'server-only';
import type { LiveContext } from './server';
import { LiveError } from './server';
import type { StudioState } from './live-studio.contract';

export const STUDIO_ASSET_BUCKET = 'live-studio-assets';
export const studioAssetMime = new Set(['application/pdf', 'text/plain', 'text/markdown', 'application/json', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/epub+zip']);

export async function verifyStudioAssets(context: LiveContext, sessionId: string, previous: StudioState, next: StudioState) {
  const previousMaterials = new Map(previous.materials.map((item) => [item.asset_path, item]));
  const previousScenes = new Map(previous.scenes.map((item) => [item.id, item]));
  const paths = new Set([...next.materials.map((item) => item.asset_path), ...next.scenes.flatMap((item) => item.asset_path ? [item.asset_path] : [])]);
  for (const path of paths) {
    if (!path.startsWith(`${context.orgId}/${sessionId}/`) || path.includes('..') || path.split('/').length !== 3) throw new LiveError(400, 'El archivo no pertenece a esta sesión');
    const materials = next.materials.filter((item) => item.asset_path === path);
    const scenes = next.scenes.filter((item) => item.asset_path === path);
    if (materials.every((item) => previousMaterials.get(path)?.mime === item.mime && previousMaterials.get(path)?.bytes === item.bytes) && scenes.every((item) => previousScenes.get(item.id)?.asset_path === path && previousScenes.get(item.id)?.kind === item.kind)) continue;
    const { data, error } = await context.db.storage.from(STUDIO_ASSET_BUCKET).info(path);
    if (error || !data || !data.size || data.size > 25 * 1024 * 1024 || !studioAssetMime.has(data.contentType ?? '')) throw new LiveError(400, 'El archivo no está disponible o no cumple los límites');
    if (materials.some((item) => item.bytes !== data.size || item.mime !== data.contentType)) throw new LiveError(400, 'Los datos del material no coinciden con el archivo subido');
    if (scenes.some((item) => item.kind === 'image' ? !data.contentType?.startsWith('image/') : item.kind === 'video' ? !data.contentType?.startsWith('video/') : true)) throw new LiveError(400, 'La fuente de la escena no coincide con el archivo');
  }
}

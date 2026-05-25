import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Servicio de Upload para Imágenes de Jerarquía
 * 
 * Gestiona la subida de imágenes a los buckets:
 * - hierarchy-regions
 * - hierarchy-zones
 * - hierarchy-teams
 */

import { createClient } from '@/lib/supabase/client';

export type HierarchyLevel = 'region' | 'zone' | 'team';
export type ImageType = 'logo' | 'banner' | 'photo';

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

interface UploadOptions {
  /** ID de la entidad (region_id, zone_id, team_id) */
  entityId: string;
  /** Nivel de jerarquía */
  level: HierarchyLevel;
  /** Tipo de imagen */
  imageType: ImageType;
  /** Archivo a subir */
  file: File;
  /** Nombre personalizado (opcional) */
  customName?: string;
}

/**
 * Mapeo de niveles a nombres de buckets
 */
const BUCKET_MAP: Record<HierarchyLevel, string> = {
  region: 'hierarchy-regions',
  zone: 'hierarchy-zones',
  team: 'hierarchy-teams',
};

/**
 * Genera un nombre único para el archivo
 */
function generateFileName(file: File, imageType: ImageType, customName?: string): string {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
  const timestamp = Date.now();
  
  if (customName) {
    // Limpiar nombre personalizado
    const cleanName = customName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    return `${cleanName}-${timestamp}.${extension}`;
  }
  
  // Nombre basado en tipo de imagen
  return `${imageType}-${timestamp}.${extension}`;
}

/**
 * Sube una imagen al bucket correspondiente
 */
export async function uploadHierarchyImage(options: UploadOptions): Promise<UploadResult> {
  const { entityId, level, imageType, file, customName } = options;
  
  // Validar que sea una imagen
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'El archivo debe ser una imagen' };
  }
  
  // Validar tamaño (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { success: false, error: 'El archivo no puede superar 10MB' };
  }
  
  const supabase = createClient();
  const bucketName = BUCKET_MAP[level];
  const fileName = generateFileName(file, imageType, customName);
  
  // Construir el path: {entity_id}/{filename}
  const filePath = `${entityId}/${fileName}`;
  
  try {
    // Subir archivo
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Sobrescribir si existe
      });
    
    if (error) {
      techDebtLogger.error('Error uploading to storage:', error);
      return { success: false, error: error.message };
    }
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return {
      success: true,
      url: publicUrl,
      path: data?.path
    };
  } catch (err) {
    techDebtLogger.error('Upload failed:', err);
    return { success: false, error: 'Error al subir la imagen' };
  }
}

/**
 * Elimina una imagen del bucket
 */
export async function deleteHierarchyImage(
  level: HierarchyLevel,
  entityId: string,
  fileName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const bucketName = BUCKET_MAP[level];
  const filePath = `${entityId}/${fileName}`;
  
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err) {
    techDebtLogger.error('Delete failed:', err);
    return { success: false, error: 'Error al eliminar la imagen' };
  }
}

/**
 * Lista todas las imágenes de una entidad
 */
export async function listHierarchyImages(
  level: HierarchyLevel,
  entityId: string
): Promise<{ success: boolean; files?: string[]; error?: string }> {
  const supabase = createClient();
  const bucketName = BUCKET_MAP[level];
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(entityId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    const files = data?.map(file => file.name) || [];
    return { success: true, files };
  } catch (err) {
    techDebtLogger.error('List failed:', err);
    return { success: false, error: 'Error al listar imágenes' };
  }
}

/**
 * Obtiene la URL pública de una imagen
 */
export function getHierarchyImageUrl(
  level: HierarchyLevel,
  entityId: string,
  fileName: string
): string {
  const supabase = createClient();
  const bucketName = BUCKET_MAP[level];
  const filePath = `${entityId}/${fileName}`;
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  return publicUrl;
}

/**
 * Sube el logo de una región
 */
export async function uploadRegionLogo(regionId: string, file: File): Promise<UploadResult> {
  return uploadHierarchyImage({
    entityId: regionId,
    level: 'region',
    imageType: 'logo',
    file
  });
}

/**
 * Sube el banner de una región
 */
export async function uploadRegionBanner(regionId: string, file: File): Promise<UploadResult> {
  return uploadHierarchyImage({
    entityId: regionId,
    level: 'region',
    imageType: 'banner',
    file
  });
}

/**
 * Sube el logo de una zona
 */
export async function uploadZoneLogo(zoneId: string, file: File): Promise<UploadResult> {
  return uploadHierarchyImage({
    entityId: zoneId,
    level: 'zone',
    imageType: 'logo',
    file
  });
}

/**
 * Sube el banner de una zona
 */
export async function uploadZoneBanner(zoneId: string, file: File): Promise<UploadResult> {
  return uploadHierarchyImage({
    entityId: zoneId,
    level: 'zone',
    imageType: 'banner',
    file
  });
}

/**
 * Sube el logo de un equipo
 */
export async function uploadTeamLogo(teamId: string, file: File): Promise<UploadResult> {
  return uploadHierarchyImage({
    entityId: teamId,
    level: 'team',
    imageType: 'logo',
    file
  });
}

/**
 * Sube el banner de un equipo
 */
export async function uploadTeamBanner(teamId: string, file: File): Promise<UploadResult> {
  return uploadHierarchyImage({
    entityId: teamId,
    level: 'team',
    imageType: 'banner',
    file
  });
}

/**
 * Sube una foto adicional a un equipo
 */
export async function uploadTeamPhoto(teamId: string, file: File, photoName?: string): Promise<UploadResult> {
  return uploadHierarchyImage({
    entityId: teamId,
    level: 'team',
    imageType: 'photo',
    file,
    customName: photoName
  });
}

export default {
  uploadHierarchyImage,
  deleteHierarchyImage,
  listHierarchyImages,
  getHierarchyImageUrl,
  uploadRegionLogo,
  uploadRegionBanner,
  uploadZoneLogo,
  uploadZoneBanner,
  uploadTeamLogo,
  uploadTeamBanner,
  uploadTeamPhoto
};

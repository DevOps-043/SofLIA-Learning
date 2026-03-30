'use client';

import { useState } from 'react';
import { supabaseStorageService, AttachmentData } from '../../../core/services/supabaseStorage';

export interface ProcessedAttachment {
  attachment_url: string | null;
  attachment_type: string;
  attachment_data: any;
}

export function useAttachments() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processAttachment = async (attachmentData: AttachmentData): Promise<ProcessedAttachment | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      
      // Si es YouTube, obtener información adicional
      if (attachmentData.type === 'youtube' && attachmentData.url) {
        const videoId = supabaseStorageService.extractYouTubeVideoId(attachmentData.url);
        
        if (videoId) {
          try {
            const videoInfo = await supabaseStorageService.getYouTubeVideoInfo(videoId);
            attachmentData = {
              ...attachmentData,
              videoId,
              title: videoInfo.title,
              thumbnail: videoInfo.thumbnail
            };
          } catch (error) {
            // Si falla la API, usar datos básicos
            attachmentData = {
              ...attachmentData,
              videoId,
              title: 'Video de YouTube',
              thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
            };
          }
        } else {
        }
      }

      const result = await supabaseStorageService.processAttachment(attachmentData);
      
      // Log específico para YouTube
      if (attachmentData.type === 'youtube') {
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar adjunto';
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const createPostWithAttachment = async (
    communitySlug: string,
    content: string,
    attachmentsData?: AttachmentData | AttachmentData[]
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      let processedAttachments: ProcessedAttachment[] = [];

      // Procesar adjuntos si existen
      if (attachmentsData) {
        const attachmentsArray = Array.isArray(attachmentsData) ? attachmentsData : [attachmentsData];
        
        // Procesar todos los adjuntos en paralelo
        const processingPromises = attachmentsArray.map(async (att, index) => {
          try {
            return await processAttachment(att);
          } catch (error) {
            console.error(`Error procesando adjunto ${index + 1}:`, error);
            return null;
          }
        });
        const results = await Promise.all(processingPromises);
        
        // Filtrar los adjuntos que se procesaron correctamente
        processedAttachments = results.filter((att): att is ProcessedAttachment => att !== null);
        
        if (processedAttachments.length === 0 && attachmentsArray.length > 0) {
          throw new Error('Error al procesar los adjuntos. Ningún adjunto se pudo procesar correctamente.');
        }
        
        // Si algunos adjuntos fallaron pero otros no, continuar con los que funcionaron
        if (processedAttachments.length < attachmentsArray.length) {
          console.warn(`Algunos adjuntos fallaron. Procesados: ${processedAttachments.length}/${attachmentsArray.length}`);
        }
      }

      // Si hay múltiples adjuntos, almacenarlos como array en attachment_data
      // Si hay un solo adjunto, mantener la estructura original para compatibilidad
      let attachment_url: string | null = null;
      let attachment_type: string | null = null;
      let attachment_data: any = null;

      if (processedAttachments.length === 1) {
        // Un solo adjunto: mantener estructura original
        attachment_url = processedAttachments[0].attachment_url;
        attachment_type = processedAttachments[0].attachment_type;
        attachment_data = processedAttachments[0].attachment_data;
      } else if (processedAttachments.length > 1) {
        // Múltiples adjuntos: almacenar como array en attachment_data
        // Usar el tipo del primer adjunto, pero asegurarse de que sea válido para la BD
        // Tipos válidos según BD: 'image', 'video', 'document', 'link', 'poll'
        const firstType = processedAttachments[0].attachment_type;
        const validTypes = ['image', 'video', 'document', 'link', 'poll'];
        
        // Si el tipo no es válido (ej: 'youtube'), usar 'image' como fallback
        attachment_type = validTypes.includes(firstType) ? firstType : 'image';
        
        attachment_data = {
          isMultiple: true,
          attachments: processedAttachments.map(att => ({
            attachment_url: att.attachment_url,
            attachment_type: att.attachment_type,
            attachment_data: att.attachment_data
          }))
        };
        // Para múltiples adjuntos, usar la URL del primero como principal (para compatibilidad)
        attachment_url = processedAttachments[0]?.attachment_url || null;
      }

      // Crear el post
      const postData: any = {
        content: content.trim(),
        title: null,
        attachment_url,
        attachment_type,
        attachment_data
      };

      // Validar que postData sea serializable
      try {
        JSON.stringify(postData);
      } catch (error) {
        console.error('Error serializando postData:', error);
        throw new Error('Error al preparar los datos del post. Los adjuntos pueden contener datos no válidos.');
      }

      const response = await fetch(`/api/communities/${communitySlug}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        let errorData: any = { error: 'Error desconocido al crear el post' };
        
        try {
          // Leer el body una sola vez
          const text = await response.text();
          const contentType = response.headers.get('content-type');
          
          if (text && text.trim()) {
            if (contentType && contentType.includes('application/json')) {
              try {
                errorData = JSON.parse(text);
              } catch (jsonError) {
                // Si no es JSON válido, usar el texto como mensaje
                errorData = { 
                  error: text,
                  details: 'La respuesta no es un JSON válido'
                };
              }
            } else {
              // Si no es JSON, usar el texto como mensaje
              errorData = { 
                error: text || `Error ${response.status}: ${response.statusText || 'Error al crear el post'}`,
                status: response.status,
                statusText: response.statusText
              };
            }
          } else {
            // Si el body está vacío, usar el status
            errorData = { 
              error: `Error ${response.status}: ${response.statusText || 'Error al crear el post'}`,
              status: response.status,
              statusText: response.statusText
            };
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorData = { 
            error: `Error ${response.status}: ${response.statusText || 'Error al crear el post'}`,
            status: response.status,
            details: parseError instanceof Error ? parseError.message : 'Error desconocido al parsear la respuesta'
          };
        }
        
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        const errorMessage = errorData.error || errorData.details || errorData.message || `Error ${response.status}: Error al crear el post`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el post';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processAttachment,
    createPostWithAttachment,
    isProcessing,
    error,
    clearError: () => setError(null)
  };
}

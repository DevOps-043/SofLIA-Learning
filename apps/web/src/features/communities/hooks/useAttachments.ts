'use client';

import { useState } from 'react';
import { supabaseStorageService, type AttachmentData } from '../../../core/services/supabaseStorage';

export interface ProcessedAttachment {
  attachment_url: string | null;
  attachment_type: string;
  attachment_data: Record<string, unknown> | null;
}

interface ErrorResponsePayload extends Record<string, unknown> {
  error?: string;
  details?: string;
  message?: string;
  status?: number;
  statusText?: string;
}

interface PostCreatePayload {
  content: string;
  title: null;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_data: Record<string, unknown> | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function buildFallbackErrorPayload(response: Response): ErrorResponsePayload {
  return {
    error: `Error ${response.status}: ${response.statusText || 'Error al crear el post'}`,
    status: response.status,
    statusText: response.statusText,
  };
}

function getErrorMessage(payload: ErrorResponsePayload, response: Response): string {
  const errorValue = typeof payload.error === 'string' ? payload.error : undefined;
  const detailsValue = typeof payload.details === 'string' ? payload.details : undefined;
  const messageValue = typeof payload.message === 'string' ? payload.message : undefined;

  return (
    errorValue ||
    detailsValue ||
    messageValue ||
    `Error ${response.status}: Error al crear el post`
  );
}

export function useAttachments() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processAttachment = async (
    attachmentData: AttachmentData
  ): Promise<ProcessedAttachment | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      if (attachmentData.type === 'youtube' && attachmentData.url) {
        const videoId = supabaseStorageService.extractYouTubeVideoId(attachmentData.url);

        if (videoId) {
          try {
            const videoInfo = await supabaseStorageService.getYouTubeVideoInfo(videoId);
            attachmentData = {
              ...attachmentData,
              videoId,
              title: videoInfo.title,
              thumbnail: videoInfo.thumbnail,
            };
          } catch (error) {
            attachmentData = {
              ...attachmentData,
              videoId,
              title: 'Video de YouTube',
              thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            };
          }
        }
      }

      const result = await supabaseStorageService.processAttachment(attachmentData);
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

      if (attachmentsData) {
        const attachmentsArray = Array.isArray(attachmentsData) ? attachmentsData : [attachmentsData];

        const processingPromises = attachmentsArray.map(async (attachment, index) => {
          try {
            return await processAttachment(attachment);
          } catch (error) {
            console.error(`Error procesando adjunto ${index + 1}:`, error);
            return null;
          }
        });

        const results = await Promise.all(processingPromises);
        processedAttachments = results.filter(
          (attachment): attachment is ProcessedAttachment => attachment !== null
        );

        if (processedAttachments.length === 0 && attachmentsArray.length > 0) {
          throw new Error(
            'Error al procesar los adjuntos. Ningún adjunto se pudo procesar correctamente.'
          );
        }

        if (processedAttachments.length < attachmentsArray.length) {
          console.warn(
            `Algunos adjuntos fallaron. Procesados: ${processedAttachments.length}/${attachmentsArray.length}`
          );
        }
      }

      let attachment_url: string | null = null;
      let attachment_type: string | null = null;
      let attachment_data: Record<string, unknown> | null = null;

      if (processedAttachments.length === 1) {
        attachment_url = processedAttachments[0].attachment_url;
        attachment_type = processedAttachments[0].attachment_type;
        attachment_data = processedAttachments[0].attachment_data;
      } else if (processedAttachments.length > 1) {
        const firstType = processedAttachments[0].attachment_type;
        const validTypes = ['image', 'video', 'document', 'link', 'poll'];

        attachment_type = validTypes.includes(firstType) ? firstType : 'image';
        attachment_data = {
          isMultiple: true,
          attachments: processedAttachments.map((attachment) => ({
            attachment_url: attachment.attachment_url,
            attachment_type: attachment.attachment_type,
            attachment_data: attachment.attachment_data,
          })),
        };
        attachment_url = processedAttachments[0]?.attachment_url || null;
      }

      const postData: PostCreatePayload = {
        content: content.trim(),
        title: null,
        attachment_url,
        attachment_type,
        attachment_data,
      };

      try {
        JSON.stringify(postData);
      } catch (error) {
        console.error('Error serializando postData:', error);
        throw new Error(
          'Error al preparar los datos del post. Los adjuntos pueden contener datos no válidos.'
        );
      }

      const response = await fetch(`/api/communities/${communitySlug}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        let errorData: ErrorResponsePayload = buildFallbackErrorPayload(response);

        try {
          const text = await response.text();
          const contentType = response.headers.get('content-type');

          if (text.trim()) {
            if (contentType?.includes('application/json')) {
              try {
                const parsed = JSON.parse(text);
                errorData = isRecord(parsed)
                  ? { ...buildFallbackErrorPayload(response), ...parsed }
                  : { ...buildFallbackErrorPayload(response), error: String(parsed) };
              } catch (jsonError) {
                errorData = {
                  ...buildFallbackErrorPayload(response),
                  error: text,
                  details: 'La respuesta no es un JSON válido',
                };
              }
            } else {
              errorData = {
                ...buildFallbackErrorPayload(response),
                error: text,
              };
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorData = {
            ...buildFallbackErrorPayload(response),
            details:
              parseError instanceof Error
                ? parseError.message
                : 'Error desconocido al parsear la respuesta',
          };
        }

        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });

        throw new Error(getErrorMessage(errorData, response));
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
    clearError: () => setError(null),
  };
}

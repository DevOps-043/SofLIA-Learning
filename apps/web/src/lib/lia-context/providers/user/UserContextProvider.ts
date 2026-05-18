import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * UserContextProvider
 * 
 * Provee contexto sobre el usuario actual a LIA.
 * Incluye información de rol, organización, preferencias y actividad reciente.
 */

import { BaseContextProvider } from '../base/BaseContextProvider';
import type { ContextFragment, ContextBuildOptions } from '../../types';

/**
 * Información del usuario para contexto
 */
interface UserInfo {
  id: string;
  nombre?: string;
  email?: string;
  role?: string;
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  isBusinessUser?: boolean;
  isInstructor?: boolean;
  isAdmin?: boolean;
  lastLogin?: string;
  createdAt?: string;
  preferences?: UserPreferences;
  courseProgress?: CourseProgressSummary;
}

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: boolean;
  liaPersonalization?: {
    tone?: string;
    responseLength?: string;
  };
}

interface CourseProgressSummary {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  averageProgress: number;
  lastActivityDate?: string;
}

export class UserContextProvider extends BaseContextProvider {
  readonly name = 'user';
  readonly priority = 30; // Menor que page (50) y bug-report (100)

  async getContext(options: ContextBuildOptions): Promise<ContextFragment | null> {
    const { userId, enrichedMetadata } = options;

    // Si no hay userId, no podemos obtener contexto de usuario
    if (!userId) {
      return null;
    }

    try {
      // En una implementación real, obtendríamos datos de la BD
      // Por ahora, construimos contexto con la información disponible
      const userContext = await this.buildUserContext(userId, enrichedMetadata);

      if (!userContext) {
        return null;
      }

      return {
        type: 'user',
        content: userContext,
        priority: this.priority,
        tokens: this.estimateTokens(userContext)
      };
    } catch (error) {
      techDebtLogger.error('[UserContextProvider] Error obteniendo contexto:', error);
      return null;
    }
  }

  shouldInclude(contextType: string): boolean {
    // Incluir en la mayoría de contextos
    return ['general', 'bug-report', 'help', 'learning', 'user'].includes(contextType);
  }

  /**
   * Construye el contexto del usuario
   */
  private async buildUserContext(
    userId: string,
    enrichedMetadata?: ContextBuildOptions['enrichedMetadata']
  ): Promise<string | null> {
    const sections: string[] = [];

    sections.push('## CONTEXTO DEL USUARIO');
    sections.push('');
    sections.push(`**ID de Usuario:** ${userId.substring(0, 8)}...`);

    // Información de sesión desde metadata
    if (enrichedMetadata) {
      if (enrichedMetadata.sessionDuration) {
        const minutes = Math.floor(enrichedMetadata.sessionDuration / 60000);
        sections.push(`**Duración de sesión:** ${minutes} minutos`);
      }

      if (enrichedMetadata.platform) {
        const { browser, os } = enrichedMetadata.platform;
        if (browser || os) {
          sections.push(`**Plataforma:** ${browser || 'N/A'} en ${os || 'N/A'}`);
        }
      }

      if (enrichedMetadata.viewport) {
        const { width, height } = enrichedMetadata.viewport;
        const deviceType = this.detectDeviceType(width);
        sections.push(`**Dispositivo:** ${deviceType} (${width}x${height})`);
      }

      if (enrichedMetadata.timezone) {
        sections.push(`**Zona horaria:** ${enrichedMetadata.timezone}`);
      }

      if (enrichedMetadata.language) {
        sections.push(`**Idioma:** ${enrichedMetadata.language}`);
      }
    }

    // Agregar notas sobre el contexto
    sections.push('');
    sections.push('### Notas:');
    sections.push('- Adaptar respuestas al tipo de dispositivo del usuario');
    sections.push('- Considerar la zona horaria para recomendaciones de estudio');

    return sections.join('\n');
  }

  /**
   * Detecta el tipo de dispositivo basado en el ancho del viewport
   */
  private detectDeviceType(width: number): string {
    if (width < 480) return 'Móvil pequeño';
    if (width < 768) return 'Móvil';
    if (width < 1024) return 'Tablet';
    if (width < 1440) return 'Desktop';
    return 'Desktop grande';
  }
}

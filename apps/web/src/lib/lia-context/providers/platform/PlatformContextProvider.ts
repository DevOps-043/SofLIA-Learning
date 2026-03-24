/**
 * PlatformContextProvider
 * 
 * Provee contexto general sobre la plataforma SofLIA a SofLIA.
 * Incluye información de funcionalidades, módulos activos y capacidades.
 */

import { BaseContextProvider } from '../base/BaseContextProvider';
import type { ContextFragment, ContextBuildOptions } from '../../types';

/**
 * Módulos principales de la plataforma
 */
const PLATFORM_MODULES = {
  courses: {
    name: 'Cursos',
    description: 'Sistema de cursos con lecciones en video, actividades interactivas y certificados',
    features: ['Videos', 'Actividades', 'Quizzes', 'Certificados', 'Progreso automático']
  },
  studyPlanner: {
    name: 'Planificador de Estudio',
    description: 'Herramienta de planificación de estudio con IA',
    features: ['Generación de planes con IA', 'Integración con calendario', 'Recordatorios']
  },
  communities: {
    name: 'Comunidades',
    description: 'Red social interna para interacción entre usuarios',
    features: ['Posts', 'Comentarios', 'Likes', 'Comunidades públicas y privadas']
  },
  businessPanel: {
    name: 'Panel Empresarial',
    description: 'Herramientas de gestión para administradores de empresas',
    features: ['Gestión de usuarios', 'Asignación de cursos', 'Reportes', 'Analytics', 'Jerarquía de equipos']
  },
  aiDirectory: {
    name: 'Directorio de IA',
    description: 'Catálogo de herramientas y aplicaciones de IA',
    features: ['Apps de IA', 'Prompts', 'Categorías', 'Favoritos']
  },
  lia: {
    name: 'SofLIA - Asistente de IA',
    description: 'Asistente inteligente integrado en toda la plataforma',
    features: ['Chat contextual', 'Ayuda en cursos', 'Planificación de estudio', 'Reporte de bugs']
  },
  workshops: {
    name: 'Talleres',
    description: 'Eventos en vivo y sesiones interactivas',
    features: ['Eventos programados', 'Registro', 'Recordatorios']
  },
  news: {
    name: 'Noticias',
    description: 'Sistema de artículos y noticias de la plataforma',
    features: ['Artículos', 'Categorías', 'Lectura estimada']
  },
  certificates: {
    name: 'Certificados',
    description: 'Sistema de certificación por completar cursos',
    features: ['Generación automática', 'Verificación pública', 'Descarga en PDF']
  },
  reels: {
    name: 'Reels',
    description: 'Videos cortos educativos',
    features: ['Videos verticales', 'Navegación tipo TikTok', 'Likes']
  }
};

/**
 * Roles de usuario en la plataforma
 */
const USER_ROLES = {
  user: 'Usuario estándar - Acceso a cursos y comunidades',
  business_user: 'Usuario empresarial - Acceso a cursos asignados por su empresa',
  business_admin: 'Admin empresarial - Gestión de usuarios y cursos de su empresa',
  instructor: 'Instructor - Creación y gestión de cursos propios',
  admin: 'Administrador - Acceso completo a la plataforma'
};

export class PlatformContextProvider extends BaseContextProvider {
  readonly name = 'platform';
  readonly priority = 10; // Baja prioridad, contexto general

  async getContext(options: ContextBuildOptions): Promise<ContextFragment | null> {
    const { contextType, currentPage } = options;

    // Construir contexto según el tipo solicitado
    const content = this.buildPlatformContext(contextType, currentPage);

    return {
      type: 'platform',
      content,
      priority: this.priority,
      tokens: this.estimateTokens(content)
    };
  }

  shouldInclude(contextType: string): boolean {
    // Incluir solo en contextos generales o cuando se pide explícitamente
    return ['general', 'help', 'platform', 'onboarding'].includes(contextType);
  }

  /**
   * Construye el contexto de la plataforma
   */
  private buildPlatformContext(contextType: string, currentPage?: string): string {
    const sections: string[] = [];

    sections.push('## CONTEXTO DE LA PLATAFORMA SofLIA');
    sections.push('');
    sections.push('SofLIA es una plataforma de aprendizaje corporativo con IA integrada.');
    sections.push('');

    // Módulos relevantes según la página actual
    const relevantModules = this.getRelevantModules(currentPage);
    
    sections.push('### Módulos Principales');
    for (const moduleKey of relevantModules) {
      const module = PLATFORM_MODULES[moduleKey as keyof typeof PLATFORM_MODULES];
      if (module) {
        sections.push(`\n**${module.name}**: ${module.description}`);
        sections.push(`- Funciones: ${module.features.slice(0, 3).join(', ')}`);
      }
    }

    // Roles si es contexto de ayuda general
    if (contextType === 'help' || contextType === 'onboarding') {
      sections.push('\n### Roles de Usuario');
      for (const [role, description] of Object.entries(USER_ROLES)) {
        sections.push(`- **${role}**: ${description}`);
      }
    }

    sections.push('\n### Notas para LIA');
    sections.push('- Responder en español por defecto');
    sections.push('- Ser amigable pero profesional');
    sections.push('- Cuando no sepas algo, sugerir contactar soporte');

    return sections.join('\n');
  }

  /**
   * Determina qué módulos son relevantes para la página actual
   */
  private getRelevantModules(currentPage?: string): string[] {
    if (!currentPage) {
      // Si no hay página, devolver los más importantes
      return ['courses', 'lia', 'studyPlanner', 'communities'];
    }

    const page = currentPage.toLowerCase();

    // Mapear página a módulos relevantes
    if (page.includes('course') || page.includes('learn')) {
      return ['courses', 'lia', 'certificates'];
    }
    if (page.includes('study-planner')) {
      return ['studyPlanner', 'lia', 'courses'];
    }
    if (page.includes('communit')) {
      return ['communities', 'lia'];
    }
    if (page.includes('business-panel')) {
      return ['businessPanel', 'courses', 'lia'];
    }
    if (page.includes('business-user')) {
      return ['courses', 'lia', 'certificates'];
    }
    if (page.includes('apps-directory') || page.includes('prompt-directory')) {
      return ['aiDirectory', 'lia'];
    }
    if (page.includes('workshop')) {
      return ['workshops', 'lia'];
    }
    if (page.includes('news')) {
      return ['news', 'lia'];
    }
    if (page.includes('reel')) {
      return ['reels', 'lia'];
    }
    if (page.includes('admin')) {
      return ['businessPanel', 'lia', 'courses', 'communities'];
    }
    if (page.includes('instructor')) {
      return ['courses', 'lia', 'workshops'];
    }

    // Default
    return ['courses', 'lia', 'studyPlanner', 'communities'];
  }
}

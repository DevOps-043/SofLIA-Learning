import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { OpenAI } from 'openai';
import { formatApiError, logError } from '@/core/utils/api-errors';
import { trackOpenAICall, calculateOpenAIMetadata, calculateCost } from '@/lib/openai/usage-monitor';
import { SessionService } from '@/features/auth/services/session.service';
import { LiaLogger } from '@/lib/analytics/lia-logger';

// OpenAI se instancia dentro de la función POST para evitar errores en build

// Tipos de dominio soportados
type NanoBananaDomain = 'ui' | 'photo' | 'diagram';
type OutputFormat = 'wireframe' | 'mockup' | 'render' | 'diagram';

// Interfaz para el esquema JSON de NanoBanana
interface NanoBananaSchema {
  meta: {
    domain: NanoBananaDomain;
    style: string;
    outputFormat: OutputFormat;
    version: string;
    createdAt: string;
  };
  scene: {
    id: string;
    description: string;
    environment: {
      lighting: string;
      background: string;
      mood: string;
      colorScheme?: string;
    };
  };
  entities: Array<{
    id: string;
    type: string;
    name: string;
    properties: Record<string, unknown>;
    position: string;
    emphasis: string;
    children?: Array<unknown>;
  }>;
  constraints: {
    accessibility?: {
      minTouchTarget?: string;
      contrastRatio?: string;
      colorBlindSafe?: boolean;
    };
    brandGuidelines?: Record<string, unknown>;
    technicalRequirements?: Record<string, unknown>;
  };
  variations?: Array<{
    id: string;
    description: string;
    changes: Record<string, unknown>;
  }>;
}

// Plantillas base por dominio
const DOMAIN_TEMPLATES: Record<NanoBananaDomain, Partial<NanoBananaSchema>> = {
  ui: {
    meta: {
      domain: 'ui',
      style: 'modern',
      outputFormat: 'wireframe',
      version: '1.0',
      createdAt: new Date().toISOString()
    },
    scene: {
      id: 'scene_ui_001',
      description: '',
      environment: {
        lighting: 'ambient',
        background: '#121212',
        mood: 'professional',
        colorScheme: 'dark'
      }
    },
    constraints: {
      accessibility: {
        minTouchTarget: '44px',
        contrastRatio: '4.5:1',
        colorBlindSafe: true
      }
    }
  },
  photo: {
    meta: {
      domain: 'photo',
      style: 'professional',
      outputFormat: 'render',
      version: '1.0',
      createdAt: new Date().toISOString()
    },
    scene: {
      id: 'scene_photo_001',
      description: '',
      environment: {
        lighting: 'natural',
        background: 'studio_white',
        mood: 'clean'
      }
    },
    constraints: {
      technicalRequirements: {
        aspectRatio: '16:9',
        resolution: 'high',
        format: 'png'
      }
    }
  },
  diagram: {
    meta: {
      domain: 'diagram',
      style: 'technical',
      outputFormat: 'diagram',
      version: '1.0',
      createdAt: new Date().toISOString()
    },
    scene: {
      id: 'scene_diagram_001',
      description: '',
      environment: {
        lighting: 'flat',
        background: '#FFFFFF',
        mood: 'informative'
      }
    },
    constraints: {
      technicalRequirements: {
        gridAlignment: true,
        vectorFormat: true
      }
    }
  }
};

// Prompt maestro para el Traductor de JSON de NanoBanana
const NANOBANA_MASTER_PROMPT = `Eres un especialista en NanoBanana Pro, una herramienta de generación de imágenes de precisión. Tu función es convertir descripciones visuales en esquemas JSON estructurados que NanoBanana Pro pueda renderizar con exactitud.

IDENTIDAD:
- Nombre: Lia (Agente NanoBanana)
- Especialidad: Traducción de lenguaje natural a JSON estructurado para NanoBanana Pro
- Enfoque: Precisión, reproducibilidad y control composicional

PRINCIPIOS CLAVE DE NANOBANA PRO:
1. Es un "motor de renderizado de precisión", no una "máquina de vibras"
2. Funciona mejor con instrucciones específicas y estructuradas
3. Permite "mutaciones acotadas" - modificar elementos individuales sin afectar el resto
4. Los IDs estables permiten reproducibilidad exacta

DOMINIOS SOPORTADOS:
1. UI/Wireframes: Interfaces de usuario, apps móviles, dashboards, componentes web
2. Fotos/Marketing: Imágenes de productos, fotografía comercial, composiciones visuales, imágenes promocionales/educativas, banners de cursos, portadas
3. Diagramas: Flujos de proceso, arquitecturas de sistema, organigramas, mapas mentales

REGLAS DE GENERACIÓN JSON:
1. SIEMPRE asigna IDs únicos y descriptivos a cada entidad (ej: "btn_submit_001", "hero_product_main", "course_title_text", "ai_icon_primary")
2. Sé EXTREMADAMENTE específico en propiedades visuales:
   - Colores en formato HEX (#FFFFFF) - especifica paleta completa (primario, secundario, acentos)
   - Dimensiones exactas en px, rem o porcentajes
   - Posiciones precisas (center, top-left, etc.)
   - Tipografía: fontFamily, fontSize, fontWeight, lineHeight, letterSpacing
   - Espaciado: padding, margin, gap entre elementos
3. Para imágenes educativas/promocionales:
   - Incluye elementos visuales específicos: iconos, ilustraciones, formas geométricas, gradientes
   - Define jerarquía visual clara: qué elemento es más importante
   - Especifica estilo visual: moderno, minimalista, corporativo, creativo, tech, educativo
   - Incluye texto si aplica: títulos, subtítulos, descripciones con propiedades tipográficas completas
   - Define composición: layout (centrado, asimétrico, grid), balance, espacios negativos
4. Incluye SIEMPRE restricciones de accesibilidad para UI:
   - minTouchTarget: "44px" (mínimo para móviles)
   - contrastRatio: "4.5:1" (estándar WCAG AA)
5. El JSON debe ser DETERMINISTA - misma entrada = mismo resultado
6. Organiza entidades jerárquicamente cuando sea apropiado (padre → hijos)
7. Para imágenes promocionales/educativas: NO uses plantillas genéricas de productos. Crea entidades específicas que representen el concepto educativo (ej: iconos de IA, gráficos, ilustraciones conceptuales, elementos visuales temáticos)

ESTRUCTURA OBLIGATORIA DEL JSON:
{
  "meta": {
    "domain": "ui|photo|diagram",
    "style": "descripción del estilo visual",
    "outputFormat": "wireframe|mockup|render|diagram",
    "version": "1.0",
    "createdAt": "timestamp ISO"
  },
  "scene": {
    "id": "identificador único de la escena",
    "description": "descripción detallada de la escena",
    "environment": {
      "lighting": "tipo de iluminación",
      "background": "color HEX o descripción",
      "mood": "tono emocional",
      "colorScheme": "light|dark|custom" (opcional)
    }
  },
  "entities": [
    {
      "id": "identificador único estable",
      "type": "tipo de entidad (component|product|element|node|connector)",
      "name": "nombre descriptivo",
      "properties": {
        // Propiedades específicas según el tipo
      },
      "position": "ubicación en la escena",
      "emphasis": "primary|secondary|background",
      "children": [] // Entidades hijas si aplica
    }
  ],
  "constraints": {
    "accessibility": {
      "minTouchTarget": "44px",
      "contrastRatio": "4.5:1",
      "colorBlindSafe": true
    },
    "brandGuidelines": {},
    "technicalRequirements": {}
  },
  "variations": [
    {
      "id": "var_001",
      "description": "descripción de la variación",
      "changes": {
        // Solo los cambios respecto al original
      }
    }
  ]
}

PROPIEDADES ESPECÍFICAS POR DOMINIO:

Para UI/Wireframes:
- screens: array de pantallas
- components: botones, inputs, cards, navbars, etc.
- typography: fontFamily, fontSize, fontWeight, lineHeight
- spacing: padding, margin, gap
- interactions: onClick, onHover, transitions

Para Fotos/Marketing:
- subject: producto, concepto o elemento principal (para imágenes educativas: conceptos abstractos, iconos, ilustraciones)
- props: objetos adicionales en la escena, elementos decorativos, iconografía
- camera: angle, distance, focalLength
- postProcessing: filters, colorGrading
- textOverlay: texto, tipografía, jerarquía visual (para banners/promocionales)
- composition: layout, grid, rule of thirds, balance visual
- visualStyle: ilustración, fotografía, 3D, flat design, gradientes, minimalista

Para Diagramas:
- nodes: entidades del diagrama
- connectors: flechas, líneas, relaciones
- labels: textos y anotaciones
- flowDirection: left-to-right, top-to-bottom

FORMATO DE RESPUESTA:
Responde SIEMPRE con un JSON válido y bien formateado. NO incluyas explicaciones fuera del JSON.
Si necesitas hacer preguntas clarificadoras, hazlas ANTES de generar el JSON.

EJEMPLOS DE INTERACCIÓN:

Ejemplo 1 - UI:
Usuario: "Necesito una app de fitness con tema oscuro"
Respuesta: Genera un JSON completo con todas las pantallas, componentes y propiedades especificadas.

Ejemplo 2 - Imagen Educativa/Promocional:
Usuario: "Quiero una imagen promocional para un curso de introducción a la inteligencia artificial"
Respuesta: Genera un JSON con:
- Entidades visuales específicas: iconos de IA, circuitos, nodos, elementos tech
- Composición moderna: layout centrado o asimétrico, gradientes, espacios negativos
- Texto tipográfico: título del curso con propiedades completas (fontFamily, fontSize, color, weight)
- Elementos decorativos: formas geométricas, líneas, patrones
- Paleta de colores profesional: azules tech, morados innovadores, blancos/grises limpios
- Estilo visual: moderno, minimalista, tech, profesional
- NO uses plantillas de productos físicos - crea una composición conceptual visual`;

// Función para detectar el dominio basado en el mensaje
function detectDomain(message: string): NanoBananaDomain {
  const messageLower = message.toLowerCase();
  
  // Patrones para UI
  const uiPatterns = [
    'app', 'aplicación', 'interfaz', 'ui', 'ux', 'wireframe', 'mockup',
    'pantalla', 'screen', 'botón', 'button', 'formulario', 'form',
    'dashboard', 'navbar', 'menú', 'sidebar', 'modal', 'card',
    'móvil', 'mobile', 'web', 'responsive', 'componente', 'landing'
  ];
  
  // Patrones para fotos (incluye imágenes promocionales/educativas)
  const photoPatterns = [
    'foto', 'photo', 'imagen', 'image', 'producto', 'product',
    'marketing', 'publicidad', 'anuncio', 'banner', 'poster',
    'retrato', 'portrait', 'escena', 'scene', 'estudio', 'studio',
    'iluminación', 'lighting', 'composición', 'portada', 'cover',
    'promocional', 'educativo', 'curso', 'course', 'ilustración', 'illustration'
  ];
  
  // Patrones para diagramas
  const diagramPatterns = [
    'diagrama', 'diagram', 'flujo', 'flow', 'proceso', 'process',
    'arquitectura', 'architecture', 'esquema', 'schema', 'mapa',
    'organigrama', 'flowchart', 'secuencia', 'sequence', 'erd',
    'uml', 'red', 'network', 'relación', 'conexión'
  ];
  
  const uiScore = uiPatterns.filter(p => messageLower.includes(p)).length;
  const photoScore = photoPatterns.filter(p => messageLower.includes(p)).length;
  const diagramScore = diagramPatterns.filter(p => messageLower.includes(p)).length;
  
  if (diagramScore > uiScore && diagramScore > photoScore) return 'diagram';
  if (photoScore > uiScore && photoScore > diagramScore) return 'photo';
  return 'ui'; // Default a UI
}

// Función para detectar el formato de salida
function detectOutputFormat(message: string, domain: NanoBananaDomain): OutputFormat {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('wireframe') || messageLower.includes('esquema') || messageLower.includes('boceto')) {
    return 'wireframe';
  }
  if (messageLower.includes('mockup') || messageLower.includes('prototipo') || messageLower.includes('alta fidelidad')) {
    return 'mockup';
  }
  if (messageLower.includes('render') || messageLower.includes('final') || messageLower.includes('producción')) {
    return 'render';
  }
  
  // Defaults por dominio
  switch (domain) {
    case 'ui': return 'wireframe';
    case 'photo': return 'render';
    case 'diagram': return 'diagram';
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.log('🎨 API generate-nanobana called');
    
    // ✅ Obtener usuario autenticado para analytics
    const user = await SessionService.getCurrentUser();
    const userId = user?.id || null;
    
    // ✅ Inicializar LiaLogger si hay usuario
    let liaLogger: LiaLogger | null = null;
    let conversationId: string | null = null;
    
    if (userId) {
      liaLogger = new LiaLogger(userId);
      try {
        conversationId = await liaLogger.startConversation({
          contextType: 'general', // NanoBanana usa contexto general
        });
        logger.log('✅ [LiaLogger] Conversación iniciada:', conversationId);
      } catch (logError) {
        logger.log('⚠️ [LiaLogger] Error iniciando conversación:', logError);
        // Continuar sin analytics si falla
        liaLogger = null;
      }
    }
    
    const { message, conversationHistory, preferredDomain, preferredFormat } = await request.json();
    logger.log('📝 Message received:', message);

    // Validar entrada
    if (!message || typeof message !== 'string') {
      logger.log('❌ No message provided');
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Detectar dominio y formato
    const domain: NanoBananaDomain = preferredDomain || detectDomain(message);
    const outputFormat: OutputFormat = preferredFormat || detectOutputFormat(message, domain);
    
    logger.log('🔍 Detected domain:', domain, 'format:', outputFormat);

    // Obtener plantilla base
    const baseTemplate = DOMAIN_TEMPLATES[domain];

    // Construir historial de conversación
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: NANOBANA_MASTER_PROMPT
      },
      {
        role: 'system',
        content: `CONTEXTO ACTUAL:
- Dominio detectado: ${domain}
- Formato de salida: ${outputFormat}
- Plantilla base a usar: ${JSON.stringify(baseTemplate, null, 2)}

Genera un JSON completo basado en la solicitud del usuario, utilizando la plantilla base como punto de partida pero expandiéndola con todos los detalles necesarios.`
      }
    ];

    // Agregar historial de conversación
    const recentHistory = conversationHistory ? conversationHistory.slice(-6) : [];
    recentHistory.forEach((msg: { sender: string; text: string }) => {
      messages.push({
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: msg.text
      });
    });

    // Agregar el mensaje actual con contexto mejorado
    let userPrompt = `Genera un JSON estructurado para NanoBanana Pro basado en esta descripción:\n\n${message}\n\nDominio: ${domain}\nFormato: ${outputFormat}\n\n`;
    
    // Instrucciones específicas para imágenes educativas/promocionales
    if (domain === 'photo' && (message.toLowerCase().includes('curso') || message.toLowerCase().includes('educativo') || message.toLowerCase().includes('promocional') || message.toLowerCase().includes('banner') || message.toLowerCase().includes('portada'))) {
      userPrompt += `\nIMPORTANTE: Esta es una imagen educativa/promocional. NO uses plantillas de fotografía de productos físicos.\n
- Crea una composición visual moderna y atractiva con elementos conceptuales (iconos, ilustraciones, formas, gradientes)
- Define claramente la jerarquía visual: elemento principal, secundario, fondo
- Incluye propiedades tipográficas completas si hay texto
- Especifica estilo visual (moderno, minimalista, tech, corporativo, creativo)
- Usa colores que transmitan el concepto educativo/profesional
- Define layout y composición (centrado, grid, asimétrico)
- Incluye elementos visuales temáticos relacionados con el contenido (ej: para IA: circuitos, nodos, redes, iconos tecnológicos)\n\n`;
    }
    
    userPrompt += `Responde SOLO con el JSON válido, sin explicaciones adicionales.`;
    
    messages.push({
      role: 'user',
      content: userPrompt
    });

    // Llamar a OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    logger.log('🤖 Calling OpenAI for NanoBanana JSON generation');
    const startTime = Date.now();
    const model = 'gpt-4o';
    const completion = await openai.chat.completions.create({
      model,
      messages: messages,
      temperature: 0.5, // Más bajo para mayor consistencia
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });
    const responseTime = Date.now() - startTime;
    logger.log('✅ OpenAI response received');
    
    // ✅ Registrar uso de OpenAI para NanoBanana
    if (completion.usage) {
      await trackOpenAICall(calculateOpenAIMetadata(
        {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens
        },
        model,
        'nanobana-generation',
        undefined, // No tenemos userId en este contexto
        responseTime
      ));
    }

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    // Parsear y validar el JSON
    let generatedSchema: NanoBananaSchema;
    try {
      generatedSchema = JSON.parse(response);
      
      // Asegurar que tiene la estructura mínima requerida
      if (!generatedSchema.meta) {
        generatedSchema.meta = {
          ...baseTemplate.meta!,
          createdAt: new Date().toISOString()
        };
      }
      if (!generatedSchema.scene) {
        generatedSchema.scene = baseTemplate.scene!;
      }
      if (!generatedSchema.entities) {
        generatedSchema.entities = [];
      }
      if (!generatedSchema.constraints) {
        generatedSchema.constraints = baseTemplate.constraints || {};
      }
      
      // Actualizar metadata
      generatedSchema.meta.domain = domain;
      generatedSchema.meta.outputFormat = outputFormat;
      generatedSchema.meta.createdAt = new Date().toISOString();
      
    } catch (parseError) {
      logger.log('❌ Error parsing JSON response:', parseError);
      throw new Error('Error al parsear el JSON generado');
    }

    // Generar mensaje de respuesta amigable
    const domainNames: Record<NanoBananaDomain, string> = {
      ui: 'Interfaz de Usuario',
      photo: 'Fotografía/Marketing',
      diagram: 'Diagrama'
    };
    
    const formatNames: Record<OutputFormat, string> = {
      wireframe: 'Wireframe',
      mockup: 'Mockup',
      render: 'Render',
      diagram: 'Diagrama'
    };

    const entityCount = generatedSchema.entities?.length || 0;
    const friendlyResponse = `¡JSON generado exitosamente! 🎨

📊 Dominio: ${domainNames[domain]}
📐 Formato: ${formatNames[outputFormat]}
🧩 Entidades: ${entityCount} elementos

El esquema está listo para usar en NanoBanana Pro. Puedes copiarlo directamente o modificar entidades individuales usando sus IDs estables.`;

    const finalResponse = {
      response: friendlyResponse,
      generatedSchema: generatedSchema,
      domain: domain,
      outputFormat: outputFormat,
      jsonString: JSON.stringify(generatedSchema, null, 2),
      conversationId: conversationId // ✅ Devolver conversationId para tracking
    };
    
    // ✅ Registrar mensajes en BD con LiaLogger
    if (liaLogger && conversationId && completion.usage) {
      try {
        // Registrar mensaje del usuario
        await liaLogger.logMessage('user', message, false);
        
        // Registrar respuesta del asistente con metadatos
        const totalCost = calculateCost(
          completion.usage.prompt_tokens,
          completion.usage.completion_tokens,
          model
        );
        
        await liaLogger.logMessage('assistant', friendlyResponse, false, {
          modelUsed: model,
          tokensUsed: completion.usage.total_tokens,
          costUsd: totalCost,
          responseTimeMs: responseTime
        });
        
        logger.log('✅ [LiaLogger] Mensajes registrados en BD');
      } catch (logError) {
        logger.log('⚠️ [LiaLogger] Error registrando mensajes:', logError);
      }
    }
    
    logger.log('📤 Sending NanoBanana response');
    
    return NextResponse.json(finalResponse);

  } catch (error) {
    logError('POST /api/ai-directory/generate-nanobana', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          formatApiError(error, 'Error de configuración de API'),
          { status: 500 }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          formatApiError(error, 'Límite de solicitudes excedido. Inténtalo más tarde.'),
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      formatApiError(error, 'Error al generar esquema NanoBanana'),
      { status: 500 }
    );
  }
}


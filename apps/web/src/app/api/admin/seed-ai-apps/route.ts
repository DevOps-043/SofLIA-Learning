import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function POST() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()

    // Categorías de IA
    const categoriesData = [
      {
        name: 'Chatbots y Conversacional',
        slug: 'chatbots-conversacional',
        description: 'Herramientas de IA para conversación y asistencia',
        icon: 'chat-bubble-left-right',
        color: 'var(--color-info)',
        is_active: true
      },
      {
        name: 'Generación de Imágenes',
        slug: 'generacion-imagenes',
        description: 'Herramientas para crear imágenes con IA',
        icon: 'photo',
        color: 'var(--color-success)',
        is_active: true
      }
    ]

    // Crear categorías primero
    const { data: categories, error: categoriesError } = await supabase
      .from('ai_categories')
      .insert(categoriesData)
      .select()

    if (categoriesError) {
      logger.error('Error creando categorías:', categoriesError)
      return NextResponse.json({ error: 'Error creando categorías' }, { status: 500 })
    }

    // Datos de apps de IA
    const aiAppsData = [
      {
        name: 'ChatGPT',
        slug: 'chatgpt',
        description: 'Asistente de IA conversacional desarrollado por OpenAI',
        long_description: 'ChatGPT es un modelo de lenguaje avanzado que puede mantener conversaciones naturales, responder preguntas, ayudar con tareas de escritura, programación y más.',
        category_id: categories.find(cat => cat.slug === 'chatbots-conversacional')?.id,
        website_url: 'https://chat.openai.com',
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
        pricing_model: 'freemium',
        pricing_details: {
          free: 'Uso limitado gratuito',
          paid: 'ChatGPT Plus: $20/mes'
        },
        features: 'Conversación natural, generación de texto, programación, análisis de datos',
        use_cases: 'Asistencia general, escritura, programación, educación',
        advantages: 'Fácil de usar, respuestas coherentes, amplio conocimiento',
        disadvantages: 'Limitaciones en información reciente, puede generar información incorrecta',
        alternatives: 'Claude, Gemini, Perplexity',
        tags: 'chatbot,ai,conversational,openai',
        supported_languages: 'Múltiples idiomas',
        integrations: 'API disponible, plugins para navegadores',
        api_available: true,
        mobile_app: true,
        desktop_app: false,
        browser_extension: true,
        is_featured: true,
        is_verified: true,
        view_count: 0,
        like_count: 0,
        rating: 4.8,
        rating_count: 0,
        is_active: true
      },
      {
        name: 'Claude',
        slug: 'claude',
        description: 'Asistente de IA de Anthropic con enfoque en seguridad y utilidad',
        long_description: 'Claude es un modelo de IA desarrollado por Anthropic, diseñado para ser útil, inofensivo y honesto en sus interacciones.',
        category_id: categories.find(cat => cat.slug === 'chatbots-conversacional')?.id,
        website_url: 'https://claude.ai',
        logo_url: 'https://claude.ai/favicon.ico',
        pricing_model: 'freemium',
        pricing_details: {
          free: 'Uso limitado gratuito',
          paid: 'Claude Pro: $20/mes'
        },
        features: 'Análisis de documentos, programación, escritura creativa',
        use_cases: 'Análisis de documentos, programación, escritura',
        advantages: 'Excelente para análisis de texto, más seguro',
        disadvantages: 'Menos conocido que ChatGPT, limitaciones similares',
        alternatives: 'ChatGPT, Gemini, Perplexity',
        tags: 'chatbot,ai,anthropic,analysis',
        supported_languages: 'Inglés principalmente',
        integrations: 'API disponible',
        api_available: true,
        mobile_app: false,
        desktop_app: false,
        browser_extension: false,
        is_featured: true,
        is_verified: true,
        view_count: 0,
        like_count: 0,
        rating: 4.7,
        rating_count: 0,
        is_active: true
      },
      {
        name: 'Midjourney',
        slug: 'midjourney',
        description: 'Generador de imágenes con IA especializado en arte digital',
        long_description: 'Midjourney es una herramienta de generación de imágenes que utiliza inteligencia artificial para crear arte digital de alta calidad a partir de descripciones de texto.',
        category_id: categories.find(cat => cat.slug === 'generacion-imagenes')?.id,
        website_url: 'https://midjourney.com',
        logo_url: 'https://midjourney.com/favicon.ico',
        pricing_model: 'subscription',
        pricing_details: {
          basic: '$10/mes',
          standard: '$30/mes',
          pro: '$60/mes'
        },
        features: 'Generación de imágenes, estilos artísticos, alta resolución',
        use_cases: 'Arte digital, marketing visual, conceptos creativos',
        advantages: 'Calidad artística excepcional, múltiples estilos',
        disadvantages: 'Solo disponible en Discord, requiere suscripción',
        alternatives: 'DALL-E, Stable Diffusion, Adobe Firefly',
        tags: 'image-generation,art,ai,creative',
        supported_languages: 'Inglés',
        integrations: 'Discord bot',
        api_available: false,
        mobile_app: false,
        desktop_app: false,
        browser_extension: false,
        is_featured: true,
        is_verified: true,
        view_count: 0,
        like_count: 0,
        rating: 4.6,
        rating_count: 0,
        is_active: true
      }
    ]

    // Crear apps de IA
    const { data: apps, error: appsError } = await supabase
      .from('ai_apps')
      .insert(aiAppsData)
      .select()

    if (appsError) {
      logger.error('Error creando apps:', appsError)
      return NextResponse.json({ error: 'Error creando apps' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Datos de prueba insertados exitosamente',
      categories: categories.length,
      apps: apps.length
    })

  } catch (error) {
    logger.error('Error en seed:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

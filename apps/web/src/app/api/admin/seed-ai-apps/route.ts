import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function POST() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    const categoriesData = [
      {
        color: 'var(--color-info)',
        description: 'Herramientas de IA para conversacion y asistencia',
        icon: 'chat-bubble-left-right',
        is_active: true,
        name: 'Chatbots y Conversacional',
        slug: 'chatbots-conversacional',
      },
      {
        color: 'var(--color-success)',
        description: 'Herramientas para crear imagenes con IA',
        icon: 'photo',
        is_active: true,
        name: 'Generacion de Imagenes',
        slug: 'generacion-imagenes',
      },
    ]

    const { data: categories, error: categoriesError } = await supabase
      .from('ai_categories')
      .insert(categoriesData)
      .select()

    if (categoriesError) {
      logger.error('Error creando categorias:', categoriesError)
      return NextResponse.json({ error: 'Error creando categorias' }, { status: 500 })
    }

    const findCategoryId = (slug: string) =>
      categories?.find((category) => category.slug === slug)?.id

    const aiAppsData = [
      {
        advantages: 'Capacidades multimodales, integracion con ecosistema Google, respuestas coherentes',
        alternatives: 'Claude, Perplexity',
        api_available: true,
        browser_extension: true,
        category_id: findCategoryId('chatbots-conversacional'),
        description: 'Asistente de IA conversacional de Google',
        desktop_app: false,
        disadvantages: 'Puede generar informacion incorrecta y requiere validacion en temas criticos',
        features: 'Conversacion natural, generacion de texto, programacion, analisis de datos y capacidades multimodales',
        integrations: 'API disponible e integraciones de Google',
        is_active: true,
        is_featured: true,
        is_verified: true,
        like_count: 0,
        logo_url: 'https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg',
        long_description: 'Gemini es un modelo multimodal avanzado que puede mantener conversaciones naturales, responder preguntas, ayudar con tareas de escritura, programacion y analisis.',
        mobile_app: true,
        name: 'Gemini',
        pricing_details: {
          free: 'Uso limitado gratuito',
          paid: 'Planes de Google AI disponibles',
        },
        pricing_model: 'freemium',
        rating: 4.8,
        rating_count: 0,
        slug: 'gemini',
        supported_languages: 'Multiples idiomas',
        tags: 'chatbot,ai,conversational,gemini,google',
        use_cases: 'Asistencia general, escritura, programacion, educacion y analisis multimodal',
        view_count: 0,
        website_url: 'https://gemini.google.com',
      },
      {
        advantages: 'Excelente para analisis de texto, enfoque de seguridad',
        alternatives: 'Gemini, Perplexity',
        api_available: true,
        browser_extension: false,
        category_id: findCategoryId('chatbots-conversacional'),
        description: 'Asistente de IA de Anthropic con enfoque en seguridad y utilidad',
        desktop_app: false,
        disadvantages: 'Menos conocido, limitaciones similares a otros asistentes',
        features: 'Analisis de documentos, programacion, escritura creativa',
        integrations: 'API disponible',
        is_active: true,
        is_featured: true,
        is_verified: true,
        like_count: 0,
        logo_url: 'https://claude.ai/favicon.ico',
        long_description: 'Claude es un modelo de IA desarrollado por Anthropic, disenado para ser util, inofensivo y honesto en sus interacciones.',
        mobile_app: false,
        name: 'Claude',
        pricing_details: {
          free: 'Uso limitado gratuito',
          paid: 'Claude Pro: $20/mes',
        },
        pricing_model: 'freemium',
        rating: 4.7,
        rating_count: 0,
        slug: 'claude',
        supported_languages: 'Ingles principalmente',
        tags: 'chatbot,ai,anthropic,analysis',
        use_cases: 'Analisis de documentos, programacion, escritura',
        view_count: 0,
        website_url: 'https://claude.ai',
      },
      {
        advantages: 'Alta calidad artistica, comunidad activa',
        alternatives: 'DALL-E, Stable Diffusion, Leonardo AI',
        api_available: false,
        browser_extension: false,
        category_id: findCategoryId('generacion-imagenes'),
        description: 'Generador de imagenes con IA especializado en arte digital',
        desktop_app: false,
        disadvantages: 'Requiere Discord, curva de aprendizaje',
        features: 'Generacion de imagenes, estilos artisticos, variaciones',
        integrations: 'Discord',
        is_active: true,
        is_featured: true,
        is_verified: true,
        like_count: 0,
        logo_url: 'https://midjourney.com/favicon.ico',
        long_description: 'Midjourney es una herramienta de generacion de imagenes que utiliza inteligencia artificial para crear arte digital a partir de descripciones de texto.',
        mobile_app: false,
        name: 'Midjourney',
        pricing_details: {
          paid: 'Desde $10/mes',
        },
        pricing_model: 'subscription',
        rating: 4.9,
        rating_count: 0,
        slug: 'midjourney',
        supported_languages: 'Ingles principalmente',
        tags: 'image-generation,art,creative,design',
        use_cases: 'Arte digital, ilustraciones, conceptos visuales',
        view_count: 0,
        website_url: 'https://midjourney.com',
      },
    ]

    const { data: apps, error: appsError } = await supabase
      .from('ai_apps')
      .insert(aiAppsData)
      .select()

    if (appsError) {
      logger.error('Error creando apps:', appsError)
      return NextResponse.json({ error: 'Error creando apps' }, { status: 500 })
    }

    return NextResponse.json({
      apps: apps?.length || 0,
      categories: categories?.length || 0,
      message: 'Apps de IA sembradas correctamente',
      success: true,
    })
  } catch (error) {
    logger.error('Error en seed:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

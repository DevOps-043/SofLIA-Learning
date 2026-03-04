/**
 * Metadata de Páginas para el Sistema de Contexto Dinámico de LIA
 * 
 * Este archivo contiene información técnica sobre cada página de la plataforma,
 * incluyendo componentes, APIs, flujos de usuario y problemas comunes.
 * 
 * LIA usa esta información para:
 * - Identificar componentes cuando hay problemas
 * - Entender flujos de usuario
 * - Sugerir soluciones basadas en problemas conocidos
 * - Generar reportes de bugs más precisos
 */

import type { PageMetadata } from '../types';

/**
 * Registry de metadata de todas las páginas de la plataforma
 */
export const PAGE_METADATA: Record<string, PageMetadata> = {
  // ============================================================================
  // BUSINESS PANEL - COURSES
  // ============================================================================
  '/[orgSlug]/business-panel/courses': {
    route: '/[orgSlug]/business-panel/courses',
    routePattern: '/{orgSlug}/business-panel/courses',
    pageType: 'business_panel_courses',
    components: [
      {
        name: 'BusinessCoursesPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/courses/page.tsx',
        description: 'Página principal del catálogo de cursos para asignar a usuarios',
        props: [],
        commonErrors: [
          'Cursos no cargan: Verificar API GET /api/[orgSlug]/business/courses',
          'Error 403: Usuario sin permisos de administrador de business-panel',
          'Grid vacío: No hay cursos disponibles para la organización'
        ]
      },
      {
        name: 'BusinessAssignCourseModal',
        path: 'apps/web/src/features/business-panel/components/BusinessAssignCourseModal.tsx',
        description: 'Modal para asignar cursos a usuarios individuales o equipos',
        props: ['courseId', 'courseName', 'onClose', 'onSuccess'],
        commonErrors: [
          'Validación de fechas falla: fecha_inicio debe ser menor que fecha_limite',
          'Error al asignar: Verificar permisos del usuario y que los usuarios existan',
          'Modal no cierra: Error en callback onSuccess o estado no se actualiza',
          'Usuarios no cargan: Verificar API de usuarios de la organización'
        ]
      },
      {
        name: 'LiaDeadlineSuggestionModal',
        path: 'apps/web/src/features/business-panel/components/LiaDeadlineSuggestionModal.tsx',
        description: 'Modal de sugerencias de fechas límite con IA',
        props: ['courseId', 'courseDuration', 'onSelectDate', 'onClose'],
        commonErrors: [
          'Sugerencias no cargan: Error en API de sugerencias',
          'Fechas incorrectas: Verificar duración del curso'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/[orgSlug]/business/courses',
        method: 'GET',
        description: 'Obtiene lista de cursos disponibles para la organización',
        commonErrors: [
          '403 Forbidden: Usuario sin permisos de business-panel',
          '500 Internal Error: Error en query de BD o organización no encontrada'
        ]
      },
      {
        endpoint: '/api/[orgSlug]/business/courses',
        method: 'POST',
        description: 'Asigna un curso a usuarios o equipos',
        commonErrors: [
          '400 Bad Request: Datos de asignación inválidos',
          '403 Forbidden: Sin permisos para asignar cursos',
          '404 Not Found: Curso o usuarios no encontrados'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Asignar curso a usuarios individuales',
        steps: [
          '1. Navegar a Catálogo de Cursos en Business Panel',
          '2. Click en botón "Asignar" del curso deseado',
          '3. En el modal, seleccionar pestaña "Usuarios"',
          '4. Buscar y seleccionar usuarios con checkbox',
          '5. Click en "Siguiente" para configurar fechas',
          '6. Seleccionar fecha de inicio y fecha límite',
          '7. Opcionalmente usar "Sugerir con IA" para fechas',
          '8. Click en "Asignar Curso" para confirmar'
        ],
        commonBreakpoints: [
          'Paso 4: Usuarios no aparecen en la lista',
          'Paso 6: Validación de fechas falla',
          'Paso 8: Error al guardar la asignación'
        ]
      },
      {
        name: 'Asignar curso a un equipo completo',
        steps: [
          '1. Navegar a Catálogo de Cursos en Business Panel',
          '2. Click en botón "Asignar" del curso deseado',
          '3. En el modal, seleccionar pestaña "Equipos"',
          '4. Seleccionar el equipo deseado',
          '5. Configurar fechas',
          '6. Confirmar asignación'
        ],
        commonBreakpoints: [
          'Paso 4: Equipos no cargan',
          'Paso 6: Error al asignar a todos los miembros'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Modal de asignación no se cierra después de asignar',
        possibleCauses: [
          'Error en callback onSuccess no manejado',
          'Estado del modal no se actualiza correctamente',
          'Componente padre no recibe la señal de cierre'
        ],
        solutions: [
          'Verificar que onSuccess se ejecuta sin errores',
          'Revisar logs de consola para errores de React',
          'Refrescar la página y reintentar'
        ]
      },
      {
        description: 'Cursos no aparecen en el catálogo',
        possibleCauses: [
          'Organización no tiene cursos asignados',
          'Error en la API de cursos',
          'Filtros activos ocultando cursos'
        ],
        solutions: [
          'Verificar en Admin Panel que hay cursos asignados a la organización',
          'Revisar Network tab para errores en la API',
          'Limpiar filtros de búsqueda'
        ]
      }
    ]
  },

  // ============================================================================
  // BUSINESS PANEL - USERS
  // ============================================================================
  '/[orgSlug]/business-panel/users': {
    route: '/[orgSlug]/business-panel/users',
    routePattern: '/{orgSlug}/business-panel/users',
    pageType: 'business_panel_users',
    components: [
      {
        name: 'BusinessUsersPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/users/page.tsx',
        description: 'Página de gestión de usuarios de la organización',
        props: [],
        commonErrors: [
          'Lista de usuarios no carga: Error en API de usuarios',
          'Error 403: Sin permisos de administrador'
        ]
      },
      {
        name: 'BusinessAddUserModal',
        path: 'apps/web/src/features/business-panel/components/BusinessAddUserModal.tsx',
        description: 'Modal para agregar nuevos usuarios a la organización',
        props: ['onClose', 'onSuccess'],
        commonErrors: [
          'Error al crear usuario: Email ya existe',
          'Validación falla: Campos requeridos vacíos'
        ]
      },
      {
        name: 'BusinessUserStatsModal',
        path: 'apps/web/src/features/business-panel/components/BusinessUserStatsModal.tsx',
        description: 'Modal con estadísticas detalladas de un usuario',
        props: ['userId', 'userName', 'onClose'],
        commonErrors: [
          'Estadísticas no cargan: Error en API de stats',
          'Gráficos no se renderizan: Error en datos'
        ]
      },
      {
        name: 'BusinessImportUsersModal',
        path: 'apps/web/src/features/business-panel/components/BusinessImportUsersModal.tsx',
        description: 'Modal para importar usuarios masivamente via CSV',
        props: ['onClose', 'onSuccess'],
        commonErrors: [
          'Archivo no se procesa: Formato CSV incorrecto',
          'Errores de validación: Emails duplicados o inválidos'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/business/users',
        method: 'GET',
        description: 'Obtiene lista de usuarios de la organización',
        commonErrors: [
          '403 Forbidden: Sin permisos de administrador',
          '500 Internal Error: Error en query de BD'
        ]
      },
      {
        endpoint: '/api/business/users',
        method: 'POST',
        description: 'Crea un nuevo usuario en la organización',
        commonErrors: [
          '400 Bad Request: Datos inválidos',
          '409 Conflict: Email ya existe'
        ]
      },
      {
        endpoint: '/api/business/users/[userId]/stats',
        method: 'GET',
        description: 'Obtiene estadísticas de un usuario específico',
        commonErrors: [
          '404 Not Found: Usuario no encontrado',
          '403 Forbidden: Sin permisos para ver este usuario'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Agregar usuario individual',
        steps: [
          '1. Click en botón "Agregar Usuario"',
          '2. Completar formulario con email, nombre, apellido',
          '3. Seleccionar rol y equipo (opcional)',
          '4. Click en "Agregar" para enviar invitación'
        ],
        commonBreakpoints: [
          'Paso 2: Validación de email falla',
          'Paso 4: Error al enviar invitación'
        ]
      },
      {
        name: 'Importar usuarios masivamente',
        steps: [
          '1. Click en botón "Importar CSV"',
          '2. Descargar plantilla CSV de ejemplo',
          '3. Completar CSV con datos de usuarios',
          '4. Subir archivo CSV',
          '5. Revisar y confirmar importación'
        ],
        commonBreakpoints: [
          'Paso 4: Archivo no es CSV válido',
          'Paso 5: Errores de validación en datos'
        ]
      },
      {
        name: 'Ver estadísticas de usuario',
        steps: [
          '1. Buscar usuario en la tabla',
          '2. Click en icono de estadísticas o nombre del usuario',
          '3. Revisar métricas en el modal'
        ],
        commonBreakpoints: [
          'Paso 2: Modal no abre',
          'Paso 3: Datos no cargan'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Usuario no recibe email de invitación',
        possibleCauses: [
          'Email en carpeta de spam',
          'Error en servicio de emails',
          'Email incorrecto'
        ],
        solutions: [
          'Verificar carpeta de spam del usuario',
          'Reenviar invitación desde el panel',
          'Verificar que el email esté escrito correctamente'
        ]
      },
      {
        description: 'Importación CSV falla',
        possibleCauses: [
          'Formato de archivo incorrecto',
          'Columnas no coinciden con plantilla',
          'Emails duplicados en el archivo'
        ],
        solutions: [
          'Usar la plantilla CSV proporcionada',
          'Verificar que las columnas estén en orden correcto',
          'Eliminar duplicados del archivo'
        ]
      }
    ]
  },

  // ============================================================================
  // BUSINESS USER - DASHBOARD
  // ============================================================================
  '/[orgSlug]/business-user/dashboard': {
    route: '/[orgSlug]/business-user/dashboard',
    routePattern: '/{orgSlug}/business-user/dashboard',
    pageType: 'business_user_dashboard',
    components: [
      {
        name: 'BusinessUserDashboardPage',
        path: 'apps/web/src/app/[orgSlug]/business-user/dashboard/page.tsx',
        description: 'Dashboard principal para usuarios empresariales',
        props: [],
        commonErrors: [
          'Dashboard no carga: Error de autenticación',
          'Cursos no aparecen: Usuario sin cursos asignados'
        ]
      },
      {
        name: 'CourseCard',
        path: 'apps/web/src/features/courses/components/CourseCard.tsx',
        description: 'Tarjeta de curso con progreso',
        props: ['course', 'progress', 'deadline'],
        commonErrors: [
          'Progreso incorrecto: Datos no sincronizados',
          'Deadline no muestra: No hay fecha límite asignada'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/[orgSlug]/business-user/dashboard',
        method: 'GET',
        description: 'Obtiene datos del dashboard del usuario',
        commonErrors: [
          '401 Unauthorized: Usuario no autenticado',
          '403 Forbidden: Usuario no pertenece a esta organización'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Continuar un curso',
        steps: [
          '1. Identificar el curso en el dashboard',
          '2. Click en "Continuar" o en la tarjeta del curso',
          '3. Se abre el reproductor de lecciones',
          '4. Continuar desde donde se dejó'
        ],
        commonBreakpoints: [
          'Paso 2: Error al cargar el curso',
          'Paso 4: Lección no carga correctamente'
        ]
      },
      {
        name: 'Ver certificados obtenidos',
        steps: [
          '1. Navegar a la sección de certificados en el dashboard',
          '2. Click en un certificado para verlo',
          '3. Descargar o compartir certificado'
        ],
        commonBreakpoints: [
          'Paso 2: PDF no carga',
          'Paso 3: Error al descargar'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'No aparecen cursos en el dashboard',
        possibleCauses: [
          'Usuario no tiene cursos asignados',
          'Cursos están ocultos o inactivos',
          'Error en la carga de datos'
        ],
        solutions: [
          'Contactar al administrador para asignar cursos',
          'Verificar en Network tab si hay errores de API',
          'Refrescar la página'
        ]
      },
      {
        description: 'Progreso no se guarda',
        possibleCauses: [
          'Problemas de conexión a internet',
          'Error en API de progreso',
          'Sesión expirada'
        ],
        solutions: [
          'Verificar conexión a internet',
          'Cerrar sesión y volver a iniciar',
          'Esperar unos segundos y reintentar'
        ]
      }
    ]
  },

  // ============================================================================
  // COURSE LEARN PAGE
  // ============================================================================
  '/courses/[slug]/learn': {
    route: '/courses/[slug]/learn',
    routePattern: '/courses/{slug}/learn',
    pageType: 'course_learn',
    components: [
      {
        name: 'CourseLearnPage',
        path: 'apps/web/src/app/courses/[slug]/learn/page.tsx',
        description: 'Página principal del reproductor de lecciones',
        props: [],
        commonErrors: [
          'Página no carga: Curso no encontrado o sin acceso',
          'Video no reproduce: Error del provider de video'
        ]
      },
      {
        name: 'VideoPlayer',
        path: 'apps/web/src/features/courses/components/VideoPlayer.tsx',
        description: 'Reproductor de video de lecciones',
        props: ['videoUrl', 'onProgress', 'onComplete'],
        commonErrors: [
          'Video no carga: URL inválida o proveedor no disponible',
          'Progreso no se guarda: Error en callback onProgress'
        ]
      },
      {
        name: 'LessonNavigation',
        path: 'apps/web/src/features/courses/components/LessonNavigation.tsx',
        description: 'Panel lateral de navegación entre lecciones',
        props: ['lessons', 'currentLessonId', 'onSelect'],
        commonErrors: [
          'Lecciones no cargan: Error en estructura del curso',
          'Click no funciona: Handler no configurado'
        ]
      },
      {
        name: 'EmbeddedLiaPanel',
        path: 'apps/web/src/core/components/EmbeddedLiaPanel/EmbeddedLiaPanel.tsx',
        description: 'Panel de SofLIA integrado para ayuda contextual',
        props: ['lessonContext', 'transcript'],
        commonErrors: [
          'SofLIA no responde: Error en API de chat',
          'Contexto incorrecto: Transcripción no disponible'
        ]
      },
      {
        name: 'ActivityPanel',
        path: 'apps/web/src/features/courses/components/ActivityPanel.tsx',
        description: 'Panel de actividades interactivas',
        props: ['activity', 'onComplete'],
        commonErrors: [
          'Actividad no carga: Datos de actividad inválidos',
          'No se puede completar: Error al guardar respuesta'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/courses/[slug]/lessons/[lessonId]/progress',
        method: 'POST',
        description: 'Guarda progreso de la lección',
        commonErrors: [
          '401 Unauthorized: Sesión expirada',
          '404 Not Found: Lección no encontrada'
        ]
      },
      {
        endpoint: '/api/courses/[slug]/lessons/[lessonId]/activities',
        method: 'GET',
        description: 'Obtiene actividades de la lección',
        commonErrors: [
          '404 Not Found: Lección sin actividades'
        ]
      },
      {
        endpoint: '/api/lia/chat',
        method: 'POST',
        description: 'Chat con SofLIA en contexto de lección',
        commonErrors: [
          '500 Internal Error: Error en API de IA',
          '429 Too Many Requests: Límite de requests alcanzado'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Ver una lección completa',
        steps: [
          '1. Iniciar reproducción del video',
          '2. Ver el video hasta el final',
          '3. El progreso se guarda automáticamente',
          '4. Lección se marca como completada'
        ],
        commonBreakpoints: [
          'Paso 1: Video no inicia',
          'Paso 3: Progreso no se guarda',
          'Paso 4: Lección no se marca como completada'
        ]
      },
      {
        name: 'Completar actividad interactiva',
        steps: [
          '1. Llegar a la actividad en el panel derecho',
          '2. Leer instrucciones de la actividad',
          '3. Completar la actividad (quiz, reflexión, etc.)',
          '4. Enviar respuesta',
          '5. Ver feedback de SofLIA'
        ],
        commonBreakpoints: [
          'Paso 3: Campos no validan',
          'Paso 4: Error al enviar',
          'Paso 5: Feedback no aparece'
        ]
      },
      {
        name: 'Pedir ayuda a SofLIA sobre el contenido',
        steps: [
          '1. Abrir panel de SofLIA',
          '2. Escribir pregunta sobre el contenido',
          '3. SofLIA responde con contexto del video',
          '4. Continuar conversación si es necesario'
        ],
        commonBreakpoints: [
          'Paso 2: Input no funciona',
          'Paso 3: SofLIA no responde o da error'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Video no reproduce',
        possibleCauses: [
          'Conexión lenta o inestable',
          'Proveedor de video no disponible',
          'Navegador no compatible',
          'Extensiones bloqueando contenido'
        ],
        solutions: [
          'Verificar conexión a internet',
          'Probar en otro navegador',
          'Desactivar extensiones de adblock',
          'Refrescar la página'
        ]
      },
      {
        description: 'Progreso no se guarda',
        possibleCauses: [
          'Sesión expirada',
          'Error de red',
          'API de progreso fallando'
        ],
        solutions: [
          'Refrescar la página y volver a iniciar sesión',
          'Verificar conexión a internet',
          'Reportar el problema al soporte'
        ]
      },
      {
        description: 'SofLIA no responde en contexto de lección',
        possibleCauses: [
          'Transcripción del video no disponible',
          'Error en API de chat',
          'Límite de requests alcanzado'
        ],
        solutions: [
          'Esperar unos segundos y reintentar',
          'Verificar que la lección tenga transcripción',
          'Probar más tarde si hay límite de requests'
        ]
      }
    ]
  },

  // ============================================================================
  // STUDY PLANNER DASHBOARD
  // ============================================================================
  '/study-planner/dashboard': {
    route: '/study-planner/dashboard',
    routePattern: '/study-planner/dashboard',
    pageType: 'study_planner_dashboard',
    components: [
      {
        name: 'StudyPlannerDashboardPage',
        path: 'apps/web/src/app/study-planner/dashboard/page.tsx',
        description: 'Dashboard del planificador de estudio',
        props: [],
        commonErrors: [
          'Dashboard vacío: Usuario sin plan de estudio',
          'Calendario no carga: Error en integración de calendario'
        ]
      },
      {
        name: 'StudyPlannerLIA',
        path: 'apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx',
        description: 'Componente de SofLIA especializado para el planificador',
        props: ['userId', 'pendingLessons', 'connectedCalendar'],
        commonErrors: [
          'SofLIA no genera plan: Datos insuficientes',
          'Plan no se guarda: Error en API'
        ]
      },
      {
        name: 'CalendarIntegration',
        path: 'apps/web/src/features/study-planner/components/CalendarIntegration.tsx',
        description: 'Integración con calendarios externos',
        props: ['provider', 'onConnect', 'onDisconnect'],
        commonErrors: [
          'OAuth falla: Token expirado o inválido',
          'Eventos no sincronizan: Permisos insuficientes'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/study-planner/active-plan',
        method: 'GET',
        description: 'Obtiene el plan de estudio activo del usuario',
        commonErrors: [
          '404 Not Found: Usuario sin plan activo'
        ]
      },
      {
        endpoint: '/api/study-planner/generate-plan',
        method: 'POST',
        description: 'Genera un nuevo plan de estudio con IA',
        commonErrors: [
          '400 Bad Request: Parámetros inválidos',
          '500 Internal Error: Error en generación de plan'
        ]
      },
      {
        endpoint: '/api/study-planner/save-plan',
        method: 'POST',
        description: 'Guarda el plan de estudio generado',
        commonErrors: [
          '400 Bad Request: Plan inválido',
          '500 Internal Error: Error al guardar'
        ]
      },
      {
        endpoint: '/api/study-planner/calendar/events',
        method: 'GET',
        description: 'Obtiene eventos del calendario conectado',
        commonErrors: [
          '401 Unauthorized: Token de calendario expirado',
          '403 Forbidden: Permisos insuficientes'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Crear un plan de estudio nuevo',
        steps: [
          '1. Abrir el Study Planner',
          '2. Iniciar conversación con SofLIA',
          '3. Indicar preferencias de estudio (días, horarios)',
          '4. SofLIA genera un plan personalizado',
          '5. Revisar y ajustar el plan',
          '6. Confirmar y guardar el plan'
        ],
        commonBreakpoints: [
          'Paso 3: SofLIA no entiende preferencias',
          'Paso 4: Plan generado no es adecuado',
          'Paso 6: Error al guardar'
        ]
      },
      {
        name: 'Conectar calendario externo',
        steps: [
          '1. Click en "Conectar Calendario"',
          '2. Seleccionar proveedor (Google, Microsoft)',
          '3. Autorizar acceso en ventana de OAuth',
          '4. Calendario conectado y sincronizado'
        ],
        commonBreakpoints: [
          'Paso 3: OAuth falla o se cierra',
          'Paso 4: Eventos no aparecen'
        ]
      },
      {
        name: 'Modificar plan existente',
        steps: [
          '1. Abrir plan actual',
          '2. Hablar con SofLIA para ajustar',
          '3. Confirmar cambios',
          '4. Plan actualizado'
        ],
        commonBreakpoints: [
          'Paso 2: SofLIA no actualiza el plan',
          'Paso 3: Error al guardar cambios'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'SofLIA no genera un plan adecuado',
        possibleCauses: [
          'Preferencias no claras',
          'No hay suficientes lecciones pendientes',
          'Horarios muy restrictivos'
        ],
        solutions: [
          'Ser más específico con días y horarios disponibles',
          'Verificar que hay cursos asignados con lecciones pendientes',
          'Ampliar disponibilidad horaria'
        ]
      },
      {
        description: 'Calendario no sincroniza',
        possibleCauses: [
          'Token de OAuth expirado',
          'Permisos insuficientes',
          'Calendario bloqueado por políticas de empresa'
        ],
        solutions: [
          'Desconectar y volver a conectar el calendario',
          'Verificar que se otorgaron todos los permisos solicitados',
          'Contactar IT si hay restricciones empresariales'
        ]
      },
      {
        description: 'Plan no se guarda',
        possibleCauses: [
          'Error de conexión',
          'Plan tiene conflictos con calendario',
          'Sesión expirada'
        ],
        solutions: [
          'Verificar conexión a internet',
          'Revisar que no haya conflictos de horarios',
          'Refrescar página e intentar de nuevo'
        ]
      }
    ]
  },

  // ============================================================================
  // BUSINESS PANEL - DASHBOARD
  // ============================================================================
  '/[orgSlug]/business-panel/dashboard': {
    route: '/[orgSlug]/business-panel/dashboard',
    routePattern: '/{orgSlug}/business-panel/dashboard',
    pageType: 'business_panel_dashboard',
    components: [
      {
        name: 'BusinessDashboardPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/dashboard/page.tsx',
        description: 'Dashboard principal del panel empresarial',
        props: [],
        commonErrors: [
          'Estadísticas no cargan: Error en API de stats',
          'Widgets vacíos: No hay datos de la organización'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/[orgSlug]/business/dashboard',
        method: 'GET',
        description: 'Obtiene estadísticas del dashboard empresarial',
        commonErrors: [
          '403 Forbidden: Sin permisos de business-panel',
          '404 Not Found: Organización no existe'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Ver métricas de la organización',
        steps: [
          '1. Acceder al dashboard',
          '2. Ver widgets de progreso de usuarios',
          '3. Revisar cursos más populares',
          '4. Ver actividad reciente'
        ],
        commonBreakpoints: [
          'Paso 2: Datos no cargan',
          'Paso 3: Lista vacía'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Dashboard sin datos',
        possibleCauses: [
          'Organización nueva sin usuarios',
          'Usuarios sin cursos asignados',
          'Error en cálculo de stats'
        ],
        solutions: [
          'Verificar que hay usuarios en la organización',
          'Asignar cursos a usuarios',
          'Esperar sincronización de datos'
        ]
      }
    ]
  },

  // ============================================================================
  // BUSINESS PANEL - ANALYTICS
  // ============================================================================
  '/[orgSlug]/business-panel/analytics': {
    route: '/[orgSlug]/business-panel/analytics',
    routePattern: '/{orgSlug}/business-panel/analytics',
    pageType: 'business_panel_analytics',
    components: [
      {
        name: 'BusinessAnalyticsPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/analytics/page.tsx',
        description: 'Página de analytics con gráficos y métricas',
        props: [],
        commonErrors: [
          'Gráficos no renderizan: Error en datos',
          'Exportación falla: Error generando archivo'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/[orgSlug]/business/analytics',
        method: 'GET',
        description: 'Obtiene datos de analytics',
        commonErrors: [
          '403 Forbidden: Sin permisos',
          '500 Internal Error: Error calculando métricas'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Analizar progreso de usuarios',
        steps: [
          '1. Seleccionar rango de fechas',
          '2. Ver gráficos de progreso',
          '3. Filtrar por equipo o usuario',
          '4. Exportar reporte'
        ],
        commonBreakpoints: [
          'Paso 2: Gráficos vacíos',
          'Paso 4: Error exportando'
        ]
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // BUSINESS PANEL - PROGRESS
  // ============================================================================
  '/[orgSlug]/business-panel/progress': {
    route: '/[orgSlug]/business-panel/progress',
    routePattern: '/{orgSlug}/business-panel/progress',
    pageType: 'business_panel_progress',
    components: [
      {
        name: 'BusinessProgressPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/progress/page.tsx',
        description: 'Vista de progreso detallado de usuarios',
        props: [],
        commonErrors: [
          'Tabla no carga: Error en API de progreso',
          'Filtros no funcionan: Error en query'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/[orgSlug]/business/progress',
        method: 'GET',
        description: 'Obtiene progreso de todos los usuarios',
        commonErrors: [
          '403 Forbidden: Sin permisos'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Revisar progreso de equipo',
        steps: [
          '1. Seleccionar equipo o zona',
          '2. Ver tabla de progreso',
          '3. Ordenar por criterio',
          '4. Ver detalle de usuario individual'
        ],
        commonBreakpoints: [
          'Paso 2: Tabla vacía',
          'Paso 4: Modal no abre'
        ]
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // BUSINESS PANEL - REPORTS
  // ============================================================================
  '/[orgSlug]/business-panel/reports': {
    route: '/[orgSlug]/business-panel/reports',
    routePattern: '/{orgSlug}/business-panel/reports',
    pageType: 'business_panel_reports',
    components: [
      {
        name: 'BusinessReportsPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/reports/page.tsx',
        description: 'Generación y descarga de reportes',
        props: [],
        commonErrors: [
          'Reporte no genera: Error en generación',
          'Descarga falla: Error de archivo'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/[orgSlug]/business/reports',
        method: 'POST',
        description: 'Genera un reporte específico',
        commonErrors: [
          '403 Forbidden: Sin permisos',
          '500 Internal Error: Error generando reporte'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Generar reporte de progreso',
        steps: [
          '1. Seleccionar tipo de reporte',
          '2. Configurar filtros y fechas',
          '3. Generar reporte',
          '4. Descargar archivo'
        ],
        commonBreakpoints: [
          'Paso 3: Error generando',
          'Paso 4: Archivo no descarga'
        ]
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // BUSINESS PANEL - SETTINGS
  // ============================================================================
  '/[orgSlug]/business-panel/settings': {
    route: '/[orgSlug]/business-panel/settings',
    routePattern: '/{orgSlug}/business-panel/settings',
    pageType: 'business_panel_settings',
    components: [
      {
        name: 'BusinessSettingsPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/settings/page.tsx',
        description: 'Configuración de la organización',
        props: [],
        commonErrors: [
          'Configuración no carga: Error en API',
          'Logo no sube: Error de storage'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/[orgSlug]/business/settings',
        method: 'GET',
        description: 'Obtiene configuración de la organización',
        commonErrors: [
          '403 Forbidden: Sin permisos de admin'
        ]
      },
      {
        endpoint: '/api/[orgSlug]/business/settings',
        method: 'PUT',
        description: 'Actualiza configuración',
        commonErrors: [
          '400 Bad Request: Datos inválidos'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Actualizar configuración',
        steps: [
          '1. Modificar campos deseados',
          '2. Subir nuevo logo si es necesario',
          '3. Configurar colores de marca',
          '4. Guardar cambios'
        ],
        commonBreakpoints: [
          'Paso 2: Error subiendo imagen',
          'Paso 4: Error guardando'
        ]
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // BUSINESS PANEL - HIERARCHY (TEAMS/ZONES)
  // ============================================================================
  '/[orgSlug]/business-panel/hierarchy': {
    route: '/[orgSlug]/business-panel/hierarchy',
    routePattern: '/{orgSlug}/business-panel/hierarchy',
    pageType: 'business_panel_hierarchy',
    components: [
      {
        name: 'BusinessHierarchyPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/hierarchy/page.tsx',
        description: 'Gestión de estructura jerárquica (equipos, zonas, regiones)',
        props: [],
        commonErrors: [
          'Árbol no carga: Error en API de jerarquía',
          'Drag & drop no funciona: Error de JavaScript'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/[orgSlug]/business/hierarchy',
        method: 'GET',
        description: 'Obtiene estructura jerárquica',
        commonErrors: [
          '403 Forbidden: Sin permisos'
        ]
      },
      {
        endpoint: '/api/[orgSlug]/business/hierarchy/teams',
        method: 'POST',
        description: 'Crea un nuevo equipo',
        commonErrors: [
          '400 Bad Request: Nombre duplicado'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Crear nuevo equipo',
        steps: [
          '1. Click en "Nuevo Equipo"',
          '2. Ingresar nombre del equipo',
          '3. Asignar líder (opcional)',
          '4. Agregar miembros',
          '5. Guardar equipo'
        ],
        commonBreakpoints: [
          'Paso 2: Nombre ya existe',
          'Paso 4: Usuarios no cargan'
        ]
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // ADMIN PANEL - DASHBOARD
  // ============================================================================
  '/admin/dashboard': {
    route: '/admin/dashboard',
    routePattern: '/admin/dashboard',
    pageType: 'admin_dashboard',
    components: [
      {
        name: 'AdminDashboardPage',
        path: 'apps/web/src/app/admin/dashboard/page.tsx',
        description: 'Dashboard principal del panel de administración',
        props: [],
        commonErrors: [
          'Estadísticas no cargan: Error en API de stats',
          'Gráficos vacíos: No hay datos para el período seleccionado'
        ]
      },
      {
        name: 'AdminHeader',
        path: 'apps/web/src/features/admin/components/AdminHeader.tsx',
        description: 'Header del panel de administración con navegación',
        props: [],
        commonErrors: [
          'Navegación no responde: Verificar rutas de admin'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/dashboard/stats',
        method: 'GET',
        description: 'Obtiene estadísticas generales del dashboard',
        commonErrors: [
          '403 Forbidden: Usuario sin permisos de admin',
          '500 Internal Error: Error calculando estadísticas'
        ]
      },
      {
        endpoint: '/api/admin/activity/recent',
        method: 'GET',
        description: 'Obtiene actividad reciente de la plataforma',
        commonErrors: [
          '500 Internal Error: Error en query de actividad'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Revisar métricas del día',
        steps: [
          '1. Acceder al dashboard de admin',
          '2. Ver widgets de estadísticas',
          '3. Filtrar por rango de fechas si es necesario',
          '4. Exportar datos si se requiere'
        ],
        commonBreakpoints: [
          'Paso 2: Widgets no cargan datos',
          'Paso 4: Error al exportar'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Estadísticas no se actualizan',
        possibleCauses: [
          'Cache del navegador',
          'Error en cálculo de stats',
          'Datos no sincronizados'
        ],
        solutions: [
          'Refrescar la página',
          'Limpiar cache del navegador',
          'Verificar logs del servidor'
        ]
      }
    ]
  },

  // ============================================================================
  // ADMIN PANEL - USERS
  // ============================================================================
  '/admin/users': {
    route: '/admin/users',
    routePattern: '/admin/users',
    pageType: 'admin_users',
    components: [
      {
        name: 'AdminUsersPage',
        path: 'apps/web/src/app/admin/users/page.tsx',
        description: 'Gestión de usuarios de la plataforma',
        props: [],
        commonErrors: [
          'Lista de usuarios no carga: Error en API',
          'Búsqueda no funciona: Error en query de filtros'
        ]
      },
      {
        name: 'UsersTable',
        path: 'apps/web/src/features/admin/components/UsersTable.tsx',
        description: 'Tabla de usuarios con acciones',
        props: ['users', 'onEdit', 'onDelete', 'onViewStats'],
        commonErrors: [
          'Acciones no funcionan: Handler no configurado',
          'Paginación falla: Error en parámetros de página'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/users',
        method: 'GET',
        description: 'Obtiene lista paginada de usuarios',
        commonErrors: [
          '403 Forbidden: Sin permisos de admin',
          '500 Internal Error: Error en query de BD'
        ]
      },
      {
        endpoint: '/api/admin/users/[userId]',
        method: 'PUT',
        description: 'Actualiza datos de un usuario',
        commonErrors: [
          '404 Not Found: Usuario no existe',
          '400 Bad Request: Datos inválidos'
        ]
      },
      {
        endpoint: '/api/admin/users/[userId]',
        method: 'DELETE',
        description: 'Elimina un usuario y sus datos',
        commonErrors: [
          '403 Forbidden: No se puede eliminar este usuario',
          '500 Internal Error: Error eliminando datos relacionados'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Buscar y editar usuario',
        steps: [
          '1. Usar el buscador para encontrar el usuario',
          '2. Click en el usuario en la tabla',
          '3. Modificar campos en el modal de edición',
          '4. Guardar cambios'
        ],
        commonBreakpoints: [
          'Paso 2: Modal no abre',
          'Paso 4: Error al guardar'
        ]
      },
      {
        name: 'Eliminar usuario',
        steps: [
          '1. Buscar el usuario',
          '2. Click en botón de eliminar',
          '3. Confirmar en el diálogo',
          '4. Usuario eliminado'
        ],
        commonBreakpoints: [
          'Paso 3: Error de permisos',
          'Paso 4: Error eliminando datos relacionados'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'No se puede eliminar usuario',
        possibleCauses: [
          'Usuario tiene datos dependientes',
          'Usuario es admin protegido',
          'Error en cascade delete'
        ],
        solutions: [
          'Verificar que el usuario no sea admin principal',
          'Eliminar datos relacionados primero',
          'Verificar logs para errores específicos'
        ]
      }
    ]
  },

  // ============================================================================
  // ADMIN PANEL - COMPANIES
  // ============================================================================
  '/admin/companies': {
    route: '/admin/companies',
    routePattern: '/admin/companies',
    pageType: 'admin_companies',
    components: [
      {
        name: 'AdminCompaniesPage',
        path: 'apps/web/src/app/admin/companies/page.tsx',
        description: 'Gestión de empresas/organizaciones',
        props: [],
        commonErrors: [
          'Lista no carga: Error en API de empresas',
          'Filtros no funcionan: Error en query'
        ]
      },
      {
        name: 'CompanyCard',
        path: 'apps/web/src/features/admin/components/CompanyCard.tsx',
        description: 'Tarjeta de empresa con información resumida',
        props: ['company', 'onEdit', 'onViewUsers'],
        commonErrors: [
          'Imagen no carga: URL inválida',
          'Stats incorrectas: Datos no actualizados'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/companies',
        method: 'GET',
        description: 'Obtiene lista de empresas',
        commonErrors: [
          '403 Forbidden: Sin permisos',
          '500 Internal Error: Error en query'
        ]
      },
      {
        endpoint: '/api/admin/companies',
        method: 'POST',
        description: 'Crea una nueva empresa',
        commonErrors: [
          '400 Bad Request: Datos inválidos o slug duplicado',
          '500 Internal Error: Error creando empresa'
        ]
      },
      {
        endpoint: '/api/admin/companies/[id]',
        method: 'PUT',
        description: 'Actualiza datos de empresa',
        commonErrors: [
          '404 Not Found: Empresa no existe',
          '400 Bad Request: Slug ya en uso'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Crear nueva empresa',
        steps: [
          '1. Click en "Nueva Empresa"',
          '2. Completar formulario con datos',
          '3. Subir logo (opcional)',
          '4. Configurar permisos y cursos',
          '5. Guardar empresa'
        ],
        commonBreakpoints: [
          'Paso 2: Validación de slug falla',
          'Paso 3: Error subiendo imagen',
          'Paso 5: Error guardando'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Slug ya existe',
        possibleCauses: [
          'Otra empresa usa el mismo slug',
          'Empresa eliminada pero slug reservado'
        ],
        solutions: [
          'Elegir un slug diferente',
          'Verificar empresas eliminadas'
        ]
      }
    ]
  },

  // ============================================================================
  // ADMIN PANEL - REPORTES
  // ============================================================================
  '/admin/reportes': {
    route: '/admin/reportes',
    routePattern: '/admin/reportes',
    pageType: 'admin_reportes',
    components: [
      {
        name: 'AdminReportesPage',
        path: 'apps/web/src/app/admin/reportes/page.tsx',
        description: 'Gestión de reportes de problemas y bugs',
        props: [],
        commonErrors: [
          'Reportes no cargan: Error en API',
          'Filtros no funcionan: Query inválida'
        ]
      },
      {
        name: 'ReporteCard',
        path: 'apps/web/src/features/admin/components/ReporteCard.tsx',
        description: 'Tarjeta de reporte individual',
        props: ['reporte', 'onUpdate', 'onAssign'],
        commonErrors: [
          'Grabación no reproduce: Datos corruptos',
          'Screenshot no carga: URL expirada'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/reportes',
        method: 'GET',
        description: 'Obtiene lista de reportes de problemas',
        commonErrors: [
          '403 Forbidden: Sin permisos de admin'
        ]
      },
      {
        endpoint: '/api/admin/reportes/[id]',
        method: 'PUT',
        description: 'Actualiza estado/prioridad del reporte',
        commonErrors: [
          '404 Not Found: Reporte no existe',
          '400 Bad Request: Estado inválido'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Revisar y resolver reporte',
        steps: [
          '1. Filtrar reportes por estado "Pendiente"',
          '2. Abrir detalle del reporte',
          '3. Ver grabación de sesión si existe',
          '4. Asignar prioridad',
          '5. Agregar notas y marcar como resuelto'
        ],
        commonBreakpoints: [
          'Paso 3: Grabación no disponible',
          'Paso 5: Error guardando cambios'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Grabación de sesión no reproduce',
        possibleCauses: [
          'Datos de grabación corruptos',
          'Formato no compatible',
          'Grabación muy grande'
        ],
        solutions: [
          'Revisar metadata del reporte',
          'Verificar tamaño de grabación',
          'Usar información alternativa (screenshot, descripción)'
        ]
      }
    ]
  },

  // ============================================================================
  // ADMIN PANEL - LIA ANALYTICS
  // ============================================================================
  '/admin/lia-analytics': {
    route: '/admin/lia-analytics',
    routePattern: '/admin/lia-analytics',
    pageType: 'admin_lia_analytics',
    components: [
      {
        name: 'LiaAnalyticsPage',
        path: 'apps/web/src/app/admin/lia-analytics/page.tsx',
        description: 'Analytics y métricas de uso de LIA',
        props: [],
        commonErrors: [
          'Datos no cargan: Error en API de analytics',
          'Gráficos vacíos: No hay datos en el período'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/lia-analytics',
        method: 'GET',
        description: 'Obtiene métricas de uso de LIA',
        commonErrors: [
          '403 Forbidden: Sin permisos',
          '500 Internal Error: Error calculando métricas'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Analizar uso de LIA',
        steps: [
          '1. Seleccionar rango de fechas',
          '2. Ver métricas generales',
          '3. Revisar conversaciones populares',
          '4. Exportar datos si es necesario'
        ],
        commonBreakpoints: [
          'Paso 2: Métricas no cargan',
          'Paso 4: Error al exportar'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Métricas no actualizadas',
        possibleCauses: [
          'Proceso de agregación no ejecutado',
          'Datos pendientes de procesar'
        ],
        solutions: [
          'Esperar al siguiente ciclo de agregación',
          'Verificar jobs de procesamiento'
        ]
      }
    ]
  },

  // ============================================================================
  // ADMIN PANEL - NEWS
  // ============================================================================
  '/admin/news': {
    route: '/admin/news',
    routePattern: '/admin/news',
    pageType: 'admin_news',
    components: [
      {
        name: 'AdminNewsPage',
        path: 'apps/web/src/app/admin/news/page.tsx',
        description: 'Gestión de artículos de noticias',
        props: [],
        commonErrors: [
          'Artículos no cargan: Error en API',
          'Editor no funciona: Error de inicialización'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/news',
        method: 'GET',
        description: 'Obtiene lista de artículos',
        commonErrors: [
          '403 Forbidden: Sin permisos'
        ]
      },
      {
        endpoint: '/api/admin/news',
        method: 'POST',
        description: 'Crea un nuevo artículo',
        commonErrors: [
          '400 Bad Request: Datos inválidos',
          '500 Internal Error: Error guardando imagen'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Crear nuevo artículo',
        steps: [
          '1. Click en "Nuevo Artículo"',
          '2. Escribir título y contenido',
          '3. Subir imagen de portada',
          '4. Seleccionar categoría',
          '5. Publicar o guardar como borrador'
        ],
        commonBreakpoints: [
          'Paso 3: Error subiendo imagen',
          'Paso 5: Error guardando'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Imagen no sube',
        possibleCauses: [
          'Formato no soportado',
          'Archivo muy grande',
          'Error en storage'
        ],
        solutions: [
          'Usar formato JPG o PNG',
          'Reducir tamaño a menos de 5MB',
          'Verificar conexión a storage'
        ]
      }
    ]
  },

  // ============================================================================
  // ADMIN PANEL - COMMUNITIES
  // ============================================================================
  '/admin/communities': {
    route: '/admin/communities',
    routePattern: '/admin/communities',
    pageType: 'admin_communities',
    components: [
      {
        name: 'AdminCommunitiesPage',
        path: 'apps/web/src/app/admin/communities/page.tsx',
        description: 'Gestión de comunidades de la plataforma',
        props: [],
        commonErrors: [
          'Comunidades no cargan: Error en API',
          'Estadísticas incorrectas: Datos no sincronizados'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/communities',
        method: 'GET',
        description: 'Obtiene lista de comunidades',
        commonErrors: [
          '403 Forbidden: Sin permisos'
        ]
      },
      {
        endpoint: '/api/admin/communities/[slug]',
        method: 'PUT',
        description: 'Actualiza configuración de comunidad',
        commonErrors: [
          '404 Not Found: Comunidad no existe'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Moderar comunidad',
        steps: [
          '1. Seleccionar comunidad',
          '2. Revisar publicaciones pendientes',
          '3. Aprobar o rechazar contenido',
          '4. Gestionar miembros si es necesario'
        ],
        commonBreakpoints: [
          'Paso 2: Publicaciones no cargan',
          'Paso 3: Error al moderar'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Contenido no se modera',
        possibleCauses: [
          'Error en proceso de moderación',
          'Permisos insuficientes'
        ],
        solutions: [
          'Verificar permisos de admin',
          'Revisar logs de moderación'
        ]
      }
    ]
  },

  // ============================================================================
  // ADMIN PANEL - WORKSHOPS
  // ============================================================================
  '/admin/workshops': {
    route: '/admin/workshops',
    routePattern: '/admin/workshops',
    pageType: 'admin_workshops',
    components: [
      {
        name: 'AdminWorkshopsPage',
        path: 'apps/web/src/app/admin/workshops/page.tsx',
        description: 'Gestión de talleres y eventos en vivo',
        props: [],
        commonErrors: [
          'Talleres no cargan: Error en API',
          'Calendario no sincroniza: Error de integración'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/workshops',
        method: 'GET',
        description: 'Obtiene lista de talleres',
        commonErrors: ['403 Forbidden: Sin permisos']
      },
      {
        endpoint: '/api/admin/workshops',
        method: 'POST',
        description: 'Crea un nuevo taller',
        commonErrors: ['400 Bad Request: Datos inválidos', '500: Error creando evento']
      }
    ],
    userFlows: [
      {
        name: 'Crear taller',
        steps: [
          '1. Click en "Nuevo Taller"',
          '2. Completar información básica (título, descripción)',
          '3. Configurar fecha y hora',
          '4. Agregar instructor',
          '5. Publicar taller'
        ],
        commonBreakpoints: [
          'Paso 3: Zona horaria incorrecta',
          'Paso 4: Instructor no encontrado'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Zona horaria incorrecta en taller',
        possibleCauses: ['Navegador con timezone diferente', 'No se configuró timezone del taller'],
        solutions: ['Verificar timezone del navegador', 'Configurar timezone explícitamente']
      }
    ]
  },

  // ============================================================================
  // ADMIN PANEL - SKILLS
  // ============================================================================
  '/admin/skills': {
    route: '/admin/skills',
    routePattern: '/admin/skills',
    pageType: 'admin_skills',
    components: [
      {
        name: 'AdminSkillsPage',
        path: 'apps/web/src/app/admin/skills/page.tsx',
        description: 'Gestión del catálogo de habilidades',
        props: [],
        commonErrors: ['Habilidades no cargan: Error en API', 'Icono no sube: Error de storage']
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/skills',
        method: 'GET',
        description: 'Obtiene catálogo de habilidades',
        commonErrors: ['403 Forbidden: Sin permisos']
      },
      {
        endpoint: '/api/admin/skills',
        method: 'POST',
        description: 'Crea nueva habilidad',
        commonErrors: ['400 Bad Request: Nombre duplicado']
      }
    ],
    userFlows: [
      {
        name: 'Crear habilidad',
        steps: ['1. Click en "Nueva Habilidad"', '2. Ingresar nombre y descripción', '3. Seleccionar categoría', '4. Subir icono', '5. Guardar'],
        commonBreakpoints: ['Paso 4: Formato de icono no válido']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // ADMIN PANEL - APPS (AI Directory)
  // ============================================================================
  '/admin/apps': {
    route: '/admin/apps',
    routePattern: '/admin/apps',
    pageType: 'admin_apps',
    components: [
      {
        name: 'AdminAppsPage',
        path: 'apps/web/src/app/admin/apps/page.tsx',
        description: 'Gestión del directorio de aplicaciones de IA',
        props: [],
        commonErrors: ['Apps no cargan: Error en API', 'Imagen no sube: Error de storage']
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/apps',
        method: 'GET',
        description: 'Obtiene lista de aplicaciones de IA',
        commonErrors: ['403 Forbidden: Sin permisos']
      },
      {
        endpoint: '/api/admin/apps',
        method: 'POST',
        description: 'Agrega nueva aplicación al directorio',
        commonErrors: ['400 Bad Request: URL duplicada']
      }
    ],
    userFlows: [
      {
        name: 'Agregar app al directorio',
        steps: ['1. Click en "Nueva App"', '2. Ingresar nombre, descripción, URL', '3. Seleccionar categoría', '4. Subir logo', '5. Guardar'],
        commonBreakpoints: ['Paso 2: URL ya existe en el directorio']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // ADMIN PANEL - PROMPTS
  // ============================================================================
  '/admin/prompts': {
    route: '/admin/prompts',
    routePattern: '/admin/prompts',
    pageType: 'admin_prompts',
    components: [
      {
        name: 'AdminPromptsPage',
        path: 'apps/web/src/app/admin/prompts/page.tsx',
        description: 'Gestión del directorio de prompts',
        props: [],
        commonErrors: ['Prompts no cargan: Error en API', 'Filtros no funcionan']
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/prompts',
        method: 'GET',
        description: 'Obtiene lista de prompts',
        commonErrors: ['403 Forbidden: Sin permisos']
      }
    ],
    userFlows: [
      {
        name: 'Moderar prompt',
        steps: ['1. Filtrar por estado "Pendiente"', '2. Revisar contenido del prompt', '3. Aprobar o rechazar', '4. Agregar notas si es necesario'],
        commonBreakpoints: ['Paso 3: Error al cambiar estado']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // ADMIN PANEL - STATISTICS
  // ============================================================================
  '/admin/statistics': {
    route: '/admin/statistics',
    routePattern: '/admin/statistics',
    pageType: 'admin_statistics',
    components: [
      {
        name: 'AdminStatisticsPage',
        path: 'apps/web/src/app/admin/statistics/page.tsx',
        description: 'Estadísticas generales de la plataforma',
        props: [],
        commonErrors: ['Gráficos no cargan: Error de datos', 'Exportación falla']
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/statistics',
        method: 'GET',
        description: 'Obtiene estadísticas de la plataforma',
        commonErrors: ['500 Internal Error: Error calculando stats']
      }
    ],
    userFlows: [
      {
        name: 'Exportar reporte de estadísticas',
        steps: ['1. Seleccionar rango de fechas', '2. Elegir métricas a incluir', '3. Click en "Exportar"', '4. Descargar archivo'],
        commonBreakpoints: ['Paso 3: Error generando archivo']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // ADMIN PANEL - USER STATS
  // ============================================================================
  '/admin/user-stats': {
    route: '/admin/user-stats',
    routePattern: '/admin/user-stats',
    pageType: 'admin_user_stats',
    components: [
      {
        name: 'AdminUserStatsPage',
        path: 'apps/web/src/app/admin/user-stats/page.tsx',
        description: 'Estadísticas detalladas de usuarios',
        props: [],
        commonErrors: ['Datos no cargan: Error en API', 'Búsqueda no funciona']
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/user-stats',
        method: 'GET',
        description: 'Obtiene estadísticas de usuarios',
        commonErrors: ['403 Forbidden: Sin permisos']
      }
    ],
    userFlows: [
      {
        name: 'Analizar usuario específico',
        steps: ['1. Buscar usuario', '2. Ver métricas de actividad', '3. Ver progreso en cursos', '4. Exportar datos si es necesario'],
        commonBreakpoints: ['Paso 2: Datos no disponibles']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // ADMIN PANEL - REELS
  // ============================================================================
  '/admin/reels': {
    route: '/admin/reels',
    routePattern: '/admin/reels',
    pageType: 'admin_reels',
    components: [
      {
        name: 'AdminReelsPage',
        path: 'apps/web/src/app/admin/reels/page.tsx',
        description: 'Gestión de reels y videos cortos',
        props: [],
        commonErrors: ['Reels no cargan: Error en API', 'Video no reproduce: Formato no soportado']
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/reels',
        method: 'GET',
        description: 'Obtiene lista de reels',
        commonErrors: ['403 Forbidden: Sin permisos']
      }
    ],
    userFlows: [
      {
        name: 'Moderar reel',
        steps: ['1. Filtrar por estado', '2. Ver preview del video', '3. Aprobar o rechazar', '4. Agregar razón si se rechaza'],
        commonBreakpoints: ['Paso 2: Video no carga']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // ADMIN PANEL - ACCESS REQUESTS
  // ============================================================================
  '/admin/access-requests': {
    route: '/admin/access-requests',
    routePattern: '/admin/access-requests',
    pageType: 'admin_access_requests',
    components: [
      {
        name: 'AdminAccessRequestsPage',
        path: 'apps/web/src/app/admin/access-requests/page.tsx',
        description: 'Gestión de solicitudes de acceso a comunidades',
        props: [],
        commonErrors: ['Solicitudes no cargan: Error en API']
      }
    ],
    apis: [
      {
        endpoint: '/api/admin/community-requests',
        method: 'GET',
        description: 'Obtiene solicitudes de acceso pendientes',
        commonErrors: ['403 Forbidden: Sin permisos']
      }
    ],
    userFlows: [
      {
        name: 'Procesar solicitud',
        steps: ['1. Ver lista de solicitudes', '2. Revisar perfil del solicitante', '3. Aprobar o rechazar', '4. Enviar notificación'],
        commonBreakpoints: ['Paso 3: Error al actualizar']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // AUTH - LOGIN
  // ============================================================================
  '/auth': {
    route: '/auth',
    routePattern: '/auth',
    pageType: 'auth_login',
    components: [
      {
        name: 'AuthPage',
        path: 'apps/web/src/app/auth/page.tsx',
        description: 'Página de inicio de sesión',
        props: [],
        commonErrors: [
          'Login falla: Credenciales incorrectas',
          'OAuth no funciona: Error de configuración',
          'Página no carga: Error de servidor'
        ]
      },
      {
        name: 'LoginForm',
        path: 'apps/web/src/features/auth/components/LoginForm.tsx',
        description: 'Formulario de login con email/password',
        props: ['onSuccess', 'redirectTo'],
        commonErrors: ['Validación falla', 'Error de red al enviar']
      }
    ],
    apis: [
      {
        endpoint: '/api/auth/callback',
        method: 'POST',
        description: 'Procesa login con Supabase Auth',
        commonErrors: [
          '401 Unauthorized: Credenciales inválidas',
          '429 Too Many Requests: Muchos intentos'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Iniciar sesión con email',
        steps: [
          '1. Ingresar email',
          '2. Ingresar contraseña',
          '3. Click en "Iniciar Sesión"',
          '4. Redirigir a dashboard'
        ],
        commonBreakpoints: [
          'Paso 3: Credenciales incorrectas',
          'Paso 4: Redireccion falla'
        ]
      },
      {
        name: 'Iniciar sesión con OAuth',
        steps: [
          '1. Click en botón de proveedor (Google/Microsoft)',
          '2. Autorizar en ventana de OAuth',
          '3. Redirigir de vuelta a la plataforma',
          '4. Sesión iniciada'
        ],
        commonBreakpoints: [
          'Paso 2: Ventana se cierra inesperadamente',
          'Paso 3: Error de callback'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'No puedo iniciar sesión',
        possibleCauses: [
          'Contraseña incorrecta',
          'Usuario no existe',
          'Cuenta bloqueada por muchos intentos'
        ],
        solutions: [
          'Usar "Olvidé mi contraseña"',
          'Verificar que la cuenta existe',
          'Esperar unos minutos e intentar de nuevo'
        ]
      },
      {
        description: 'OAuth no funciona',
        possibleCauses: [
          'Popup bloqueado por navegador',
          'Error de configuración OAuth',
          'Cookies de terceros bloqueadas'
        ],
        solutions: [
          'Permitir popups para este sitio',
          'Desactivar bloqueador de cookies de terceros',
          'Intentar con otro navegador'
        ]
      }
    ]
  },

  // ============================================================================
  // AUTH - REGISTER
  // ============================================================================
  '/auth/[slug]/register': {
    route: '/auth/[slug]/register',
    routePattern: '/auth/{slug}/register',
    pageType: 'auth_register',
    components: [
      {
        name: 'RegisterPage',
        path: 'apps/web/src/app/auth/[slug]/register/page.tsx',
        description: 'Página de registro de nuevos usuarios',
        props: [],
        commonErrors: ['Registro falla: Email ya existe', 'Validación de contraseña falla']
      },
      {
        name: 'RegisterForm',
        path: 'apps/web/src/features/auth/components/RegisterForm.tsx',
        description: 'Formulario de registro',
        props: ['organizationSlug', 'onSuccess'],
        commonErrors: ['Campos requeridos vacíos', 'Contraseña no cumple requisitos']
      }
    ],
    apis: [
      {
        endpoint: '/api/auth/callback',
        method: 'POST',
        description: 'Crea cuenta nueva en Supabase Auth',
        commonErrors: [
          '400 Bad Request: Email inválido',
          '409 Conflict: Email ya registrado'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Registrarse como nuevo usuario',
        steps: [
          '1. Ingresar email',
          '2. Crear contraseña segura',
          '3. Completar datos personales',
          '4. Aceptar términos y condiciones',
          '5. Click en "Crear Cuenta"',
          '6. Verificar email si es requerido'
        ],
        commonBreakpoints: [
          'Paso 2: Contraseña no cumple requisitos',
          'Paso 5: Email ya existe',
          'Paso 6: Email no llega'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Email de verificación no llega',
        possibleCauses: ['Email en spam', 'Email incorrecto', 'Delay en envío'],
        solutions: ['Revisar carpeta de spam', 'Verificar email ingresado', 'Reenviar email de verificación']
      }
    ]
  },

  // ============================================================================
  // AUTH - FORGOT PASSWORD
  // ============================================================================
  '/auth/forgot-password': {
    route: '/auth/forgot-password',
    routePattern: '/auth/forgot-password',
    pageType: 'auth_forgot_password',
    components: [
      {
        name: 'ForgotPasswordPage',
        path: 'apps/web/src/app/auth/forgot-password/page.tsx',
        description: 'Página de recuperación de contraseña',
        props: [],
        commonErrors: ['Email no encontrado', 'Error enviando email']
      }
    ],
    apis: [
      {
        endpoint: '/api/auth/reset-password',
        method: 'POST',
        description: 'Envía email de recuperación',
        commonErrors: ['404: Email no registrado']
      }
    ],
    userFlows: [
      {
        name: 'Recuperar contraseña',
        steps: ['1. Ingresar email registrado', '2. Click en "Enviar"', '3. Revisar email', '4. Seguir link de recuperación'],
        commonBreakpoints: ['Paso 3: Email no llega']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // AUTH - RESET PASSWORD
  // ============================================================================
  '/auth/reset-password': {
    route: '/auth/reset-password',
    routePattern: '/auth/reset-password',
    pageType: 'auth_reset_password',
    components: [
      {
        name: 'ResetPasswordPage',
        path: 'apps/web/src/app/auth/reset-password/page.tsx',
        description: 'Página para establecer nueva contraseña',
        props: [],
        commonErrors: ['Token inválido o expirado', 'Contraseña no cumple requisitos']
      }
    ],
    apis: [
      {
        endpoint: '/api/auth/reset-password',
        method: 'PUT',
        description: 'Actualiza contraseña con token',
        commonErrors: ['400: Token expirado', '400: Contraseña inválida']
      }
    ],
    userFlows: [
      {
        name: 'Establecer nueva contraseña',
        steps: ['1. Ingresar nueva contraseña', '2. Confirmar contraseña', '3. Click en "Guardar"', '4. Redirigir a login'],
        commonBreakpoints: ['Paso 1: Requisitos no cumplidos']
      }
    ],
    commonIssues: [
      {
        description: 'Link de recuperación no funciona',
        possibleCauses: ['Token expirado (válido por 1 hora)', 'Link ya usado'],
        solutions: ['Solicitar nuevo link de recuperación']
      }
    ]
  },

  // ============================================================================
  // AUTH - SELECT ORGANIZATION
  // ============================================================================
  '/auth/select-organization': {
    route: '/auth/select-organization',
    routePattern: '/auth/select-organization',
    pageType: 'auth_select_org',
    components: [
      {
        name: 'SelectOrganizationPage',
        path: 'apps/web/src/app/auth/select-organization/page.tsx',
        description: 'Selección de organización para usuarios con múltiples',
        props: [],
        commonErrors: ['Organizaciones no cargan', 'Selección no funciona']
      }
    ],
    apis: [
      {
        endpoint: '/api/organizations',
        method: 'GET',
        description: 'Obtiene organizaciones del usuario',
        commonErrors: ['500: Error de BD']
      }
    ],
    userFlows: [
      {
        name: 'Seleccionar organización',
        steps: ['1. Ver lista de organizaciones', '2. Click en la organización deseada', '3. Redirigir al dashboard de la org'],
        commonBreakpoints: ['Paso 2: Error de redirección']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // PROFILE
  // ============================================================================
  '/profile': {
    route: '/profile',
    routePattern: '/profile',
    pageType: 'user_profile',
    components: [
      {
        name: 'ProfilePage',
        path: 'apps/web/src/app/profile/page.tsx',
        description: 'Página de perfil del usuario',
        props: [],
        commonErrors: [
          'Perfil no carga: Error de autenticación',
          'Foto no sube: Error de storage',
          'Cambios no guardan: Error de API'
        ]
      },
      {
        name: 'ProfileForm',
        path: 'apps/web/src/features/profile/components/ProfileForm.tsx',
        description: 'Formulario de edición de perfil',
        props: ['user', 'onSave'],
        commonErrors: ['Validación falla', 'Error guardando cambios']
      }
    ],
    apis: [
      {
        endpoint: '/api/profile',
        method: 'GET',
        description: 'Obtiene datos del perfil',
        commonErrors: ['401 Unauthorized: No autenticado']
      },
      {
        endpoint: '/api/profile',
        method: 'PUT',
        description: 'Actualiza datos del perfil',
        commonErrors: ['400 Bad Request: Datos inválidos']
      },
      {
        endpoint: '/api/profile/avatar',
        method: 'POST',
        description: 'Sube foto de perfil',
        commonErrors: ['413: Archivo muy grande', '415: Formato no soportado']
      }
    ],
    userFlows: [
      {
        name: 'Actualizar perfil',
        steps: ['1. Modificar campos deseados', '2. Cambiar foto de perfil (opcional)', '3. Click en "Guardar"', '4. Ver confirmación'],
        commonBreakpoints: ['Paso 2: Imagen no sube', 'Paso 3: Error guardando']
      }
    ],
    commonIssues: [
      {
        description: 'Foto de perfil no se actualiza',
        possibleCauses: ['Cache del navegador', 'Imagen muy grande', 'Formato no soportado'],
        solutions: ['Limpiar cache', 'Usar imagen menor a 5MB', 'Usar formato JPG o PNG']
      }
    ]
  },

  // ============================================================================
  // ACCOUNT SETTINGS
  // ============================================================================
  '/account-settings': {
    route: '/account-settings',
    routePattern: '/account-settings',
    pageType: 'account_settings',
    components: [
      {
        name: 'AccountSettingsPage',
        path: 'apps/web/src/app/account-settings/page.tsx',
        description: 'Configuración de cuenta del usuario',
        props: [],
        commonErrors: ['Settings no cargan', 'Error guardando preferencias']
      }
    ],
    apis: [
      {
        endpoint: '/api/account-settings',
        method: 'GET',
        description: 'Obtiene configuración de cuenta',
        commonErrors: ['401: No autenticado']
      },
      {
        endpoint: '/api/account-settings',
        method: 'PUT',
        description: 'Actualiza configuración',
        commonErrors: ['400: Datos inválidos']
      }
    ],
    userFlows: [
      {
        name: 'Cambiar configuración',
        steps: ['1. Navegar a la sección deseada', '2. Modificar preferencias', '3. Guardar cambios'],
        commonBreakpoints: ['Paso 3: Error de API']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // CERTIFICATES
  // ============================================================================
  '/certificates': {
    route: '/certificates',
    routePattern: '/certificates',
    pageType: 'certificates_list',
    components: [
      {
        name: 'CertificatesPage',
        path: 'apps/web/src/app/certificates/page.tsx',
        description: 'Lista de certificados obtenidos',
        props: [],
        commonErrors: ['Certificados no cargan', 'PDF no genera']
      },
      {
        name: 'CertificateCard',
        path: 'apps/web/src/features/certificates/components/CertificateCard.tsx',
        description: 'Tarjeta de certificado individual',
        props: ['certificate', 'onDownload', 'onShare'],
        commonErrors: ['Imagen no carga', 'Descarga falla']
      }
    ],
    apis: [
      {
        endpoint: '/api/certificates',
        method: 'GET',
        description: 'Obtiene certificados del usuario',
        commonErrors: ['401: No autenticado']
      },
      {
        endpoint: '/api/certificates/[id]',
        method: 'GET',
        description: 'Obtiene certificado específico',
        commonErrors: ['404: Certificado no encontrado']
      }
    ],
    userFlows: [
      {
        name: 'Descargar certificado',
        steps: ['1. Encontrar certificado en la lista', '2. Click en "Descargar"', '3. PDF se descarga'],
        commonBreakpoints: ['Paso 3: PDF no genera']
      },
      {
        name: 'Compartir certificado',
        steps: ['1. Click en "Compartir"', '2. Copiar link o compartir en red social'],
        commonBreakpoints: ['Paso 2: Link no funciona']
      }
    ],
    commonIssues: [
      {
        description: 'Certificado no aparece',
        possibleCauses: ['Curso no completado al 100%', 'Certificado no habilitado para el curso'],
        solutions: ['Verificar progreso del curso', 'Contactar soporte']
      }
    ]
  },

  // ============================================================================
  // CERTIFICATE VERIFICATION
  // ============================================================================
  '/certificates/verify': {
    route: '/certificates/verify',
    routePattern: '/certificates/verify',
    pageType: 'certificate_verify',
    components: [
      {
        name: 'VerifyCertificatePage',
        path: 'apps/web/src/app/certificates/verify/page.tsx',
        description: 'Verificación pública de certificados',
        props: [],
        commonErrors: ['Certificado no encontrado', 'Código inválido']
      }
    ],
    apis: [
      {
        endpoint: '/api/certificates/verify',
        method: 'POST',
        description: 'Verifica autenticidad de certificado',
        commonErrors: ['404: Código no encontrado']
      }
    ],
    userFlows: [
      {
        name: 'Verificar certificado',
        steps: ['1. Ingresar código del certificado', '2. Click en "Verificar"', '3. Ver resultado'],
        commonBreakpoints: ['Paso 2: Código inválido']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // COMMUNITIES - HOME
  // ============================================================================
  '/communities/[slug]': {
    route: '/communities/[slug]',
    routePattern: '/communities/{slug}',
    pageType: 'community_home',
    components: [
      {
        name: 'CommunityPage',
        path: 'apps/web/src/app/communities/[slug]/page.tsx',
        description: 'Página principal de una comunidad',
        props: [],
        commonErrors: [
          'Comunidad no carga: Slug inválido',
          'Posts no aparecen: Error de API',
          'No tienes acceso: Comunidad privada'
        ]
      },
      {
        name: 'PostsList',
        path: 'apps/web/src/features/communities/components/PostsList.tsx',
        description: 'Lista de publicaciones de la comunidad',
        props: ['communitySlug', 'onLoadMore'],
        commonErrors: ['Posts no cargan', 'Infinite scroll falla']
      },
      {
        name: 'CreatePostForm',
        path: 'apps/web/src/features/communities/components/CreatePostForm.tsx',
        description: 'Formulario para crear publicaciones',
        props: ['communitySlug', 'onSuccess'],
        commonErrors: ['Imagen no sube', 'Post no se crea']
      }
    ],
    apis: [
      {
        endpoint: '/api/communities/[slug]',
        method: 'GET',
        description: 'Obtiene información de la comunidad',
        commonErrors: ['404: Comunidad no existe', '403: Sin acceso']
      },
      {
        endpoint: '/api/communities/[slug]/posts',
        method: 'GET',
        description: 'Obtiene posts de la comunidad',
        commonErrors: ['403: Sin acceso']
      },
      {
        endpoint: '/api/communities/[slug]/posts',
        method: 'POST',
        description: 'Crea nuevo post',
        commonErrors: ['400: Contenido inválido', '403: Sin permisos para postear']
      }
    ],
    userFlows: [
      {
        name: 'Crear publicación',
        steps: ['1. Click en área de nuevo post', '2. Escribir contenido', '3. Agregar imagen (opcional)', '4. Publicar'],
        commonBreakpoints: ['Paso 3: Imagen muy grande', 'Paso 4: Error de permisos']
      },
      {
        name: 'Solicitar acceso a comunidad privada',
        steps: ['1. Ver información de comunidad privada', '2. Click en "Solicitar Acceso"', '3. Esperar aprobación'],
        commonBreakpoints: ['Paso 3: Solicitud rechazada']
      }
    ],
    commonIssues: [
      {
        description: 'No puedo acceder a la comunidad',
        possibleCauses: ['Comunidad privada', 'Solicitud pendiente', 'Solicitud rechazada'],
        solutions: ['Solicitar acceso', 'Esperar aprobación', 'Contactar administrador']
      }
    ]
  },

  // ============================================================================
  // NEWS - ARTICLE
  // ============================================================================
  '/news/[slug]': {
    route: '/news/[slug]',
    routePattern: '/news/{slug}',
    pageType: 'news_article',
    components: [
      {
        name: 'NewsArticlePage',
        path: 'apps/web/src/app/news/[slug]/page.tsx',
        description: 'Página de artículo de noticias',
        props: [],
        commonErrors: ['Artículo no encontrado', 'Imágenes no cargan']
      }
    ],
    apis: [
      {
        endpoint: '/api/news/[slug]',
        method: 'GET',
        description: 'Obtiene artículo por slug',
        commonErrors: ['404: Artículo no encontrado']
      }
    ],
    userFlows: [
      {
        name: 'Leer artículo',
        steps: ['1. Abrir artículo', '2. Leer contenido', '3. Interactuar (like, compartir)'],
        commonBreakpoints: []
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // DASHBOARD (MAIN)
  // ============================================================================
  '/dashboard': {
    route: '/dashboard',
    routePattern: '/dashboard',
    pageType: 'main_dashboard',
    components: [
      {
        name: 'DashboardPage',
        path: 'apps/web/src/app/dashboard/page.tsx',
        description: 'Dashboard principal del usuario',
        props: [],
        commonErrors: ['Dashboard no carga', 'Widgets vacíos', 'Cursos no aparecen']
      },
      {
        name: 'CourseProgress',
        path: 'apps/web/src/features/dashboard/components/CourseProgress.tsx',
        description: 'Widget de progreso de cursos',
        props: ['courses'],
        commonErrors: ['Progreso incorrecto', 'No muestra cursos']
      },
      {
        name: 'RecentActivity',
        path: 'apps/web/src/features/dashboard/components/RecentActivity.tsx',
        description: 'Widget de actividad reciente',
        props: ['activities'],
        commonErrors: ['Actividad no carga']
      }
    ],
    apis: [
      {
        endpoint: '/api/my-courses',
        method: 'GET',
        description: 'Obtiene cursos del usuario',
        commonErrors: ['401: No autenticado']
      }
    ],
    userFlows: [
      {
        name: 'Continuar aprendiendo',
        steps: ['1. Ver dashboard', '2. Identificar curso en progreso', '3. Click en "Continuar"', '4. Ir a lección actual'],
        commonBreakpoints: ['Paso 3: Error de redirección']
      }
    ],
    commonIssues: [
      {
        description: 'No veo mis cursos',
        possibleCauses: ['No hay cursos adquiridos', 'Error de carga', 'Filtros aplicados'],
        solutions: ['Adquirir un curso', 'Refrescar página', 'Limpiar filtros']
      }
    ]
  },

  // ============================================================================
  // COURSES - DETAIL
  // ============================================================================
  '/courses/[slug]': {
    route: '/courses/[slug]',
    routePattern: '/courses/{slug}',
    pageType: 'course_detail',
    components: [
      {
        name: 'CourseDetailPage',
        path: 'apps/web/src/app/courses/[slug]/page.tsx',
        description: 'Página de detalle de un curso',
        props: [],
        commonErrors: ['Curso no encontrado', 'Precio no muestra', 'Botón de compra no funciona']
      },
      {
        name: 'CourseHeader',
        path: 'apps/web/src/features/courses/components/CourseHeader.tsx',
        description: 'Header con información del curso',
        props: ['course'],
        commonErrors: ['Imagen no carga', 'Rating incorrecto']
      },
      {
        name: 'CourseCurriculum',
        path: 'apps/web/src/features/courses/components/CourseCurriculum.tsx',
        description: 'Temario del curso',
        props: ['modules', 'lessons'],
        commonErrors: ['Módulos no cargan']
      }
    ],
    apis: [
      {
        endpoint: '/api/courses/[slug]',
        method: 'GET',
        description: 'Obtiene detalle del curso',
        commonErrors: ['404: Curso no encontrado']
      }
    ],
    userFlows: [
      {
        name: 'Ver curso y comprar',
        steps: ['1. Ver información del curso', '2. Revisar temario', '3. Click en "Comprar"', '4. Ir al checkout'],
        commonBreakpoints: ['Paso 3: Error de precio', 'Paso 4: Error de carrito']
      },
      {
        name: 'Empezar curso gratuito',
        steps: ['1. Ver información', '2. Click en "Empezar Gratis"', '3. Ir a primera lección'],
        commonBreakpoints: ['Paso 2: Error de inscripción']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // INSTRUCTOR - DASHBOARD
  // ============================================================================
  '/instructor/dashboard': {
    route: '/instructor/dashboard',
    routePattern: '/instructor/dashboard',
    pageType: 'instructor_dashboard',
    components: [
      {
        name: 'InstructorDashboardPage',
        path: 'apps/web/src/app/instructor/dashboard/page.tsx',
        description: 'Dashboard del panel de instructor',
        props: [],
        commonErrors: ['Estadísticas no cargan', 'Cursos no aparecen']
      }
    ],
    apis: [
      {
        endpoint: '/api/instructor/dashboard',
        method: 'GET',
        description: 'Obtiene stats del instructor',
        commonErrors: ['403: No es instructor']
      }
    ],
    userFlows: [
      {
        name: 'Ver rendimiento de cursos',
        steps: ['1. Ver dashboard', '2. Seleccionar período', '3. Analizar métricas'],
        commonBreakpoints: ['Paso 2: Datos no disponibles']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // INSTRUCTOR - COURSES
  // ============================================================================
  '/instructor/courses': {
    route: '/instructor/courses',
    routePattern: '/instructor/courses',
    pageType: 'instructor_courses',
    components: [
      {
        name: 'InstructorCoursesPage',
        path: 'apps/web/src/app/instructor/courses/page.tsx',
        description: 'Lista de cursos del instructor',
        props: [],
        commonErrors: ['Cursos no cargan', 'Acciones no funcionan']
      }
    ],
    apis: [
      {
        endpoint: '/api/instructor/courses',
        method: 'GET',
        description: 'Obtiene cursos del instructor',
        commonErrors: ['403: No es instructor']
      }
    ],
    userFlows: [
      {
        name: 'Crear nuevo curso',
        steps: ['1. Click en "Nuevo Curso"', '2. Ir a wizard de creación'],
        commonBreakpoints: []
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // INSTRUCTOR - NEW COURSE
  // ============================================================================
  '/instructor/courses/new': {
    route: '/instructor/courses/new',
    routePattern: '/instructor/courses/new',
    pageType: 'instructor_new_course',
    components: [
      {
        name: 'NewCoursePage',
        path: 'apps/web/src/app/instructor/courses/new/page.tsx',
        description: 'Wizard de creación de curso',
        props: [],
        commonErrors: ['Datos no guardan', 'Video no sube', 'Paso no avanza']
      },
      {
        name: 'CourseWizard',
        path: 'apps/web/src/features/instructor/components/CourseWizard.tsx',
        description: 'Componente wizard multi-paso',
        props: ['onComplete'],
        commonErrors: ['Validación falla', 'Navegación entre pasos falla']
      }
    ],
    apis: [
      {
        endpoint: '/api/instructor/courses',
        method: 'POST',
        description: 'Crea nuevo curso',
        commonErrors: ['400: Datos inválidos', '403: No es instructor']
      }
    ],
    userFlows: [
      {
        name: 'Crear curso completo',
        steps: [
          '1. Información básica (título, descripción)',
          '2. Configurar precio y categoría',
          '3. Agregar módulos',
          '4. Agregar lecciones con videos',
          '5. Revisar y publicar'
        ],
        commonBreakpoints: [
          'Paso 4: Video no sube',
          'Paso 5: Error al publicar'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Video no sube',
        possibleCauses: ['Archivo muy grande', 'Formato no soportado', 'Conexión lenta'],
        solutions: ['Comprimir video', 'Usar MP4', 'Intentar con mejor conexión']
      }
    ]
  },

  // ============================================================================
  // APPS DIRECTORY
  // ============================================================================
  '/apps-directory': {
    route: '/apps-directory',
    routePattern: '/apps-directory',
    pageType: 'apps_directory',
    components: [
      {
        name: 'AppsDirectoryPage',
        path: 'apps/web/src/app/apps-directory/page.tsx',
        description: 'Directorio de aplicaciones de IA',
        props: [],
        commonErrors: ['Apps no cargan', 'Filtros no funcionan', 'Búsqueda no encuentra']
      }
    ],
    apis: [
      {
        endpoint: '/api/ai-directory/apps',
        method: 'GET',
        description: 'Obtiene lista de apps de IA',
        commonErrors: ['500: Error de BD']
      }
    ],
    userFlows: [
      {
        name: 'Buscar aplicación de IA',
        steps: ['1. Usar buscador o filtros', '2. Ver resultados', '3. Click en app para ver detalle'],
        commonBreakpoints: ['Paso 2: Sin resultados']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // PROMPT DIRECTORY
  // ============================================================================
  '/prompt-directory': {
    route: '/prompt-directory',
    routePattern: '/prompt-directory',
    pageType: 'prompt_directory',
    components: [
      {
        name: 'PromptDirectoryPage',
        path: 'apps/web/src/app/prompt-directory/page.tsx',
        description: 'Directorio de prompts',
        props: [],
        commonErrors: ['Prompts no cargan', 'Filtros no funcionan']
      }
    ],
    apis: [
      {
        endpoint: '/api/ai-directory/prompts',
        method: 'GET',
        description: 'Obtiene lista de prompts',
        commonErrors: ['500: Error de BD']
      }
    ],
    userFlows: [
      {
        name: 'Buscar y usar prompt',
        steps: ['1. Buscar por categoría o texto', '2. Ver prompt', '3. Copiar o guardar en favoritos'],
        commonBreakpoints: []
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // STUDY PLANNER - CREATE
  // ============================================================================
  '/study-planner/create': {
    route: '/study-planner/create',
    routePattern: '/study-planner/create',
    pageType: 'study_planner_create',
    components: [
      {
        name: 'CreatePlanPage',
        path: 'apps/web/src/app/study-planner/create/page.tsx',
        description: 'Creación de plan de estudio con LIA',
        props: [],
        commonErrors: ['LIA no responde', 'Plan no se genera', 'Calendario no conecta']
      }
    ],
    apis: [
      {
        endpoint: '/api/study-planner/generate-plan',
        method: 'POST',
        description: 'Genera plan con IA',
        commonErrors: ['500: Error de IA', '400: Datos insuficientes']
      }
    ],
    userFlows: [
      {
        name: 'Crear plan personalizado',
        steps: ['1. Conversar con LIA sobre preferencias', '2. LIA genera plan', '3. Revisar y ajustar', '4. Guardar plan'],
        commonBreakpoints: ['Paso 2: Plan no adecuado', 'Paso 4: Error guardando']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // STUDY PLANNER - CALENDAR
  // ============================================================================
  '/study-planner/calendar': {
    route: '/study-planner/calendar',
    routePattern: '/study-planner/calendar',
    pageType: 'study_planner_calendar',
    components: [
      {
        name: 'CalendarPage',
        path: 'apps/web/src/app/study-planner/calendar/page.tsx',
        description: 'Vista de calendario del plan de estudio',
        props: [],
        commonErrors: ['Eventos no cargan', 'Drag and drop no funciona']
      }
    ],
    apis: [
      {
        endpoint: '/api/study-planner/calendar/events',
        method: 'GET',
        description: 'Obtiene eventos del calendario',
        commonErrors: ['401: Token expirado']
      }
    ],
    userFlows: [
      {
        name: 'Ver y modificar plan',
        steps: ['1. Ver calendario con sesiones', '2. Arrastrar para reagendar', '3. Click para ver detalle'],
        commonBreakpoints: ['Paso 2: Evento no se mueve']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // WELCOME / QUESTIONNAIRE
  // ============================================================================
  '/welcome': {
    route: '/welcome',
    routePattern: '/welcome',
    pageType: 'onboarding_welcome',
    components: [
      {
        name: 'WelcomePage',
        path: 'apps/web/src/app/welcome/page.tsx',
        description: 'Página de bienvenida y onboarding',
        props: [],
        commonErrors: ['Cuestionario no carga', 'Navegación no funciona']
      }
    ],
    apis: [
      {
        endpoint: '/api/questionnaire',
        method: 'POST',
        description: 'Guarda respuestas del cuestionario',
        commonErrors: ['400: Respuestas incompletas']
      }
    ],
    userFlows: [
      {
        name: 'Completar onboarding',
        steps: ['1. Ver bienvenida', '2. Responder cuestionario', '3. Ir al dashboard'],
        commonBreakpoints: ['Paso 2: Preguntas no cargan']
      }
    ],
    commonIssues: []
  },

  // ============================================================================
  // CONOCER LIA
  // ============================================================================
  '/conocer-lia': {
    route: '/conocer-lia',
    routePattern: '/conocer-lia',
    pageType: 'lia_landing',
    components: [
      {
        name: 'ConocerLiaPage',
        path: 'apps/web/src/app/conocer-lia/page.tsx',
        description: 'Landing page sobre LIA',
        props: [],
        commonErrors: ['Página no carga', 'Animaciones no funcionan']
      }
    ],
    apis: [],
    userFlows: [
      {
        name: 'Conocer características de LIA',
        steps: ['1. Ver información', '2. Interactuar con demo', '3. Probar LIA'],
        commonBreakpoints: []
      }
    ],
    commonIssues: []
  }
};

/**
 * Obtiene todas las rutas registradas
 */
export function getRegisteredRoutes(): string[] {
  return Object.keys(PAGE_METADATA);
}

/**
 * Verifica si una ruta tiene metadata
 */
export function hasPageMetadata(route: string): boolean {
  return route in PAGE_METADATA;
}


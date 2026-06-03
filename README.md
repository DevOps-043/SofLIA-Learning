# 🚀 SofLIA Learning - Plataforma B2B de Capacitación en IA

> Plataforma de capacitación empresarial B2B enfocada en inteligencia artificial, diseñada para organizaciones que buscan desarrollar las habilidades de sus equipos con cursos, certificaciones, planificación de estudios con IA y seguimiento de progreso personalizado.

## 📌 Resumen Ejecutivo

**SofLIA Learning** es una plataforma educativa empresarial completa que combina inteligencia artificial, gestión de aprendizaje y herramientas de colaboración para ofrecer una experiencia de capacitación personalizada y escalable.

### Propuesta de Valor

- ✅ **Aprendizaje Personalizado con IA**: Asistente virtual SofLIA que se adapta al contexto y necesidades de cada usuario
- ✅ **Gestión Empresarial Completa**: Sistema de jerarquías, equipos, analytics y reportes avanzados
- ✅ **Planificación Inteligente**: Generación automática de planes de estudio con sincronización de calendarios
- ✅ **Learning Paths**: Rutas de aprendizaje secuenciales con progresión ordenada y desbloqueo por curso
- ✅ **White-Label**: Personalización completa de marca para organizaciones Enterprise
- ✅ **Certificaciones Verificables**: Sistema de certificados con hash blockchain, PDF con Playwright y snapshots de branding
- ✅ **Actividades Interactivas**: Envío de actividades con evaluación automática por SofLIA y rúbricas
- ✅ **Comunidad Integrada**: Sistema de comunidades, chats jerárquicos y colaboración entre equipos
- ✅ **Estándares de e-Learning**: Soporte SCORM para compatibilidad con contenido estándar
- ✅ **Sistema de Reportes de Problemas**: Formulario de bugs/sugerencias con screenshots, grabaciones y estadísticas
- ✅ **Multilingüe**: Soporte nativo para Español, Inglés y Portugués

### Tecnologías Principales

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **IA**: Google Gemini
- **Arquitectura**: Monorepo con npm workspaces

### Estadísticas del Proyecto

- 📦 **22 módulos principales** de funcionalidades
- 🧩 **900+ componentes** React
- 🔌 **350+ endpoints** API
- 🗄️ **60+ migraciones** de base de datos
- 🌍 **3 idiomas** soportados
- 📝 **180,000+ líneas** de código
- 📖 **78 documentos** técnicos

---

## 🎯 Modelo de Negocio B2B

### Buyer Persona Principal

**Director de RRHH / Learning & Development Manager**

- **Empresa**: Medianas y grandes empresas (50-5000+ empleados)
- **Industria**: Tecnología, Finanzas, Retail, Manufactura, Servicios
- **Pain Points**:
  - Necesita capacitar a su equipo en IA de forma estructurada
  - Requiere reportes de progreso para justificar inversión en capacitación
  - Busca certificaciones verificables para el desarrollo profesional
  - Necesita personalización de marca (white-label)
- **Goals**:
  - Desarrollar competencias en IA en toda la organización
  - Medir ROI de la capacitación
  - Obtener certificaciones reconocidas para empleados
  - Centralizar la gestión de aprendizaje del equipo

### Usuarios de la Plataforma

| Rol                     | Descripción                                    | Acceso              |
| ----------------------- | ---------------------------------------------- | ------------------- |
| **Admin (Super Admin)** | Administrador de la plataforma SofLIA Learning | `/admin/*`          |
| **Business Admin**      | Administrador de una organización cliente      | `/business-panel/*` |
| **Business User**       | Empleado de una organización cliente           | `/business-user/*`  |

---

## 📋 Tabla de Contenidos

- [Modelo de Negocio B2B](#-modelo-de-negocio-b2b)
- [Características Principales](#-características-principales)
- [Asistente Virtual SofLIA](#-asistente-virtual-soflia)
- [Planificador de Estudios con IA](#-planificador-de-estudios-con-ia)
- [Learning Paths (Rutas de Aprendizaje)](#-learning-paths-rutas-de-aprendizaje)
- [Actividades Interactivas y Evaluación con IA](#-actividades-interactivas-y-evaluación-con-ia)
- [Sistema de Certificados con PDF](#-sistema-de-certificados-con-pdf)
- [Sistema de Reportes de Problemas](#-sistema-de-reportes-de-problemas)
- [Onboarding Organizacional](#-onboarding-organizacional)
- [Sistema de Jerarquías Organizacionales](#-sistema-de-jerarquías-organizacionales)
- [Sistema de Chats Jerárquicos](#-sistema-de-chats-jerárquicos)
- [Sistema de Diseño SofLIA](#-sistema-de-diseño-soflia)
- [Integración SCORM](#-integración-scorm)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Estructura de la Plataforma](#-estructura-de-la-plataforma)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [APIs y Endpoints](#-apis-y-endpoints)
- [Sistema de Autenticación](#-sistema-de-autenticación)
- [Internacionalización](#-internacionalización)
- [Desarrollo](#-desarrollo)
- [Análisis del Proyecto](#-análisis-del-proyecto)

---

## ✨ Características Principales

### 🏢 Para Organizaciones (Business Panel)

#### Gestión de la Organización

- **Dashboard Empresarial**: Vista general de métricas y actividad
- **Gestión de Usuarios**: Invitar, gestionar y monitorear empleados
- **Gestión de Equipos**: Crear equipos y asignar cursos
- **Analytics y Reportes**: Progreso del equipo, completados, certificaciones
- **Configuración de Suscripción**: Planes Team, Business, Enterprise

#### Personalización de Marca (Branding)

- **Paleta de Colores**: Color primario, secundario y de acento
- **Tipografía**: Fuente personalizada de marca
- **Logos**: Logo, banner y favicon personalizables
- **Certificados Personalizados**: Templates con branding corporativo

#### Planes de Suscripción

| Plan           | Usuarios   | Características                               |
| -------------- | ---------- | --------------------------------------------- |
| **Team**       | Hasta 10   | Cursos básicos, Reportes                      |
| **Business**   | Hasta 50   | Todos los cursos, Analytics avanzados         |
| **Enterprise** | Ilimitados | White-label, Certificados personalizados, API |

### 👤 Para Empleados (Business User)

#### Dashboard Personal

- **Mi Progreso**: Cursos asignados y completados
- **Calendario de Estudio**: Planificador integrado con sincronización a Google/Microsoft Calendar
- **Certificados**: Certificados obtenidos con verificación blockchain
- **Habilidades**: Tracking de competencias desarrolladas

#### Aprendizaje

- **Cursos de IA**: Contenido estructurado por niveles
- **Lecciones en Video**: Contenido multimedia con tracking automático
- **Evaluaciones**: Quizzes y exámenes integrados
- **Notas Personales**: Sistema de notas por lección
- **Asistente SofLIA**: Chat con IA contextual durante el aprendizaje

### 🛡️ Para Administradores de Plataforma (Admin)

#### Gestión de Empresas

- **Listado de Organizaciones**: Vista completa de clientes
- **Modal de Vista Detallada**: Información completa con banner, logo, miembros
- **Edición Avanzada** (`/admin/companies/[id]/edit`):
  - **General**: Información básica, contacto, branding
  - **Usuarios**: Lista de miembros, roles, estados
  - **Cursos**: Cursos adquiridos y asignaciones
  - **Estadísticas**: Analytics de uso
  - **Personalización**: Colores, tipografía, estilos
  - **Notificaciones**: Preferencias de notificación
  - **Certificados**: Plantillas de certificados
  - **Suscripción**: Plan, límites, fechas

#### Gestión de Contenido

- **Cursos**: Crear, editar, organizar cursos
- **Módulos y Lecciones**: Estructura de contenido
- **Workshops**: Eventos en vivo
- **Prompts/Apps IA**: Directorio de recursos

#### Analytics y Monitoreo

- **Dashboard de Estadísticas**: Métricas de plataforma
- **Reportes**: Uso, crecimiento, engagement
- **SofLIA Analytics**: Uso del asistente virtual, métricas de interacción

### 🎓 Sistema de Certificados con Blockchain

- **Hash Único Inmutable**: Cada certificado tiene un hash SHA-256
- **Verificación Pública**: Cualquiera puede verificar autenticidad
- **Código QR**: Escaneo rápido para verificación
- **Descarga PDF**: Generación server-side con Playwright (Chromium headless)
- **Branding Snapshot**: Captura inmutable del branding organizacional al momento de emisión
- **Document Snapshot**: Datos del certificado (alumno, curso, instructor) preservados independientemente de cambios futuros

---

## 🤖 Asistente Virtual SofLIA

SofLIA (Learning Intelligence Assistant) es el asistente de IA integrado en toda la plataforma, potenciado por **Google Gemini**.

### Características Principales

| Característica             | Descripción                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| **Chat Contextual**        | Ayuda adaptativa según la sección donde se encuentre el usuario    |
| **Multilingüe**            | Soporte completo para Español, Inglés y Portugués                  |
| **Tono Profesional**       | Respuestas claras y concisas sin uso de emojis                     |
| **Panel Lateral**          | Interfaz slide-over desde la derecha, siempre accesible            |
| **Historial de Chat**      | Persistencia de conversaciones por contexto con edición de títulos |
| **Contexto Separado**      | Historial independiente entre General, Study Planner y Curso       |
| **Renderizado de Enlaces** | Soporte para links markdown clickeables en respuestas              |
| **Dark Mode Optimizado**   | Legibilidad perfecta en modo oscuro                                |

### Contextos de SofLIA

SofLIA se adapta según el contexto del usuario:

```
📚 Curso/Lección     → Responde dudas sobre el contenido, explica conceptos
📅 Study Planner     → Gestiona sesiones, detecta atrasos, propone reprogramaciones
🏠 Dashboard         → Orientación general, navegación, sugerencias
⚙️ Configuración     → Ayuda con ajustes de cuenta y preferencias
🔍 General           → Asistencia general de la plataforma (historial persistente)
```

### Uso en el Código

```typescript
// Hook principal para usar SofLIA
import { useLIAChat } from "@/features/lia/hooks/useLIAChat";

const { sendMessage, messages, isLoading } = useLIAChat({
  context: "course_lesson",
  metadata: { lessonId, courseId },
});
```

---

## 📅 Planificador de Estudios con IA

Sistema inteligente de planificación de estudios que permite a los usuarios crear planes personalizados, sincronizar con calendarios externos y tener a SofLIA como asistente proactivo.

### Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    1. CREACIÓN DEL PLAN                              │
│  Usuario → Selecciona Curso → Configura Preferencias → SofLIA genera   │
│  plan → Se guardan sesiones → Sync con calendario externo           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    2. DASHBOARD                                      │
│  - Vista calendario con sesiones programadas                         │
│  - SofLIA analiza proactivamente: sesiones overdue, conflictos         │
│  - Usuario puede mover/eliminar/crear sesiones                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 3. EJECUCIÓN DE SESIÓN                               │
│  Usuario → Entra al curso → Tracking inicia → Video + SofLIA →      │
│  Tracking eventos → Completar (quiz/inactividad/manual)             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│              4. ACTUALIZACIÓN DE PROGRESO                            │
│  - user_lesson_progress se actualiza automáticamente                 │
│  - study_sessions.status → 'completed'                               │
│  - Sincronización con calendario externo                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Configuración de Preferencias

El usuario define:

- **Días preferidos** para estudiar (Lun, Mar, Mié, etc.)
- **Horarios** de inicio y fin
- **Duración** de sesiones (15-60 min)
- **Enfoque**: `fast`, `balanced`, `long`, `custom`
- **Fecha de inicio**

### Tracking de Lecciones

El sistema registra automáticamente:

| Evento           | Trigger                       | Acción                     |
| ---------------- | ----------------------------- | -------------------------- |
| `video_play`     | Usuario reproduce video       | Inicia tracking            |
| `video_ended`    | Video termina                 | Registra evento            |
| `lia_message`    | Usuario interactúa con SofLIA | Extiende actividad         |
| `activity`       | Scroll, clic, etc.            | Actualiza última actividad |
| `quiz_submitted` | Quiz completado               | Auto-completa lección      |
| `inactivity_5m`  | 5 min sin actividad           | Auto-completa lección      |

### Acciones de SofLIA en el Study Planner

SofLIA puede ejecutar las siguientes acciones de forma proactiva:

```typescript
// Acciones disponibles
-move_session - // Mover sesión a otro horario
  delete_session - // Eliminar sesión
  create_session - // Crear nueva sesión
  rebalance_plan - // Redistribuir sesiones atrasadas
  recover_missed_session - // Reprogramar sesión perdida
  reduce_session_load; // Reducir carga de un día
```

### Estados de una Sesión

| Estado        | Descripción                            |
| ------------- | -------------------------------------- |
| `planned`     | Sesión programada, aún no iniciada     |
| `in_progress` | Usuario está activamente en la lección |
| `completed`   | Sesión completada correctamente        |
| `missed`      | La sesión pasó sin ser completada      |
| `rescheduled` | Fue reprogramada a otra fecha          |

### Sincronización con Calendarios

Integración con Google Calendar y Microsoft Outlook:

- Creación automática de eventos en calendario secundario "SofLIA Learning"
- Sincronización bidireccional de cambios
- Detección de conflictos con otros eventos

---

## 🛤️ Learning Paths (Rutas de Aprendizaje)

Sistema de rutas de aprendizaje ordenadas que agrupan cursos en secuencias con progresión controlada.

### Características

- **Progresión Secuencial**: Los cursos se desbloquean uno a uno conforme se completan
- **Asignación Dual**: Puede asignarse a organizaciones completas o a usuarios individuales
- **Tracking de Progreso**: Cálculo automático de porcentaje, curso actual y siguiente
- **Persistencia de Snapshots**: El progreso se guarda en `user_learning_path_progress` para consultas rápidas
- **Resolución Server-Side**: El acceso se valida desde el servidor sin depender del cliente

### Estructura de Datos

```
learning_paths
├── learning_path_items (curso + posición ordenada)
├── organization_learning_path_assignments (asignación por org)
├── user_learning_path_assignments (asignación por usuario)
└── user_learning_path_progress (caché de progreso)
```

### Uso en el Código

```typescript
import { resolveLearningPathAccessForCourse } from '@/features/learning-paths/services/learning-path-access.server';

const state = await resolveLearningPathAccessForCourse({
  userId,
  courseId,
  organizationId,
});
// state.currentCourseUnlocked: boolean
// state.items: LearningPathAccessItem[]
// state.progressPercentage: number
```

---

## 🧪 Actividades Interactivas y Evaluación con IA

Sistema de actividades interactivas dentro de las lecciones con envíos, evaluaciones automáticas por SofLIA y rúbricas configurables.

### Tipos de Actividades

| Campo                        | Descripción                                              |
| ---------------------------- | -------------------------------------------------------- |
| `activity_schema_version`    | Versión del esquema de la actividad                      |
| `activity_config`            | Configuración JSONB personalizada por tipo               |
| `requires_soflia_validation` | Si requiere evaluación automática por SofLIA             |
| `external_tool_key`          | Herramienta externa (ChatGPT, Gemini, NotebookLM, etc.) |

### Flujo de Envío

```
Usuario → Completa actividad → Envía submission → SofLIA evalúa
→ Resultado: pass / revise / error → Feedback al usuario
→ Progreso de lección se actualiza automáticamente
```

### Tablas Principales

| Tabla                         | Descripción                                     |
| ----------------------------- | ----------------------------------------------- |
| `user_activity_submissions`   | Envíos de actividades por usuario               |
| `user_activity_evaluations`   | Evaluaciones automáticas de SofLIA con rúbricas |

### Estados de un Envío

| Estado           | Descripción                        |
| ---------------- | ---------------------------------- |
| `draft`          | Borrador, no enviado               |
| `submitted`      | Enviado, pendiente de evaluación   |
| `validated`      | Aprobado por SofLIA                |
| `needs_revision` | Requiere correcciones del usuario  |

---

## 📜 Sistema de Certificados con PDF

Sistema rediseñado de generación de certificados con renderizado server-side y snapshots inmutables.

### Arquitectura

```
certificates/
├── components/
│   ├── CertificateDocument.tsx       # Componente React del certificado
│   ├── CertificateDocumentPreview.tsx # Preview en pantalla
│   └── CertificateDocumentViewport.tsx# Viewport de impresión
├── constants/
│   └── certificate-branding.ts       # Dimensiones de render
├── services/
│   ├── certificate-data.server.ts    # Carga de datos del certificado
│   ├── certificate-document.service.ts# Lógica del documento
│   ├── certificate-organization.server.ts # Datos de organización
│   └── certificate-pdf.server.ts     # Generación PDF con Playwright
└── types/
    └── certificate.ts                # Tipos TypeScript
```

### Generación PDF

- **Playwright Chromium**: Renderiza el certificado HTML/React en un navegador headless
- **Almacenamiento**: Se sube automáticamente a Supabase Storage (`certificates` bucket)
- **Cache**: Si el PDF ya existe, se reutiliza; se puede forzar regeneración
- **Branding Snapshot**: Se captura el branding de la organización al emitir para inmutabilidad
- **Document Snapshot**: Nombres, título del curso e instructor quedan fijados al momento de emisión

---

## 🐛 Sistema de Reportes de Problemas

Sistema completo para que los usuarios reporten bugs, sugerencias y problemas de la plataforma.

### Características

- **Categorías**: Bug, sugerencia, contenido, performance, UI/UX, otro
- **Prioridades**: Baja, media, alta, crítica
- **Estados**: Pendiente, en revisión, en progreso, resuelto, rechazado, duplicado
- **Captura Automática**: URL, pathname, user agent, resolución de pantalla, navegador
- **Screenshots**: Bucket dedicado de storage (`reportes-screenshots`, hasta 10MB)
- **Grabaciones de Sesión**: Soporte para session recordings con duración y tamaño
- **Vista Enriquecida**: `reportes_con_usuario` une datos del reportante y administrador asignado
- **Estadísticas**: Función `get_reportes_stats()` para dashboards administrativos

### Uso

```sql
-- Obtener estadísticas de reportes
SELECT * FROM public.get_reportes_stats();
-- Retorna: total_reportes, pendientes, en_revision, en_progreso,
--          resueltos, por_categoria, tiempo_promedio_resolucion
```

---

## 🚪 Onboarding Organizacional

Flujo completo de incorporación de usuarios a organizaciones con múltiples estados y pantallas.

### Pantallas del Flujo

| Componente             | Descripción                                              |
| ---------------------- | -------------------------------------------------------- |
| `OnboardingChoiceScreen` | Selección inicial: crear o unirse a una organización   |
| `CreateCompanyForm`    | Formulario para crear nueva organización                 |
| `JoinCompanyForm`      | Formulario para solicitar unirse a organización existente|
| `PendingCompanyScreen` | Pantalla de espera: organización en proceso de aprobación|
| `PendingJoinScreen`    | Pantalla de espera: solicitud de unión pendiente         |
| `ApprovedRedirect`     | Redirección automática tras aprobación                   |
| `RejectedScreen`       | Pantalla de solicitud rechazada                          |
| `SuspendedScreen`      | Pantalla de cuenta suspendida con detalles               |

### Hooks

```typescript
import { useOnboardingStatus, useCreateCompany, useJoinCompany } from '@/features/onboarding';
```

## 🏢 Sistema de Jerarquías Organizacionales

Sistema opcional y retrocompatible que permite a las organizaciones estructurar sus equipos en una jerarquía de **Región > Zona > Equipo**.

### Estructura Jerárquica

```
Organización (organization)
└── Región (organization_regions)
    └── Zona (organization_zones)
        └── Equipo (organization_teams)
            └── Usuarios (organization_users)
```

### Roles y Permisos

| Rol                | Scope        | Descripción                                     | Acceso                          |
| ------------------ | ------------ | ----------------------------------------------- | ------------------------------- |
| `owner`            | organization | Propietario, control total sin restricciones    | Toda la organización            |
| `admin`            | organization | Administrador genérico, ámbito según asignación | Toda la organización            |
| `regional_manager` | region       | Gerente Regional                                | Solo su región y sub-entidades  |
| `zone_manager`     | zone         | Gerente de Zona                                 | Solo su zona y equipos dentro   |
| `team_leader`      | team         | Líder de Equipo                                 | Solo su equipo                  |
| `member`           | team         | Miembro básico                                  | Solo su equipo (vista limitada) |

### Características

- **Opcional**: Las organizaciones pueden activar/desactivar la jerarquía
- **Retrocompatible**: Organizaciones sin jerarquía funcionan normalmente
- **Ubicación Geográfica**: Cada nivel puede tener dirección, ciudad, coordenadas GPS
- **Gestión de Contactos**: Teléfono y email por nivel jerárquico
- **Asignación de Gerentes**: Cada nivel puede tener un gerente/líder asignado
- **Metadata Flexible**: Campos JSONB para configuración personalizada

### Activación

```sql
-- Activar jerarquía para una organización
UPDATE organizations
SET hierarchy_enabled = true,
    hierarchy_config = '{"labels": {"region": "Sucursal", "zone": "Área"}}'::jsonb
WHERE id = 'org-uuid';
```

### Uso en el Código

```typescript
import { getHierarchyContext } from "@/lib/auth/hierarchicalAccess";

const context = await getHierarchyContext(userId, organizationId);
// context.scope: 'organization' | 'region' | 'zone' | 'team'
// context.role: HierarchyRole
// context.accessibleTeamIds: string[] | null
```

---

## 💬 Sistema de Chats Jerárquicos

Sistema de comunicación interna que permite chats **horizontales** (mismo nivel) y **verticales** (jerárquicos) dentro de la estructura organizacional.

### Tipos de Chat

#### Chats Horizontales

- Comunicación entre miembros del mismo nivel (todos los equipos de una zona, todas las zonas de una región)
- Útiles para coordinación y colaboración entre pares

#### Chats Verticales

- Comunicación jerárquica (gerente con subordinados)
- Permite comunicación directa entre niveles de la jerarquía

### Estructura

```typescript
interface HierarchyChat {
  id: string;
  organization_id: string;
  chat_type: "horizontal" | "vertical";
  entity_type: "region" | "zone" | "team";
  entity_id: string;
  level_role?: "regional_manager" | "zone_manager" | "team_leader";
  name?: string;
  description?: string;
  is_active: boolean;
  last_message_at?: Date;
}
```

### Características

- **Archivos Adjuntos**: Bucket de storage dedicado (`hierarchy-chats`) con soporte para imágenes, documentos, videos
- **Límite de Archivos**: 10MB por archivo
- **Tipos Soportados**: JPEG, PNG, PDF, Office, videos, audio
- **Políticas RLS**: Lectura pública, escritura desde backend con service role
- **Mensajes Persistidos**: Historial completo de conversaciones

### Storage Bucket

El bucket `hierarchy-chats` almacena:

- Imágenes: JPEG, PNG, WebP, GIF, SVG
- Documentos: PDF, Word, Excel, PowerPoint
- Videos: MP4, WebM, OGG
- Audio: MPEG, WAV, OGG

---

## 📦 Integración SCORM

La plataforma soporta contenido SCORM (Sharable Content Object Reference Model) para compatibilidad con estándares de e-learning.

### Características

- **Parser SCORM**: Análisis de paquetes SCORM 1.2 y 2004
- **Session Cache**: Almacenamiento de progreso de sesión
- **Sanitización**: Limpieza de contenido HTML/XML
- **Tracking**: Seguimiento de progreso y completado
- **API Compatible**: Endpoints para carga y gestión de contenido SCORM

### Archivos Principales

```
apps/web/src/lib/scorm/
├── index.ts              # Exportaciones principales
├── parser.ts             # Parser de paquetes SCORM
├── types.ts              # Tipos TypeScript
├── session-cache.ts      # Cache de sesión
└── sanitize.ts           # Sanitización de contenido
```

### Uso

```typescript
import { parseSCORMPackage } from "@/lib/scorm";

const scormData = await parseSCORMPackage(file);
// Procesa manifest, recursos y metadata
```

---

## 🎨 Sistema de Diseño SofLIA

**SofLIA** (Sistema Original de Funcionalidad e Interfaz Avanzada) es el sistema de diseño de la plataforma.

### Principios de Diseño

- **Consistencia**: Mismos patrones en toda la plataforma
- **Accesibilidad**: Soporte completo de teclado y lectores de pantalla
- **Temas**: Soporte nativo para modo claro y oscuro
- **Responsivo**: Mobile-first design

### Tokens de Diseño

```css
/* Colores primarios */
--primary-600: var(--color-primary);
--neutral-900: var(--color-bg-dark);
--accent: var(--color-accent);
/* Espaciado */
--radius-base: 0.75rem;
--shadow-base: 0 2px 8px rgb(var(--color-primary-rgb) / 0.08);
```

### Componentes UI

| Categoría        | Componentes                                      |
| ---------------- | ------------------------------------------------ |
| **Layout**       | Container, Grid, Flex, Spacer                    |
| **Forms**        | Input, Select, Checkbox, Radio, Switch, Textarea |
| **Feedback**     | Alert, Toast, Badge, Progress, Skeleton          |
| **Navigation**   | Navbar, Sidebar, Tabs, Breadcrumb, Pagination    |
| **Overlays**     | Modal, Dropdown, Tooltip, Popover, Sheet         |
| **Data Display** | Card, Table, Avatar, List, Accordion             |

### Temas Light/Dark

El sistema soporta cambio de tema en tiempo real:

```typescript
import { useTheme } from "@/core/stores/themeStore";

const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
```

---

## 🏗️ Estructura de la Plataforma

```
📁 /                          # Landing page pública
📁 /auth                      # Autenticación
├── /[slug]                   # Login por organización
├── /[slug]/register          # Registro por organización
└── /forgot-password          # Recuperación de contraseña

📁 /admin                     # Panel Super Admin
├── /dashboard                # Dashboard principal
├── /companies                # Gestión de empresas/organizaciones
│   └── /[id]/edit           # Edición detallada de empresa
├── /users                    # Gestión de usuarios
├── /workshops               # Gestión de workshops
├── /communities             # Gestión de comunidades
├── /skills                  # Gestión de habilidades
├── /prompts                 # Directorio de prompts
├── /apps                    # Directorio de apps IA
├── /news                    # Gestión de noticias
├── /statistics              # Estadísticas de plataforma
├── /lia-analytics           # Analytics del asistente SofLIA
└── /reportes                # Sistema de reportes

📁 /business-panel           # Panel Admin de Organización
├── /dashboard               # Dashboard empresarial
├── /users                   # Gestión de empleados
├── /teams                   # Gestión de equipos
├── /courses                 # Cursos asignados
├── /analytics               # Analytics de la org
├── /progress                # Progreso general
├── /reports                 # Reportes empresariales
├── /settings                # Configuración y branding
└── /subscription            # Gestión de suscripción

📁 /business-user            # Dashboard Empleado
├── /dashboard               # Dashboard personal
│   ├── /courses             # Mis cursos
│   ├── /calendar            # Mi calendario
│   ├── /progress            # Mi progreso
│   └── /certificates        # Mis certificados
└── /teams                   # Mis equipos

📁 /courses                  # Visualización de cursos
└── /[slug]/learn            # Experiencia de aprendizaje

📁 /certificates             # Verificación de certificados
└── /verify/[hash]           # Verificación pública

📁 /study-planner            # Planificador de estudio
├── /create                  # Crear nuevo plan
└── /dashboard               # Dashboard del plan activo

📁 /profile                  # Perfil de usuario
📁 /account-settings         # Configuración de cuenta
📁 /questionnaire            # Cuestionario inicial
📁 /welcome                  # Página de bienvenida
📁 /conocer-lia              # Presentación de SofLIA
```

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnología        | Versión  | Uso                            |
| ----------------- | -------- | ------------------------------ |
| **Next.js**       | 14.2.15  | Framework React con App Router |
| **React**         | 18.3.1   | Biblioteca UI                  |
| **TypeScript**    | 5.9.3    | Tipado estático                |
| **Tailwind CSS**  | 3.4.18   | Estilos utility-first          |
| **Framer Motion** | 12.23.26 | Animaciones                    |
| **Zustand**       | 5.0.2    | Estado global                  |
| **Recharts**      | 3.5.0    | Visualización de datos         |
| **FullCalendar**  | 6.x      | Calendario del Study Planner   |
| **Radix UI**      | Latest   | Componentes accesibles         |
| **Headless UI**   | Latest   | Componentes sin estilos        |

### Backend & Infraestructura

| Tecnología                | Uso                                     |
| ------------------------- | --------------------------------------- |
| **Supabase**              | Base de datos PostgreSQL, Auth, Storage |
| **Supabase Auth**         | Autenticación y gestión de sesiones     |
| **Google Gemini API**     | Asistente virtual SofLIA                |
| **Netlify Functions**     | Cron jobs (inactividad de lecciones)    |
| **Google/Microsoft APIs** | Integración de calendarios              |

### Visualización de Datos

| Tecnología      | Uso                                  |
| --------------- | ------------------------------------ |
| **Nivo Charts** | Gráficos complejos y personalizables |
| **Recharts**    | Gráficos simples y performantes      |
| **Tremor**      | Dashboards de negocios               |

---

## 📁 Estructura del Monorepo

```
SofLIA-Learning/
├── apps/
│   ├── web/                          # Frontend (Next.js)
│   │   └── src/
│   │       ├── app/                  # Next.js App Router (Server Components)
│   │       ├── core/                 # Lógica transversal
│   │       │   ├── components/       # Componentes core (Header, Sidebar, LIA)
│   │       │   ├── hooks/            # Hooks personalizados
│   │       │   ├── i18n/             # Configuración de internacionalización
│   │       │   ├── layout/           # Layout compartido (PageShell, ResponsiveModal, DataTable)
│   │       │   ├── providers/        # Context providers
│   │       │   ├── services/         # API client (Axios), servicios
│   │       │   └── stores/           # Estado global (Zustand)
│   │       ├── features/             # Features por dominio (22 módulos)
│   │       │   ├── admin/            # Gestión de plataforma y empresas
│   │       │   ├── ai-directory/     # Directorio de aplicaciones IA
│   │       │   ├── auth/             # Autenticación y SSO
│   │       │   ├── business-panel/   # Panel empresarial (admin org)
│   │       │   ├── certificates/     # 🆕 Generación y gestión de certificados PDF
│   │       │   ├── communities/      # Gestión de comunidades
│   │       │   ├── courses/          # Sistema de cursos
│   │       │   ├── instructor/       # Features de instructor
│   │       │   ├── landing/          # Landing page
│   │       │   ├── learning-paths/   # 🆕 Rutas de aprendizaje secuenciales
│   │       │   ├── lia/              # Componentes de SofLIA (personalización)
│   │       │   ├── news/             # Artículos y noticias
│   │       │   ├── notifications/    # Sistema de notificaciones
│   │       │   ├── onboarding/       # Flujo de incorporación organizacional
│   │       │   ├── profile/          # Perfil de usuario
│   │       │   ├── reels/            # Contenido de video corto
│   │       │   ├── responsive-smoke/ # Pruebas de UI responsive y regresión visual
│   │       │   ├── scorm/            # Integración SCORM para e-learning
│   │       │   ├── skills/           # Gestión de habilidades
│   │       │   ├── study-planner/    # Planificador de estudios con IA
│   │       │   ├── tours/            # Tours guiados de onboarding
│   │       │   └── video-tracking/   # 🆕 Tracking de reproducción de video
│   │       ├── lib/                  # Infraestructura y utilidades
│   │       │   ├── supabase/         # Cliente Supabase y types
│   │       │   ├── gemini/           # Cliente Gemini
│   │       │   ├── lia/              # Configuración de SofLIA
│   │       │   ├── scorm/            # Utilidades SCORM
│   │       │   ├── oauth/            # Configuración OAuth
│   │       │   ├── schemas/          # Esquemas de validación Zod
│   │       │   └── rrweb/            # Session recording
│   │       └── shared/               # Componentes y utils genéricos
│   │           ├── hooks/            # Hooks reutilizables
│   │           └── utils/            # Funciones utilitarias
│   │   └── public/
│   │       └── locales/              # Archivos de traducción (es, en, pt)
│   │
│   └── api/                          # Backend (Express) - Placeholders
│       └── src/
│           ├── features/             # Endpoints por dominio
│           └── core/                 # Middleware y config
│
├── packages/
│   ├── shared/                       # Tipos y utilidades compartidas
│   └── ui/                           # Componentes UI compartidos
│
├── netlify/
│   └── functions/                    # Funciones serverless (cron jobs)
│
├── supabase/                         # Migraciones y configuración (60+)
│
└── docs/                             # Documentación del proyecto (78 documentos)
```

### Organización del Frontend (apps/web/src/)

| Directorio  | Propósito                                                               |
| ----------- | ----------------------------------------------------------------------- |
| `app/`      | Next.js App Router (Server Components por defecto)                      |
| `features/` | Features de dominio (auto-contenidos, screaming architecture) — 22 módulos |
| `core/`     | Lógica transversal: stores (Zustand), providers, layout, services/api.ts |
| `lib/`      | Infraestructura: supabase/, gemini/, ai/, lia/, schemas/, oauth/        |
| `shared/`   | Infraestructura pura: hooks genéricos (useDebounce), utilidades         |

### Reglas de Dependencia

```
features/  → Puede importar de core/ y shared/
core/      → Puede importar de shared/
shared/    → No importa de ningún lado (infraestructura pura)
```

---

## 🚀 Instalación

### Requisitos Previos

- **Node.js**: >= 22.0.0
- **npm**: >= 10.5.1
- **Cuenta Supabase**: Para base de datos y autenticación
- **Google Gemini API Key**: Para el asistente SofLIA

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-repo/soflia-learning.git
cd SofLIA-Learning

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Ejecutar en desarrollo
npm run dev
```

---

## ⚙️ Configuración

### Variables de Entorno (`.env`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Gemini (para SofLIA)
GOOGLE_API_KEY=tu_google_api_key
GEMINI_API_KEY=tu_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash
GEMINI_TTS_MODEL=gemini-3.1-flash-tts-preview
GEMINI_LIVE_MODEL=gemini-3.1-flash-live-preview
GEMINI_MAX_TOKENS=700
GEMINI_TEMPERATURE=0.6

# Autenticación
JWT_SECRET=tu_jwt_secret_seguro
SESSION_SECRET=tu_session_secret_seguro

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google Calendar (opcional)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Microsoft Calendar (opcional)
MICROSOFT_CLIENT_ID=tu_microsoft_client_id
MICROSOFT_CLIENT_SECRET=tu_microsoft_client_secret
```

---

## 🔌 APIs y Endpoints

### Autenticación

```
POST   /api/auth/login                  # Inicio de sesión
POST   /api/auth/register               # Registro
POST   /api/auth/logout                 # Cerrar sesión
POST   /api/auth/refresh                # Refrescar token
GET    /api/auth/me                     # Usuario actual
```

### Panel de Administración

```
# Gestión de Empresas
GET    /api/admin/companies             # Listar empresas
GET    /api/admin/companies/:id         # Obtener empresa
PUT    /api/admin/companies/:id         # Actualizar empresa
POST   /api/admin/companies             # Crear empresa
DELETE /api/admin/companies/:id         # Eliminar empresa

# Usuarios y Contenido
GET    /api/admin/users                 # Listar usuarios
GET    /api/admin/courses               # Listar cursos
GET    /api/admin/stats                 # Estadísticas generales
```

### Business Panel (Organizaciones)

```
# Dashboard
GET    /api/business/dashboard/stats    # Estadísticas
GET    /api/business/dashboard/activity # Actividad reciente

# Usuarios y Equipos
GET    /api/business/users              # Listar usuarios
POST   /api/business/users              # Crear/invitar usuario
GET    /api/business/teams              # Listar equipos

# Branding
GET    /api/business/settings/branding  # Obtener branding
PUT    /api/business/settings/branding  # Actualizar branding
```

### Cursos y Aprendizaje

```
GET    /api/courses                     # Listar cursos
GET    /api/courses/:slug               # Detalle de curso
GET    /api/courses/:slug/learn-data    # Datos para aprendizaje
PUT    /api/courses/:slug/lessons/:id/progress # Actualizar progreso
```

### Study Planner

```
POST   /api/study-planner/create        # Crear plan de estudios
GET    /api/study-planner/dashboard/plan # Obtener plan activo
GET    /api/study-planner/sessions      # Listar sesiones
PUT    /api/study-planner/sessions/:id  # Actualizar sesión
DELETE /api/study-planner/sessions/:id  # Eliminar sesión

# Tracking de lecciones
POST   /api/study-planner/lesson-tracking/start    # Iniciar tracking
POST   /api/study-planner/lesson-tracking/event    # Registrar evento
POST   /api/study-planner/lesson-tracking/complete # Completar lección

# Chat con SofLIA
POST   /api/study-planner/dashboard/chat # Chat contextual
```

### Asistente SofLIA

```
POST   /api/ai-chat                     # Chat con SofLIA
POST   /api/ai-directory/generate-prompt # Generar prompt
POST   /api/lia/context-help            # Ayuda contextual
```

### Certificados

```
GET    /api/certificates                # Mis certificados
POST   /api/certificates/generate       # Generar certificado
GET    /api/certificates/verify/:hash   # Verificar certificado (público)
GET    /api/certificates/:id/pdf        # Descargar PDF del certificado
POST   /api/certificates/:id/pdf/regenerate # Regenerar PDF
```

### Learning Paths

```
GET    /api/learning-paths                          # Listar rutas de aprendizaje
GET    /api/learning-paths/:id                      # Detalle de ruta
GET    /api/learning-paths/:id/progress             # Progreso del usuario
POST   /api/learning-paths/resolve-access           # Resolver acceso por curso
```

### Actividades Interactivas

```
GET    /api/activities/:lessonId                    # Actividades de una lección
POST   /api/activities/:activityId/submit           # Enviar actividad
GET    /api/activities/:activityId/submissions      # Mis envíos
GET    /api/activities/:submissionId/evaluations    # Evaluaciones de un envío
```

### Reportes de Problemas

```
GET    /api/reportes-problemas                      # Listar reportes
POST   /api/reportes-problemas                      # Crear reporte
GET    /api/reportes-problemas/:id                  # Detalle de reporte
PUT    /api/reportes-problemas/:id                  # Actualizar reporte (admin)
GET    /api/reportes-problemas/stats                # Estadísticas agregadas
```

---

## 🔐 Sistema de Autenticación

### Roles de Usuario

| Rol            | Descripción                       | Rutas Permitidas    |
| -------------- | --------------------------------- | ------------------- |
| `Admin`        | Super administrador de plataforma | `/admin/*`          |
| `Business`     | Administrador de organización     | `/business-panel/*` |
| `BusinessUser` | Empleado de organización          | `/business-user/*`  |

### Flujo de Autenticación

1. Usuario accede a `/auth/[slug]` (login por organización)
2. Se valida credenciales contra Supabase Auth
3. Se genera JWT con rol y organization_id
4. Middleware valida rol en cada request
5. Redirección automática al panel correspondiente

---

## 🌍 Internacionalización

La plataforma soporta **3 idiomas**: Español (default), Inglés y Portugués.

### Archivos de Traducción

```
apps/web/public/locales/
├── es/common.json    # Español
├── en/common.json    # Inglés
└── pt/common.json    # Portugués
```

### Uso en Componentes

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  return <h1>{t('welcome.title')}</h1>;
}
```

### Cambio de Idioma

```typescript
import { useLanguage } from "@/core/i18n/I18nProvider";

function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();
  // language: 'es' | 'en' | 'pt'
}
```

> **Nota**: SofLIA detecta automáticamente el idioma del usuario y responde en ese idioma.

---

## 👨‍💻 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Frontend (:3000) y Backend (:4000) concurrentes
npm run dev:web          # Solo frontend
npm run dev:api          # Solo backend

# Build
npm run build            # Build de todos los workspaces
npm run build:web        # Solo frontend
npm run build:packages   # Solo paquetes compartidos

# Calidad de Código
npm run type-check       # Verificar tipos TypeScript
npm run lint             # Ejecutar ESLint

# Operaciones por Workspace
npm install <pkg> --workspace=apps/web   # Instalar en web
npm run <cmd> --workspace=apps/web       # Ejecutar comando específico
```

### Convenciones de Código

- ✅ TypeScript estricto (`strict: true`)
- ✅ Componentes funcionales con hooks
- ✅ Feature-based arquitectura (Screaming Architecture)
- ✅ Tailwind CSS para estilos (mobile-first)
- ✅ Framer Motion para animaciones
- ✅ Server Components por defecto, `'use client'` solo cuando necesario

### Path Aliases

```typescript
@/*           → apps/web/src/*
@/features/*  → apps/web/src/features/*
@/core/*      → apps/web/src/core/*
@/lib/*       → apps/web/src/lib/*
@/components/*→ apps/web/src/shared/components/*
@/utils/*     → apps/web/src/shared/utils/*
@/hooks/*     → apps/web/src/shared/hooks/*
@shared/*     → packages/shared/src/*
```

---

## 📚 Documentación Técnica

El proyecto incluye **78 documentos técnicos** en el directorio `docs/`:

| Documento                     | Descripción                                        |
| ----------------------------- | -------------------------------------------------- |
| `SOFIA_DESIGN_SYSTEM.md`      | Sistema de diseño SOFIA con patrones y componentes |
| `AGENTES_LIA.md`              | Documentación de los agentes de SofLIA             |
| `ARQUITECTURA-COMPLETA.md`    | Arquitectura completa del proyecto                 |
| `ARQUITECTURA_DEFENSA_AGENTES...md` | Defensa de agentes y anti-clonación           |
| `SCORM-IMPLEMENTACION.md`     | Guía de implementación SCORM                       |
| `STUDY-PLANNER-FLOW.md`       | Flujo completo del planificador de estudios        |
| `PRD-PLANIFICADOR-ESTUDIO-IA.md` | PRD completo del planificador con IA            |
| `LIA_ANALYTICS_PANEL.md`      | Documentación del panel de analytics de SofLIA     |
| `HIERARCHY_SYSTEM.md`         | Documentación del sistema de jerarquías            |
| `GUIA-RAPIDA-TRADUCCIONES.md` | Guía rápida de internacionalización                |
| `refactor-program.md`         | Programa de refactorización del código             |
| `BUGS-SISTEMA.md`             | Bugs conocidos y soluciones del sistema            |
| `business-panel-visual-language.md` | Lenguaje visual del panel empresarial        |
| `soflia-course-reporting-iris.md` | Integración de reportes de cursos con IRIS     |

> **Importante**: La guía principal de desarrollo está en `CLAUDE.md` en la raíz del proyecto. Este archivo contiene las instrucciones actualizadas para trabajar con el código.

## 📊 Base de Datos (Tablas Principales)

### Tablas de Usuarios y Organizaciones

| Tabla                      | Descripción                                  |
| -------------------------- | -------------------------------------------- |
| `usuarios`                 | Perfiles de usuario (auth linking)           |
| `organizations`            | Organizaciones/empresas con branding         |
| `organization_users`       | Relación usuarios-organizaciones (multi-org) |
| `organization_invitations` | Invitaciones pendientes a organizaciones     |

### Tablas de Jerarquía (Opcional)

| Tabla                     | Descripción                                   |
| ------------------------- | --------------------------------------------- |
| `organization_regions`    | Regiones de la organización (nivel 1)         |
| `organization_zones`      | Zonas dentro de regiones (nivel 2)            |
| `organization_teams`      | Equipos dentro de zonas (nivel 3)             |
| `hierarchy_chats`         | Chats jerárquicos (horizontales y verticales) |
| `hierarchy_chat_messages` | Mensajes de chats jerárquicos                 |

### Tablas de Cursos y Aprendizaje

| Tabla                  | Descripción                                     |
| ---------------------- | ----------------------------------------------- |
| `cursos`               | Catálogo de cursos con módulos y lecciones      |
| `modulos`              | Módulos dentro de cursos                        |
| `lecciones`            | Lecciones individuales con videos y actividades |
| `actividades`          | Actividades interactivas por lección            |
| `user_lesson_progress` | Progreso por lección                            |
| `lesson_tracking`      | Tracking en tiempo real de lección activa       |

### Tablas de Planificación de Estudios

| Tabla                           | Descripción                                      |
| ------------------------------- | ------------------------------------------------ |
| `study_plans`                   | Planes de estudio creados con IA                 |
| `study_sessions`                | Sesiones individuales programadas                |
| `study_preferences`             | Preferencias de estudio del usuario              |
| `calendar_integrations`         | Conexión con Google/Microsoft Calendar           |
| `organization_planner_config`   | Configuración B2B del planificador (horarios, límites) |
| `organization_holidays`         | Festivos oficiales e internos por organización   |

### Tablas de Learning Paths

| Tabla                                       | Descripción                                    |
| ------------------------------------------- | ---------------------------------------------- |
| `learning_paths`                            | Rutas de aprendizaje con cursos ordenados      |
| `learning_path_items`                       | Relación curso-posición dentro de la ruta      |
| `organization_learning_path_assignments`    | Asignaciones de rutas a organizaciones         |
| `user_learning_path_assignments`            | Asignaciones de rutas a usuarios individuales  |
| `user_learning_path_progress`               | Caché de progreso por usuario                  |

### Tablas de Actividades Interactivas

| Tabla                         | Descripción                                     |
| ----------------------------- | ----------------------------------------------- |
| `user_activity_submissions`   | Envíos de actividades por usuario               |
| `user_activity_evaluations`   | Evaluaciones automáticas de SofLIA con rúbricas |

### Tablas de SofLIA (Asistente Virtual)

| Tabla                 | Descripción                                           |
| --------------------- | ----------------------------------------------------- |
| `lia_conversations`   | Historial de conversaciones con SofLIA                |
| `lia_messages`        | Mensajes individuales de cada conversación con SofLIA |
| `lia_personalization` | Configuración personalizada de SofLIA por usuario     |

### Tablas de Certificados y Habilidades

| Tabla                       | Descripción                                        |
| --------------------------- | -------------------------------------------------- |
| `user_course_certificates`  | Certificados generados con hash blockchain         |
| `certificate_templates`     | Plantillas de certificados por organización        |
| `certificate_ledger`        | Registro inmutable de emisiones de certificados    |
| `skills`                    | Catálogo de habilidades                            |
| `user_skills`               | Habilidades adquiridas por usuario                 |

### Tablas de Reportes de Problemas

| Tabla                  | Descripción                                          |
| ---------------------- | ---------------------------------------------------- |
| `reportes_problemas`   | Incidencias reportadas (bugs, sugerencias, etc.)     |
| `reportes_con_usuario` | Vista enriquecida con datos del reportante y admin   |

### Tablas de Comunidad y Contenido

| Tabla                   | Descripción                |
| ----------------------- | -------------------------- |
| `comunidades`           | Comunidades de aprendizaje |
| `comunidad_posts`       | Posts en comunidades       |
| `comunidad_comentarios` | Comentarios en posts       |
| `news`                  | Artículos y noticias       |
| `reels`                 | Contenido de video corto   |
| `workshops`             | Talleres y eventos en vivo |

### Tablas de Directorio de IA

| Tabla              | Descripción                    |
| ------------------ | ------------------------------ |
| `ai_apps`          | Aplicaciones de IA catalogadas |
| `ai_prompts`       | Prompts de IA reutilizables    |
| `prompt_favorites` | Prompts favoritos de usuarios  |

---

## 📝 Historial de Cambios

### Febrero – Abril 2026 (v2.3.0)

#### 🛤️ Learning Paths (Rutas de Aprendizaje)

- ✅ **Nuevo módulo `learning-paths/`**: Rutas de aprendizaje secuenciales con cursos ordenados
- ✅ **Progresión forzada**: Cada curso se desbloquea solo al completar el anterior
- ✅ **Asignación organizacional y por usuario**: Doble nivel de asignación con estados `active`/`revoked`
- ✅ **Tracking de progreso en BD**: Tabla `user_learning_path_progress` con snapshot persistido
- ✅ **Server-side access resolution**: Servicio `resolveLearningPathAccessForCourse()` que valida acceso desde el servidor
- ✅ **Migración completa**: 5 tablas nuevas con índices, constraints y comentarios

#### 🧪 Actividades Interactivas con Evaluación IA

- ✅ **Nuevo sistema de submissions**: Tabla `user_activity_submissions` con estados (draft, submitted, validated, needs_revision)
- ✅ **Evaluación automática por SofLIA**: Tabla `user_activity_evaluations` con rúbricas y feedback
- ✅ **Herramientas externas**: Soporte para ChatGPT, Gemini, NotebookLM, Gamma, Atlas como herramientas de actividad
- ✅ **Progreso por actividad**: Campos de progreso en `user_lesson_progress` (porcentaje, total, completadas)
- ✅ **Activity config**: JSONB configurable por tipo de actividad (`activity_config`, `activity_schema_version`)
- ✅ **Renderer interactivo**: Componente `InteractiveActivityRenderer` con soporte para múltiples tipos de envío

#### 📜 Certificados — Refactorización Completa

- ✅ **Nuevo módulo `certificates/`**: Feature dedicada con componentes, servicios y tipos
- ✅ **Generación PDF con Playwright**: Renderizado server-side con Chromium headless
- ✅ **Branding Snapshot**: Captura inmutable del branding organizacional al momento de emisión
- ✅ **Document Snapshot**: Datos del certificado preservados independientemente de cambios futuros
- ✅ **Backfill de hashes**: Migración que genera hash SHA-256 para certificados existentes sin hash
- ✅ **Backfill de organización y template**: Relleno automático de `organization_id` y `template_id` faltantes
- ✅ **Storage automático**: Upload a Supabase Storage con cache y regeneración bajo demanda

#### 🐛 Sistema de Reportes de Problemas

- ✅ **Tabla `reportes_problemas`**: Dominio completo con categorías, prioridades y estados
- ✅ **Captura automática de contexto**: URL, user agent, resolución, navegador
- ✅ **Screenshots y grabaciones**: Bucket `reportes-screenshots` con soporte de imágenes
- ✅ **Vista enriquecida**: `reportes_con_usuario` con datos del reportante y admin asignado
- ✅ **Función de estadísticas**: `get_reportes_stats()` para dashboards administrativos
- ✅ **Trigger de updated_at**: Actualización automática de timestamp

#### 🚪 Onboarding Organizacional

- ✅ **Nuevo módulo `onboarding/`**: Flujo completo de incorporación a organizaciones
- ✅ **8 pantallas**: Choice, Create Company, Join Company, Pending (2), Approved, Rejected, Suspended
- ✅ **3 hooks**: `useOnboardingStatus`, `useCreateCompany`, `useJoinCompany`
- ✅ **Estados tipados**: `OnboardingStatus`, `OnboardingType`, `OnboardingStatusResponse`

#### ⚙️ Configuración B2B del Planificador

- ✅ **Tabla `organization_planner_config`**: Horarios laborales, días hábiles, microlearning, timezone
- ✅ **Tabla `organization_holidays`**: Festivos oficiales e internos por organización
- ✅ **Ventana de planificación**: Campo `planning_window` en asignaciones de cursos
- ✅ **Políticas RLS**: Lectura para miembros, escritura solo admin/owner

#### 📐 Responsive Smoke Testing

- ✅ **Nuevo módulo `responsive-smoke/`**: 10 escenarios de pruebas de UI responsive
- ✅ **Escenarios**: Admin Dashboard, Workshops, Course Management, Admin Users Modal, Business Dashboard, Business Reports, Business Users Modal, Instructor Course Management, Select Organization, Business Public
- ✅ **Componentes de layout compartidos**: `PageShell`, `ResponsiveDataTable`, `ResponsiveModalPanel`, `ResponsiveModalViewport`

#### 🎬 Video Tracking

- ✅ **Nuevo módulo `video-tracking/`**: Hook `useVideoTracking` dedicado para tracking de reproducción
- ✅ **Eventos granulares**: play, pause, seek, progress, ended

#### 🔧 Integridad de Datos — Delete Cascades

- ✅ **30+ foreign keys actualizadas a `ON DELETE CASCADE`**: Módulos, lecciones, materiales, actividades, checkpoints, feedback, tracking, notas, progreso, quizzes, conversaciones LIA, mensajes, feedbacks, activity completions, sesiones de estudio, activity log
- ✅ **Eliminación segura de cursos**: Borrar un curso limpia automáticamente toda la cadena de dependencias

#### 🗄️ Migraciones de BD (14 nuevas)

- ✅ Índices de planner, notificaciones y calendar lookups
- ✅ RLS para tablas faltantes e índices para LIA y progreso
- ✅ `organization_planner_config` y `organization_holidays`
- ✅ `planning_window` en asignaciones de cursos
- ✅ Índices de lookup core
- ✅ Actividades interactivas y tracking
- ✅ Dominio de reportes de problemas
- ✅ Delete cascades para contenido de cursos
- ✅ Snapshots y backfill de certificados
- ✅ Learning paths completo
- ✅ Transcripciones con timestamps y guardado en notas
- ✅ Caché de insights de analytics para usuarios business
- ✅ Videos de introducción por curso y learning path

---

### Enero 2026 (v2.2.0)

#### 🤖 SofLIA - Nuevas Funcionalidades

- ✅ **Historial de Conversaciones**: Persistencia de conversaciones de SofLIA con capacidad de cargar chats anteriores
- ✅ **Edición de Títulos**: Los usuarios pueden renombrar sus conversaciones pasadas
- ✅ **Contexto Separado**: Historial independiente por contexto (general, Study Planner, curso)
- ✅ **Visibilidad de Enlaces en Dark Mode**: Links de redirección de SofLIA ahora son claramente legibles en modo oscuro

#### 🏢 Panel de Administración Mejorado

- ✅ **AdminEditCompanyModal**: Nuevo componente rediseñado siguiendo el patrón "Split Panel Modal" del SOFIA Design System
  - Panel izquierdo con preview animado y avatar con gradiente
  - Panel derecho con inputs premium y formularios organizados
  - Navegación integrada con tabs especializados
- ✅ **Gestión de Empresas**: Limpieza completa del modal de creación de organizaciones
- ✅ **SofLIA Analytics Panel**: Métricas de uso del asistente virtual con widgets especializados

#### 🔐 Autenticación y Usuarios

- ✅ **Flujo SSO Corregido**: Registro via Google/Microsoft ahora procesa correctamente invitaciones y asigna organizaciones/roles
- ✅ **Sistema de Invitaciones**: Corrección del flujo completo de invitación con:
  - Asignación correcta de `cargo_rol` (Business/Business User)
  - Guardado del campo "Position" desde el formulario de invitación
  - Asociación correcta en tabla `organization_users`
  - Redirección apropiada post-registro y post-login
- ✅ **Eliminación en Cascada**: Sistema completo de eliminación de usuarios que limpia automáticamente:
  - Posts y comentarios de comunidad
  - Reacciones y enrollments
  - Sesiones y favoritos
  - Progreso de lecciones y todas las referencias relacionadas

#### 🎨 Rediseño de Headers del Business Panel

- ✅ **Reports Header**: Nuevo diseño premium con imagen de fondo (`teams-header.png`), fondo azul oscuro basado en `var(--color-primary)`, gradiente superpuesto y textos en blanco
- ✅ **Analytics Header**: Mismo estilo visual que Reports, con imagen de fondo y tema oscuro consistente
- ✅ **Settings Header**: Rediseño completo con imagen de fondo, eliminando animaciones complejas por un diseño más limpio
- ✅ **Business User Dashboard Hero**: Actualizado con imagen de fondo y esquema de colores oscuros premium
- ✅ Eliminación de títulos/subtítulos redundantes sobre los headers en páginas de Reports, Analytics y Settings

#### 📱 Responsividad y UI

- ✅ **SofLIA Side Panel**: Panel lateral totalmente responsive en diferentes tamaños de pantalla
- ✅ **Course Detail Page**: Corrección de layout cuando el panel de SofLIA está abierto
- ✅ **Tabs de Navegación**: Adaptación correcta de elementos en modo responsive
- ✅ **Course Cards**: Prevención de overflow de contenido en pantallas pequeñas
- ✅ **Botones SOFIA**: Corrección de colores de botones primarios (fondo azul, texto blanco)

#### 🌓 Mejoras de Modo Claro/Oscuro

- ✅ **BusinessSettings.tsx**: Tarjetas, formularios y tabs ahora soportan correctamente modo claro y oscuro
- ✅ **BusinessAnalytics.tsx**: KPIs de equipos, gráficos de progreso y tarjetas de equipos con soporte dual de temas
- ✅ Gradientes y colores de botones actualizados a tokens primarios para consistencia de marca
- ✅ Inputs y labels con clases `dark:` para adaptarse automáticamente al tema
- ✅ Mejora de legibilidad de texto en modo oscuro

#### 🎬 Procesamiento de Video

- ✅ **Auto-procesamiento**: Transcripción y generación de resumen se inician automáticamente después de subir un video
- ✅ **Pipeline Mejorado**: Reducción de pasos manuales para una mejor experiencia de usuario

#### 🔐 Mejoras de Autenticación Organizacional

- ✅ **OrganizationAuthLayout.tsx**: Color del nombre de organización cambiado de azul a blanco mediante token de tema para mejor legibilidad en fondos oscuros
- ✅ Switches de SSO (Google/Microsoft) actualizados con nuevos gradientes y soporte para modo claro

#### 🛠️ Mejoras Técnicas

- ✅ Importación de `next/image` en componentes que usan `teams-header.png`
- ✅ Estilos inline migrados a tokens de tema para evitar problemas de herencia
- ✅ Grid patterns sutiles (`radial-gradient`) añadidos a los headers premium
- ✅ Corrección de recarga continua en página de Business Settings
- ✅ Corrección de visualización de actividades en página de aprendizaje de cursos

### Diciembre 2025 (v2.1.0)

#### 🆕 Planificador de Estudios con IA

- ✅ Creación de planes personalizados con LIA
- ✅ Sincronización con Google Calendar y Microsoft Outlook
- ✅ Tracking automático de lecciones (video, quiz, inactividad)
- ✅ Detección proactiva de sesiones overdue
- ✅ Rebalanceo automático de planes
- ✅ Cron job para cerrar sesiones inactivas

#### 🤖 SofLIA Mejorada

- ✅ Soporte multilingüe (ES, EN, PT) con detección automática
- ✅ Tono profesional sin emojis
- ✅ Comportamiento proactivo en el Study Planner
- ✅ Acciones ejecutables desde el chat (mover, eliminar, crear sesiones)
- ✅ Panel lateral siempre accesible con botón de limpiar conversación
- ✅ Estado vacío dinámico con tips rotativos

#### 🎨 Sistema de Diseño SOFIA

- ✅ Componentes UI consistentes
- ✅ Soporte nativo para modo claro/oscuro
- ✅ Premium Dropdown pattern para menús
- ✅ Theming consistente en todos los paneles

### Diciembre 2024 (v2.0.0)

#### 🆕 Pivote a Modelo B2B

- ✅ Enfoque 100% empresarial
- ✅ Eliminación de funcionalidades B2C
- ✅ Simplificación de roles (Admin, Business, BusinessUser)

#### 🏢 Gestión Avanzada de Empresas

- ✅ Nueva página `/admin/companies/[id]/edit` con 8 secciones
- ✅ Paleta de colores editable con preview en tiempo real
- ✅ Selector de tipografía de marca

#### 🔐 Seguridad Mejorada

- ✅ Tokens SHA-256 determinísticos
- ✅ Middleware de roles mejorado
- ✅ Validación de organización en cada request

---

## ⚠️ Reglas Críticas

| Regla                          | Descripción                                                |
| ------------------------------ | ---------------------------------------------------------- |
| **NO webhooks**                | Siempre usar endpoints REST API                            |
| **Responsive design**          | Mobile-first para todos los componentes                    |
| **Screaming Architecture**     | Organizar por features, no por capas técnicas              |
| **Monorepo workspaces**        | Usar `--workspace=apps/web` para operaciones de paquetes   |
| **Traducciones sincronizadas** | Mantener archivos es/en/pt sincronizados                   |
| **Server Components**          | Usar por defecto; `'use client'` solo cuando sea necesario |

---

---

## 📈 Análisis del Proyecto

### Estadísticas del Código

- **Total de Features**: 22 módulos principales
- **Componentes React**: 900+ componentes
- **Endpoints API**: 350+ rutas
- **Migraciones de BD**: 60+ migraciones
- **Documentos Técnicos**: 78 documentos en `/docs`
- **Idiomas Soportados**: 3 (Español, Inglés, Portugués)
- **Líneas de Código**: ~180,000+ líneas (estimado)

### Arquitectura del Proyecto

#### Frontend (apps/web)

- **Framework**: Next.js 14.2.15 con App Router
- **Componentes**: React 18.3.1 con TypeScript estricto
- **Estado Global**: Zustand 5.0.2
- **Estilos**: Tailwind CSS 3.4.18 (mobile-first)
- **Animaciones**: Framer Motion 12.23.24
- **Visualización**: Nivo Charts, Recharts, Tremor

#### Backend (apps/api)

- **Framework**: Express 4.18.2 con TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth + JWT
- **Seguridad**: Helmet, CORS, Rate Limiting

#### Integraciones

- **IA**: Google Gemini (SofLIA)
- **Calendarios**: Google Calendar, Microsoft Outlook
- **Storage**: Supabase Storage (buckets para archivos)
- **Session Recording**: rrweb para análisis de UX

### Módulos Principales

1. **Admin**: Gestión completa de plataforma
2. **Business Panel**: Panel empresarial con analytics y reportes
3. **Auth**: Autenticación y SSO (Google, Microsoft)
4. **Study Planner**: Planificación con IA y calendario
5. **Communities**: Sistema de comunidades
6. **Courses**: Sistema de cursos y aprendizaje
7. **Certificates**: Generación de certificados PDF con Playwright
8. **Learning Paths**: Rutas de aprendizaje secuenciales
9. **Onboarding**: Flujo de incorporación organizacional
10. **LIA**: Componentes y personalización de SofLIA
11. **SCORM**: Integración SCORM para e-learning
12. **AI Directory**: Directorio de aplicaciones IA
13. **Video Tracking**: Tracking de reproducción de video
14. **Responsive Smoke**: Pruebas de UI responsive
15. **Notifications**: Sistema de notificaciones
16. **Tours**: Onboarding guiado
17. **Skills**: Gestión de habilidades
18. **Profile**: Perfil de usuario
19. **News**: Artículos y noticias
20. **Reels**: Contenido de video corto
21. **Landing**: Landing page
22. **Instructor**: Features de instructor

### Funcionalidades Clave

#### 🎓 Sistema de Aprendizaje

- Cursos estructurados con módulos y lecciones
- Videos con tracking automático de progreso
- Transcripciones estructuradas con timestamps
- Actividades interactivas y quizzes
- Notas personales por lección (con generación desde transcripción)
- Certificados verificables con blockchain

#### 🤖 Inteligencia Artificial

- Asistente SofLIA contextual en toda la plataforma
- Planificación de estudios con IA
- Generación automática de planes personalizados
- Detección proactiva de problemas
- Análisis de progreso y recomendaciones
- Evaluación automática de actividades con rúbricas
- Personalización de comportamiento de SofLIA por usuario

#### 🏢 Gestión Empresarial

- Sistema de jerarquías (Región > Zona > Equipo)
- Chats jerárquicos (horizontales y verticales)
- Branding personalizado (white-label)
- Analytics y reportes avanzados
- Gestión de equipos y asignaciones

#### 📊 Analytics y Reportes

- Dashboard empresarial con KPIs
- Reportes de progreso por equipo/usuario
- Analytics de uso de SofLIA
- Estadísticas de completado de cursos
- Métricas de engagement

### Seguridad

- **Autenticación**: Supabase Auth con SSO (Google, Microsoft)
- **Autorización**: Sistema de roles jerárquico
- **RLS (Row Level Security)**: Políticas en base de datos
- **Validación**: Zod schemas en frontend y backend
- **Sanitización**: DOMPurify para contenido HTML
- **Rate Limiting**: Protección contra abuso de APIs

### Performance

- **Server Components**: Next.js App Router (default)
- **Code Splitting**: Automático por ruta
- **Image Optimization**: Next.js Image component
- **Caching**: SWR para datos del cliente
- **Lazy Loading**: Componentes y rutas bajo demanda

### Escalabilidad

- **Monorepo**: npm workspaces para organización
- **Feature-based**: Arquitectura por dominio
- **Microservicios Ready**: Backend separado
- **Database**: PostgreSQL con índices optimizados
- **Storage**: Supabase Storage escalable

### Testing y Calidad

- **TypeScript**: Tipado estricto en todo el proyecto
- **ESLint**: Linting automático
- **Prettier**: Formateo consistente
- **Validación**: Zod para schemas de datos

### Documentación

- **README Principal**: Este documento
- **Documentación Técnica**: 78 documentos en `/docs`
- **PRD Completo**: Product Requirements Document con 7 secciones
- **Guías de Arquitectura**: Documentación detallada (ARQUITECTURA-COMPLETA.md)
- **Programa de Refactorización**: refactor-program.md con deuda técnica documentada
- **Comentarios en Código**: TypeScript JSDoc

---

**Última actualización**: 15 de Abril 2026  
**Versión**: 2.3.0 (B2B)  
**Mantenedores**: Equipo SofLIA Learning

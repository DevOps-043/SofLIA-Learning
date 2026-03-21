# 📚 Documentación Completa del Proyecto: SofLIA Learning

> **Documento generado para análisis externo del proyecto**
>
> Fecha de generación: 26 de Enero 2026  
> Versión del proyecto: 2.2.1 (B2B)  
> Mantenido por: Equipo SofLIA Learning

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Modelo de Negocio](#2-modelo-de-negocio)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Estructura del Monorepo](#5-estructura-del-monorepo)
6. [Módulos y Features](#6-módulos-y-features)
7. [Base de Datos](#7-base-de-datos)
8. [APIs y Endpoints](#8-apis-y-endpoints)
9. [Integraciones](#9-integraciones)
10. [Sistema de Diseño SOFIA](#10-sistema-de-diseño-sofia)
11. [Seguridad](#11-seguridad)
12. [Internacionalización](#12-internacionalización)
13. [Patrones de Desarrollo](#13-patrones-de-desarrollo)
14. [Flujos de Usuario](#14-flujos-de-usuario)
15. [Configuración y Despliegue](#15-configuración-y-despliegue)
16. [Métricas y KPIs](#16-métricas-y-kpis)
17. [Roadmap y Estado Actual](#17-roadmap-y-estado-actual)
18. [Áreas de Mejora Identificadas](#18-áreas-de-mejora-identificadas)

---

## 1. Resumen Ejecutivo

### 1.1 Descripción del Proyecto

**SofLIA Learning** es una plataforma educativa empresarial B2B completa que combina inteligencia artificial, gestión de aprendizaje y herramientas de colaboración para ofrecer una experiencia de capacitación personalizada y escalable.

El proyecto se enfoca en capacitación corporativa en inteligencia artificial, permitiendo a las organizaciones desarrollar las habilidades de sus equipos con cursos, certificaciones, planificación de estudios con IA y seguimiento de progreso personalizado.

### 1.2 Propuesta de Valor

- ✅ **Aprendizaje Personalizado con IA**: Asistente virtual LIA que se adapta al contexto y necesidades de cada usuario
- ✅ **Gestión Empresarial Completa**: Sistema de jerarquías, equipos, analytics y reportes avanzados
- ✅ **Planificación Inteligente**: Generación automática de planes de estudio con sincronización de calendarios
- ✅ **White-Label**: Personalización completa de marca para organizaciones Enterprise
- ✅ **Certificaciones Verificables**: Sistema de certificados con hash blockchain para verificación pública
- ✅ **Comunidad Integrada**: Sistema de comunidades, chats jerárquicos y colaboración entre equipos
- ✅ **Estándares de e-Learning**: Soporte SCORM para compatibilidad con contenido estándar
- ✅ **Multilingüe**: Soporte nativo para Español, Inglés y Portugués

### 1.3 Estadísticas del Proyecto

| Métrica                 | Valor                          |
| ----------------------- | ------------------------------ |
| **Total de Features**   | 20 módulos principales         |
| **Componentes React**   | 800+ componentes               |
| **Endpoints API**       | 300+ rutas                     |
| **Migraciones de BD**   | 50+ migraciones                |
| **Idiomas Soportados**  | 3 (Español, Inglés, Portugués) |
| **Líneas de Código**    | ~150,000+ líneas (estimado)    |
| **Documentos Técnicos** | 70+ archivos en `/docs`        |

---

## 2. Modelo de Negocio

### 2.1 Enfoque B2B

La plataforma está 100% enfocada en el mercado empresarial (Business-to-Business), ofreciendo soluciones de capacitación corporativa.

### 2.2 Buyer Persona Principal

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

### 2.3 Roles de Usuario

| Rol                      | Descripción                                    | Rutas Principales   |
| ------------------------ | ---------------------------------------------- | ------------------- |
| **Admin (Super Admin)**  | Administrador de la plataforma SofLIA Learning | `/admin/*`          |
| **Business (Admin Org)** | Administrador de una organización cliente      | `/business-panel/*` |
| **BusinessUser**         | Empleado de una organización cliente           | `/business-user/*`  |

### 2.4 Planes de Suscripción

| Plan           | Usuarios   | Características                               |
| -------------- | ---------- | --------------------------------------------- |
| **Team**       | Hasta 10   | Cursos básicos, Reportes                      |
| **Business**   | Hasta 50   | Todos los cursos, Analytics avanzados         |
| **Enterprise** | Ilimitados | White-label, Certificados personalizados, API |

---

## 3. Stack Tecnológico

### 3.1 Frontend

| Tecnología          | Versión       | Uso                            |
| ------------------- | ------------- | ------------------------------ |
| **Next.js**         | 14.2.15       | Framework React con App Router |
| **React**           | 18.3.1        | Biblioteca UI                  |
| **TypeScript**      | 5.3.3 - 5.9.3 | Tipado estático                |
| **Tailwind CSS**    | 3.4.18        | Estilos utility-first          |
| **Framer Motion**   | 12.23.26      | Animaciones                    |
| **Zustand**         | 5.0.2         | Estado global                  |
| **Axios**           | 1.6.7         | Cliente HTTP                   |
| **SWR**             | 2.2.0         | Data fetching                  |
| **Recharts**        | 3.3.0-3.5.0   | Visualización de datos         |
| **Nivo Charts**     | 0.99.0        | Gráficos complejos             |
| **Tremor**          | 3.18.7        | Dashboards de negocios         |
| **FullCalendar**    | 6.1.19        | Calendario del Study Planner   |
| **Radix UI**        | Latest        | Componentes accesibles         |
| **Headless UI**     | 2.2.9         | Componentes sin estilos        |
| **React Hook Form** | 7.65.0        | Manejo de formularios          |
| **Lucide React**    | 0.545.0       | Iconografía                    |
| **i18next**         | 23.12.1       | Internacionalización           |
| **react-i18next**   | 15.1.1        | Bindings React para i18n       |

### 3.2 Backend

| Tecnología             | Versión   | Uso                           |
| ---------------------- | --------- | ----------------------------- |
| **Node.js**            | >= 22.0.0 | Runtime                       |
| **Express**            | 4.18.2    | Framework web                 |
| **TypeScript**         | 5.3.3     | Tipado estático               |
| **Zod**                | 3.25.76   | Validación de esquemas        |
| **Helmet**             | 7.1.0     | Seguridad HTTP                |
| **CORS**               | 2.8.5     | Cross-Origin Resource Sharing |
| **Morgan**             | 1.10.0    | Logging de requests           |
| **Express Rate Limit** | 7.1.5     | Rate limiting                 |
| **Cookie Parser**      | 1.4.6     | Parsing de cookies            |
| **Compression**        | 1.7.4     | Compresión de respuestas      |
| **bcrypt**             | 5.1.1     | Hash de contraseñas           |

### 3.3 Base de Datos e Infraestructura

| Tecnología            | Uso                                     |
| --------------------- | --------------------------------------- |
| **Supabase**          | Base de datos PostgreSQL, Auth, Storage |
| **Supabase Auth**     | Autenticación y gestión de sesiones     |
| **Supabase SSR**      | 0.8.0 - Server-side rendering           |
| **Netlify Functions** | Serverless functions (cron jobs)        |
| **Netlify**           | Hosting del frontend                    |

### 3.4 Integraciones IA

| Tecnología                | Versión | Uso                                 |
| ------------------------- | ------- | ----------------------------------- |
| **OpenAI**                | 6.8.0   | Asistente virtual LIA (GPT-4o-mini) |
| **@google/generative-ai** | 0.24.1  | Integración con Google AI           |

### 3.5 Otras Dependencias Importantes

| Categoría                  | Tecnologías                                    |
| -------------------------- | ---------------------------------------------- |
| **Exportación/Documentos** | jspdf, xlsx, JSZip, html2canvas                |
| **Grabación/Replay**       | rrweb 2.0.0-alpha.18, rrweb-player             |
| **Mapas**                  | Leaflet 1.9.4, react-leaflet 5.0.0             |
| **Fechas**                 | date-fns, moment                               |
| **Validación**             | validator, DOMPurify                           |
| **QR Codes**               | react-qr-code                                  |
| **Utilidades**             | clsx, tailwind-merge, class-variance-authority |

### 3.6 Requisitos del Sistema

- **Node.js**: >= 22.0.0
- **npm**: >= 10.5.1

---

## 4. Arquitectura del Sistema

### 4.1 Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARQUITECTURA SOFLIA LEARNING                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │   FRONTEND      │    │    BACKEND      │    │   DATABASE      │        │
│   │   (Next.js)     │◄──►│   (Express)     │◄──►│   (Supabase)    │        │
│   │   Port: 3000    │    │   Port: 4000    │    │   PostgreSQL    │        │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│           │                      │                      │                   │
│           ▼                      ▼                      ▼                   │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │ Netlify Hosting │    │ Netlify Funcs   │    │ Supabase Auth   │        │
│   │ + Functions     │    │ (Cron Jobs)     │    │ + Storage       │        │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────┐          │
│   │                    SERVICIOS EXTERNOS                        │          │
│   ├─────────────────┬─────────────────┬─────────────────────────┤          │
│   │   OpenAI API    │  Google/MS      │   OAuth Providers       │          │
│   │   (LIA Chat)    │  Calendar API   │   (Google, Microsoft)   │          │
│   └─────────────────┴─────────────────┴─────────────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Screaming Architecture

El proyecto sigue los principios de **Screaming Architecture** propuestos por Robert C. Martin:

> "La arquitectura de un sistema debe gritar sobre los casos de uso del sistema, no sobre los frameworks y herramientas utilizados."

**Organización por Dominio de Negocio (NO por capas técnicas):**

```
✅ CORRECTO - Organización por Features:
src/
├── features/
│   ├── auth/           # ¡Autenticación!
│   ├── courses/        # ¡Sistema de cursos!
│   ├── study-planner/  # ¡Planificación de estudios!
│   └── communities/    # ¡Comunidades!
├── core/
└── shared/

❌ INCORRECTO - Organización técnica:
src/
├── controllers/
├── services/
├── models/
└── views/
```

### 4.3 Reglas de Dependencias

```
┌─────────────┐
│  features/  │  ← Puede importar de core/ y shared/
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    core/    │  ← Puede importar de shared/
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   shared/   │  ← NO puede importar de nadie (infraestructura pura)
└─────────────┘
```

**Reglas:**

1. ❌ `shared/` NO debe importar de `features/` ni `core/`
2. ❌ `core/` NO debe importar de `features/`
3. ✅ `features/` puede importar de `core/` y `shared/`
4. ✅ Features pueden importar entre sí (minimizar)

---

## 5. Estructura del Monorepo

### 5.1 Estructura General

```
Aprende-y-Aplica/
│
├── apps/                           # Aplicaciones principales
│   ├── web/                        # Frontend (Next.js 14)
│   │   ├── src/
│   │   │   ├── app/               # Next.js App Router (510 archivos)
│   │   │   ├── features/          # Features del negocio (539 archivos)
│   │   │   ├── core/              # Lógica transversal (134 archivos)
│   │   │   ├── lib/               # Infraestructura (127 archivos)
│   │   │   ├── shared/            # Componentes compartidos
│   │   │   ├── hooks/             # Hooks globales
│   │   │   ├── components/        # Componentes legacy
│   │   │   └── middleware.ts      # Middleware de autenticación
│   │   └── public/
│   │       └── locales/           # Archivos de traducción (es, en, pt)
│   │
│   └── api/                        # Backend (Express) - 11 archivos
│       └── src/
│           ├── features/          # Endpoints por dominio
│           └── core/              # Middleware y config
│
├── packages/                       # Paquetes compartidos
│   ├── shared/                    # @aprende-y-aplica/shared (7 archivos)
│   └── ui/                        # @aprende-y-aplica/ui (12 archivos)
│
├── netlify/                        # Funciones serverless
│   └── functions/                 # Cron jobs y background functions
│
├── supabase/                       # Configuración de base de datos
│   ├── config.toml                # Configuración de Supabase
│   └── migrations/                # 50 migraciones SQL
│
├── docs/                           # Documentación (70 archivos)
│
├── scripts/                        # Scripts de utilidad (9 archivos)
│
└── package.json                    # Configuración del monorepo
```

### 5.2 Estructura del Frontend (apps/web/src/)

| Directorio  | Propósito                                                        | Archivos |
| ----------- | ---------------------------------------------------------------- | -------- |
| `app/`      | Next.js App Router (Server Components por defecto)               | 510      |
| `features/` | Features de dominio (auto-contenidos, screaming architecture)    | 539      |
| `core/`     | Lógica transversal: stores (Zustand), providers, services/api.ts | 134      |
| `lib/`      | Infraestructura: supabase/, openai/, lia/, schemas/, oauth/      | 127      |
| `shared/`   | Infraestructura pura: hooks genéricos, utilidades                | 5        |

### 5.3 Path Aliases

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

## 6. Módulos y Features

### 6.1 Lista de Features (20 módulos)

| Feature             | Archivos | Descripción                    |
| ------------------- | -------- | ------------------------------ |
| **admin/**          | 153      | Gestión completa de plataforma |
| **business-panel/** | 90       | Panel empresarial (admin org)  |
| **auth/**           | 59       | Autenticación y SSO            |
| **communities/**    | 45       | Sistema de comunidades         |
| **study-planner/**  | 37       | Planificación con IA           |
| **instructor/**     | 35       | Features de instructor         |
| **landing/**        | 27       | Landing page                   |
| **ai-directory/**   | 19       | Directorio de IA               |
| **courses/**        | 17       | Gestión de cursos              |
| **tours/**          | 16       | Onboarding guiado              |
| **skills/**         | 7        | Gestión de habilidades         |
| **reels/**          | 7        | Contenido de video corto       |
| **notifications/**  | 6        | Sistema de notificaciones      |
| **scorm/**          | 6        | Integración SCORM              |
| **profile/**        | 4        | Perfil de usuario              |
| **subscriptions/**  | 4        | Gestión de suscripciones       |
| **video-tracking/** | 3        | Tracking de video              |
| **news/**           | 2        | Artículos y noticias           |
| **purchases/**      | 1        | Historial de compras           |
| **lia/**            | 1        | Hooks del asistente LIA        |

### 6.2 Estructura de un Feature

Cada feature sigue este patrón:

```
features/[feature-name]/
├── components/     # Componentes específicos del feature
│   ├── ComponentA/
│   │   ├── index.ts
│   │   ├── ComponentA.tsx
│   │   ├── SubComponent.tsx
│   │   └── hooks/
│   │       └── useComponentLogic.ts
│   └── ComponentB.tsx
├── hooks/          # Hooks específicos del feature
├── services/       # Servicios específicos (API calls)
├── types.ts        # Tipos TypeScript
└── index.ts        # Barrel exports
```

### 6.3 Módulos Principales - Descripción Detallada

#### 🛡️ Admin (153 archivos)

- Gestión de empresas/organizaciones
- Gestión de usuarios de plataforma
- Gestión de cursos y contenido
- Workshops y eventos
- Comunidades y moderación
- Directorio de prompts y apps IA
- Noticias y artículos
- Estadísticas de plataforma
- Panel de analytics de LIA
- Sistema de reportes

#### 🏢 Business Panel (90 archivos)

- Dashboard empresarial
- Gestión de empleados
- Gestión de equipos
- Cursos asignados
- Analytics de la organización
- Progreso general
- Reportes empresariales
- Configuración y branding
- Gestión de suscripción
- Sistema de jerarquías (Región > Zona > Equipo)
- Chats jerárquicos

#### 🔐 Auth (59 archivos)

- Login/Registro por organización
- SSO con Google y Microsoft
- Recuperación de contraseña
- Sistema de invitaciones
- Gestión de tokens JWT
- Middleware de autenticación

#### 📅 Study Planner (37 archivos)

- Creación de planes con IA
- Dashboard del plan activo
- Sesiones de estudio
- Sincronización con Google/Microsoft Calendar
- Tracking de lecciones
- Chat con LIA contextual
- Detección de sesiones overdue
- Rebalanceo automático

#### 📚 Courses (17 archivos)

- Catálogo de cursos
- Experiencia de aprendizaje (`/[slug]/learn`)
- Progreso por módulo y lección
- Videos con tracking automático
- Actividades interactivas
- Notas personales
- Sistema de Q&A por curso

---

## 7. Base de Datos

### 7.1 Información General

- **Motor**: PostgreSQL (via Supabase)
- **Migraciones**: 50+ archivos SQL
- **Seguridad**: Row Level Security (RLS) en todas las tablas
- **Tipos**: Generados automáticamente en `lib/supabase/types.ts`

### 7.2 Tablas Principales

#### Usuarios y Organizaciones

| Tabla                      | Descripción                                   |
| -------------------------- | --------------------------------------------- |
| `users`                    | Usuarios del sistema (linking con auth.users) |
| `organizations`            | Organizaciones/empresas con branding          |
| `organization_users`       | Relación usuarios-organizaciones (multi-org)  |
| `organization_invitations` | Invitaciones pendientes                       |
| `oauth_accounts`           | Cuentas OAuth vinculadas                      |

#### Jerarquía Organizacional

| Tabla                     | Descripción                                   |
| ------------------------- | --------------------------------------------- |
| `organization_regions`    | Regiones de la organización (nivel 1)         |
| `organization_zones`      | Zonas dentro de regiones (nivel 2)            |
| `organization_teams`      | Equipos dentro de zonas (nivel 3)             |
| `hierarchy_chats`         | Chats jerárquicos (horizontales y verticales) |
| `hierarchy_chat_messages` | Mensajes de chats jerárquicos                 |

#### Cursos y Aprendizaje

| Tabla                       | Descripción                          |
| --------------------------- | ------------------------------------ |
| `courses`                   | Catálogo de cursos                   |
| `course_modules`            | Módulos dentro de cursos             |
| `course_lessons`            | Lecciones individuales               |
| `lesson_activities`         | Actividades interactivas por lección |
| `lesson_materials`          | Materiales descargables              |
| `lesson_checkpoints`        | Checkpoints en videos                |
| `user_lesson_progress`      | Progreso por lección                 |
| `lesson_tracking`           | Tracking en tiempo real              |
| `course_reviews`            | Reseñas de cursos                    |
| `course_questions`          | Preguntas en cursos                  |
| `course_question_responses` | Respuestas a preguntas               |

#### Planificación de Estudios

| Tabla                   | Descripción                         |
| ----------------------- | ----------------------------------- |
| `study_plans`           | Planes de estudio creados con IA    |
| `study_sessions`        | Sesiones individuales programadas   |
| `study_preferences`     | Preferencias de estudio del usuario |
| `calendar_integrations` | Conexión con calendarios externos   |
| `calendar_sync_history` | Historial de sincronizaciones       |
| `daily_progress`        | Progreso diario                     |

#### LIA (Asistente Virtual)

| Tabla                      | Descripción                 |
| -------------------------- | --------------------------- |
| `lia_conversations`        | Historial de conversaciones |
| `lia_messages`             | Mensajes individuales       |
| `lia_user_feedback`        | Feedback de usuarios        |
| `lia_activity_completions` | Completado de actividades   |
| `lia_common_questions`     | Preguntas frecuentes        |

#### Certificados y Habilidades

| Tabla                      | Descripción                         |
| -------------------------- | ----------------------------------- |
| `user_course_certificates` | Certificados emitidos               |
| `certificate_ledger`       | Registro blockchain de certificados |
| `certificate_templates`    | Templates por organización          |
| `skills`                   | Catálogo de habilidades             |
| `user_skills`              | Habilidades por usuario             |

#### Otros

| Tabla                   | Descripción                     |
| ----------------------- | ------------------------------- |
| `comunidades`           | Comunidades de aprendizaje      |
| `comunidad_posts`       | Posts en comunidades            |
| `comunidad_comentarios` | Comentarios en posts            |
| `user_notifications`    | Notificaciones de usuario       |
| `notification_settings` | Configuración de notificaciones |
| `ai_moderation_logs`    | Logs de moderación con IA       |
| `audit_logs`            | Logs de auditoría               |
| `transactions`          | Transacciones                   |
| `payment_methods`       | Métodos de pago                 |

### 7.3 Características de la Base de Datos

- **RLS (Row Level Security)**: Políticas de acceso a nivel de fila
- **Triggers Automáticos**: Actualización de progreso, desbloqueo de módulos
- **Índices Optimizados**: Para consultas frecuentes
- **JSONB**: Para configuraciones flexibles y metadata
- **Full-Text Search**: Búsqueda en contenido

---

## 8. APIs y Endpoints

### 8.1 Rutas de Autenticación

```
POST   /api/auth/login                  # Inicio de sesión
POST   /api/auth/register               # Registro
POST   /api/auth/logout                 # Cerrar sesión
POST   /api/auth/refresh                # Refrescar token
GET    /api/auth/me                     # Usuario actual
```

### 8.2 Panel de Administración

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

### 8.3 Business Panel

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

### 8.4 Cursos y Aprendizaje

```
GET    /api/courses                     # Listar cursos
GET    /api/courses/:slug               # Detalle de curso
GET    /api/courses/:slug/learn-data    # Datos para aprendizaje
PUT    /api/courses/:slug/lessons/:id/progress # Actualizar progreso
```

### 8.5 Study Planner

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

# Chat con LIA
POST   /api/study-planner/dashboard/chat # Chat contextual
```

### 8.6 Asistente LIA

```
POST   /api/ai-chat                     # Chat con LIA
POST   /api/ai-directory/generate-prompt # Generar prompt
POST   /api/lia/context-help            # Ayuda contextual
```

### 8.7 Certificados

```
GET    /api/certificates                # Mis certificados
POST   /api/certificates/generate       # Generar certificado
GET    /api/certificates/verify/:hash   # Verificar certificado (público)
```

---

## 9. Integraciones

### 9.1 OpenAI (LIA - Asistente Virtual)

- **Modelo**: GPT-4o-mini
- **Configuración**:
  - `CHATBOT_MODEL`: Modelo a usar
  - `CHATBOT_MAX_TOKENS`: Tokens máximos (700)
  - `CHATBOT_TEMPERATURE`: Temperatura (0.6)

- **Características**:
  - Chat contextual según sección del usuario
  - Multilingüe (ES, EN, PT) con detección automática
  - Historial de conversaciones persistente
  - Acciones ejecutables (mover/eliminar/crear sesiones)
  - Tono profesional sin emojis

- **Contextos de LIA**:
  ```
  📚 Curso/Lección     → Responde dudas sobre el contenido
  📅 Study Planner     → Gestiona sesiones, detecta atrasos
  🏠 Dashboard         → Orientación general, navegación
  ⚙️ Configuración     → Ayuda con ajustes de cuenta
  🔍 General           → Asistencia general de la plataforma
  ```

### 9.2 Calendarios (Google/Microsoft)

- **Google Calendar**: OAuth 2.0 integration
- **Microsoft Outlook**: OAuth 2.0 integration
- **Funcionalidades**:
  - Creación automática de eventos
  - Calendario secundario "Aprende y Aplica"
  - Sincronización bidireccional
  - Detección de conflictos

### 9.3 OAuth Providers

- **Google**: Login con Google
- **Microsoft**: Login con Microsoft
- **Flujo**: Registro/login con asignación automática de organización

### 9.4 SCORM

- **Versiones soportadas**: SCORM 1.2 y 2004
- **Componentes**:
  - Parser de paquetes SCORM
  - Session cache
  - Sanitización de contenido
  - Tracking de progreso

---

## 10. Sistema de Diseño SofLIA

### 10.1 Descripción

**SofLIA** (Sistema Original de Funcionalidad e Interfaz Avanzada) es el sistema de diseño de la plataforma.

### 10.2 Paleta de Colores

#### Colores Principales

| Color             | Hex       | Uso                                               |
| ----------------- | --------- | ------------------------------------------------- |
| **Azul Profundo** | `#0A2540` | Fondos header, botones primarios, navegación      |
| **Aqua**          | `#00D4B3` | Acentos, estados activos, barras de progreso, LIA |
| **Blanco**        | `#FFFFFF` | Fondos de tarjetas, textos sobre fondos oscuros   |

#### Colores Secundarios

| Color           | Hex       | Uso                                       |
| --------------- | --------- | ----------------------------------------- |
| **Verde Suave** | `#10B981` | Estados de éxito, completado, logros      |
| **Ámbar**       | `#F59E0B` | Alertas, notificaciones, advertencias     |
| **Gris Claro**  | `#E9ECEF` | Fondos secundarios, separadores           |
| **Gris Medio**  | `#6C757D` | Textos secundarios, iconos deshabilitados |

#### Modo Oscuro

| Color                | Hex       | Uso                       |
| -------------------- | --------- | ------------------------- |
| **Fondo Principal**  | `#0F1419` | Fondo principal de la app |
| **Fondo Secundario** | `#1E2329` | Tarjetas y modales        |
| **Fondo Terciario**  | `#0A0D12` | Elementos anidados        |

### 10.3 Tipografía

- **Familia Principal**: Inter (sans-serif moderna)
- **Escala**:
  - H1: 40px, Bold (700)
  - H2: 28px, Semibold (600)
  - Subtítulo: 20px, Medium (500)
  - Body: 16px, Regular (400)
  - Body Small: 14px, Regular (400)
  - UI: 14px, Medium (500)
  - UI Small: 12px, Medium (500)

### 10.4 Componentes UI

| Categoría        | Componentes                                      |
| ---------------- | ------------------------------------------------ |
| **Layout**       | Container, Grid, Flex, Spacer                    |
| **Forms**        | Input, Select, Checkbox, Radio, Switch, Textarea |
| **Feedback**     | Alert, Toast, Badge, Progress, Skeleton          |
| **Navigation**   | Navbar, Sidebar, Tabs, Breadcrumb, Pagination    |
| **Overlays**     | Modal, Dropdown, Tooltip, Popover, Sheet         |
| **Data Display** | Card, Table, Avatar, List, Accordion             |

### 10.5 Patrones de Diseño

#### Split Panel Modal

- Modales con dos columnas
- Panel izquierdo: Preview animado (320px)
- Panel derecho: Formulario
- Uso: Formularios de creación/edición

#### Premium Dropdown

- Selectores personalizados
- Diseño oscuro consistente
- Animaciones con Framer Motion
- Indicador visual de selección

### 10.6 Principios de Diseño

1. **Siempre Explicable**: El sistema explica por qué recomienda algo
2. **Datos Primero, Ruido Mínimo**: Mostrar lo esencial de un vistazo
3. **No Abrumar con Visualizaciones**: Gráficos simples y enfocados
4. **Un Solo Foco por Pantalla**: Una acción principal clara
5. **Lenguaje y Visual Alineados**: Coherencia entre texto e interfaz
6. **Personalización Visible**: Experiencia percibida como personalizada
7. **Consistencia ante Todo**: Patrones repetibles

---

## 11. Seguridad

### 11.1 Autenticación

- **Supabase Auth**: Manejo de sesiones
- **JWT**: Tokens con fingerprint de dispositivo
- **TTL**: 24 horas deslizante
- **bcrypt**: Hash de contraseñas (12+ rounds)

### 11.2 Autorización

- **Roles**: Admin, Business, BusinessUser
- **Middleware**: Validación en cada request
- **RLS**: Row Level Security en base de datos

### 11.3 Protecciones

| Protección         | Implementación                        |
| ------------------ | ------------------------------------- |
| **CSP**            | Content Security Policy con Helmet.js |
| **CORS**           | Configurado para dominios específicos |
| **Rate Limiting**  | 1000 requests/hora por usuario        |
| **Sanitización**   | DOMPurify para contenido HTML         |
| **Validación**     | Zod schemas en frontend y backend     |
| **XSS Prevention** | Headers de seguridad                  |
| **HTTPS**          | Forzado en producción                 |

### 11.4 Moderación de Contenido

- **AI Moderation**: Moderación automática con IA
- **Forbidden Words**: Lista de palabras prohibidas
- **Audit Logs**: Registro de acciones administrativas

---

## 12. Internacionalización

### 12.1 Idiomas Soportados

- **Español** (default): `es`
- **Inglés**: `en`
- **Portugués**: `pt`

### 12.2 Implementación

- **Librería**: next-i18next + react-i18next
- **Archivos**: `apps/web/public/locales/{es,en,pt}/common.json`
- **Provider**: `I18nProvider` en layout raíz

### 12.3 Uso en Código

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  return <h1>{t('welcome.title')}</h1>;
}
```

```typescript
import { useLanguage } from "@/core/i18n/I18nProvider";

function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();
  // language: 'es' | 'en' | 'pt'
}
```

### 12.4 LIA y Multilingüe

LIA detecta automáticamente el idioma del usuario y responde en ese idioma.

---

## 13. Patrones de Desarrollo

### 13.1 Convenciones de Código

| Elemento            | Convención                      |
| ------------------- | ------------------------------- |
| Archivos            | kebab-case (`user-profile.tsx`) |
| Componentes         | PascalCase (`UserProfile`)      |
| Variables/funciones | camelCase                       |
| Constantes          | UPPER_SNAKE_CASE                |

### 13.2 Componentes

#### Reglas Generales

- Use Server Components por defecto
- `'use client'` solo cuando sea necesario
- Un componente = una responsabilidad
- Refactorizar componentes > 300 líneas

#### Arquitectura Modular

```
features/business-panel/components/hierarchy/HierarchyChat/
├── index.ts                    # Barrel exports
├── types.ts                    # Tipos compartidos
├── HierarchyChat.tsx          # Componente principal (orquestador)
├── ChatHeader.tsx             # Sub-componente: Header
├── ChatMessages.tsx           # Sub-componente: Lista de mensajes
├── ChatMessage.tsx            # Sub-componente: Mensaje individual
├── ChatInput.tsx              # Sub-componente: Área de input
├── EmojiPicker.tsx            # Sub-componente: Selector de emojis
├── FilePreview.tsx            # Sub-componente: Preview de archivos
├── ImageModal.tsx             # Sub-componente: Modal de imágenes
└── hooks/
    └── useChatLogic.ts        # Hook con lógica de negocio
```

### 13.3 Hooks Personalizados

Extraer lógica cuando:

- 5+ useState
- Múltiples useEffect
- Lógica de negocio mezclada con UI

```typescript
// hooks/useFeatureLogic.ts
export const useFeatureLogic = (props) => {
  const [state, setState] = useState();

  const handleAction = () => {
    /* ... */
  };

  return {
    state,
    handleAction,
  };
};
```

### 13.4 Estilos

- **Tailwind CSS**: Preferido para estilos
- **cn()**: Para merging de clases
- **Inline styles**: Solo para colores dinámicos
- **CSS Variables**: Para colores de marca
- **Mobile-first**: Diseño responsivo

### 13.5 TypeScript

- **Strict mode**: Habilitado
- **No `any`**: Preferir `unknown`
- **Interfaces**: Para todos los props y estructuras

---

## 14. Flujos de Usuario

### 14.1 Flujo de Autenticación

```
1. Usuario accede a /auth/[slug] (login por organización)
2. Se validan credenciales contra Supabase Auth
3. Se genera JWT con rol y organization_id
4. Middleware valida rol en cada request
5. Redirección automática al panel correspondiente:
   - Admin → /admin/*
   - Business → /business-panel/*
   - BusinessUser → /business-user/*
```

### 14.2 Flujo del Study Planner

```
┌─────────────────────────────────────────────────────────────────────┐
│                    1. CREACIÓN DEL PLAN                              │
│  Usuario → Selecciona Curso → Configura Preferencias → LIA genera   │
│  plan → Se guardan sesiones → Sync con calendario externo           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    2. DASHBOARD                                      │
│  - Vista calendario con sesiones programadas                         │
│  - LIA analiza proactivamente: sesiones overdue, conflictos         │
│  - Usuario puede mover/eliminar/crear sesiones                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 3. EJECUCIÓN DE SESIÓN                               │
│  Usuario → Entra al curso → Tracking inicia → Video + LIA →         │
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

### 14.3 Tracking de Lecciones

| Evento           | Trigger                    | Acción                     |
| ---------------- | -------------------------- | -------------------------- |
| `video_play`     | Usuario reproduce video    | Inicia tracking            |
| `video_ended`    | Video termina              | Registra evento            |
| `lia_message`    | Usuario interactúa con LIA | Extiende actividad         |
| `activity`       | Scroll, clic, etc.         | Actualiza última actividad |
| `quiz_submitted` | Quiz completado            | Auto-completa lección      |
| `inactivity_5m`  | 5 min sin actividad        | Auto-completa lección      |

---

## 15. Configuración y Despliegue

### 15.1 Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# OpenAI (para LIA)
OPENAI_API_KEY=tu_openai_api_key
CHATBOT_MODEL=gpt-4o-mini
CHATBOT_MAX_TOKENS=700
CHATBOT_TEMPERATURE=0.6

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

### 15.2 Scripts de Desarrollo

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
npm run <cmd> --workspace=apps/web       # Comando específico
```

### 15.3 Despliegue

- **Frontend**: Netlify (con funciones serverless)
- **Backend**: Netlify Functions
- **Base de Datos**: Supabase (PostgreSQL)
- **CI/CD**: GitHub Actions (sugerido)

---

## 16. Métricas y KPIs

### 16.1 Métricas de Producto

| Métrica                          | Objetivo              |
| -------------------------------- | --------------------- |
| **MAU (Monthly Active Users)**   | 5,000 en 6 meses      |
| **Tasa de Completado de Cursos** | 70%+                  |
| **Engagement Diario**            | 45 minutos por sesión |
| **Net Promoter Score (NPS)**     | 50+                   |

### 16.2 Métricas Técnicas

| Métrica                     | Objetivo                          |
| --------------------------- | --------------------------------- |
| **Uptime**                  | 99.9% (máximo 8.77h downtime/año) |
| **Tiempo de Respuesta API** | P95 < 500ms                       |
| **Tiempo de Carga Inicial** | < 3s en 3G                        |
| **Tasa de Error**           | < 0.1%                            |

### 16.3 Métricas de Negocio

| Métrica                      | Objetivo       |
| ---------------------------- | -------------- |
| **Costo por Usuario Activo** | < $5/mes       |
| **Retención a 30 días**      | > 60%          |
| **Satisfacción de Usuario**  | > 4.5/5        |
| **Certificados Emitidos**    | 500 en 6 meses |

---

## 17. Roadmap y Estado Actual

### 17.1 Versión Actual: 2.2.1 (Enero 2026)

#### Funcionalidades Completadas ✅

**LIA - Asistente Virtual**

- ✅ Historial de conversaciones persistente
- ✅ Edición de títulos de conversaciones
- ✅ Contexto separado (general, Study Planner, curso)
- ✅ Visibilidad de enlaces en Dark Mode

**Panel de Administración**

- ✅ AdminEditCompanyModal rediseñado (Split Panel Modal)
- ✅ Gestión de empresas mejorada
- ✅ LIA Analytics Panel

**Autenticación**

- ✅ Flujo SSO corregido
- ✅ Sistema de invitaciones mejorado
- ✅ Eliminación en cascada de usuarios

**UI/UX**

- ✅ Headers premium en Business Panel
- ✅ Responsividad completa
- ✅ Soporte Light/Dark mode

### 17.2 Funcionalidades en Desarrollo 🔄

- 🔄 Sistema de generación de contenido (Phases 5-6)
- 🔄 Mejoras en producción visual de slides
- 🔄 Integración con Gamma API (exploración)

### 17.3 Roadmap Futuro 📋

**Corto plazo (Q1 2026)**

- Notificaciones push
- Gamificación y badges
- Recomendaciones avanzadas con IA

**Mediano plazo (Q2 2026)**

- Aplicaciones móviles nativas
- Modo offline
- Integraciones empresariales adicionales

**Largo plazo (2026+)**

- Marketplace de cursos
- Sistema de pagos integrado
- Expansión internacional

---

## 18. Áreas de Mejora Identificadas

### 18.1 Arquitectura y Código

| Área                     | Estado Actual  | Mejora Sugerida                         |
| ------------------------ | -------------- | --------------------------------------- |
| **Testing**              | Mínimo         | Implementar tests unitarios y E2E       |
| **CI/CD**                | Básico         | Pipeline completo con GitHub Actions    |
| **Monitoreo**            | Básico         | Grafana, Sentry, APM                    |
| **Documentación de API** | Parcial        | Swagger/OpenAPI completo                |
| **Backend**              | Express básico | Migración a serverless o microservicios |

### 18.2 Performance

| Área              | Mejora Sugerida                         |
| ----------------- | --------------------------------------- |
| **Bundle Size**   | Análisis y optimización de dependencias |
| **Lazy Loading**  | Más agresivo en rutas y componentes     |
| **Caching**       | Implementar caching de API más robusto  |
| **CDN**           | Optimizar assets estáticos              |
| **Base de Datos** | Más índices, query optimization         |

### 18.3 Seguridad

| Área                    | Mejora Sugerida                              |
| ----------------------- | -------------------------------------------- |
| **Penetration Testing** | Auditoría de seguridad externa               |
| **Dependency Scanning** | Actualización automática de deps vulnerables |
| **Secrets Management**  | Vault o similar                              |
| **2FA**                 | Autenticación de dos factores                |

### 18.4 UX/UI

| Área              | Mejora Sugerida              |
| ----------------- | ---------------------------- |
| **Accesibilidad** | Auditoría WCAG completa      |
| **PWA**           | Mejorar experiencia offline  |
| **Onboarding**    | Tours más interactivos       |
| **Analytics UX**  | Heatmaps, session recordings |

### 18.5 Escalabilidad

| Área              | Mejora Sugerida                          |
| ----------------- | ---------------------------------------- |
| **Multi-tenancy** | Mejorar aislamiento entre organizaciones |
| **Geografía**     | CDN global, edge functions               |
| **Database**      | Read replicas, sharding futuro           |
| **Queue System**  | Implementar para tareas pesadas          |

---

## 📋 Apéndices

### Apéndice A: Documentos de Referencia

| Documento                  | Ubicación | Descripción                           |
| -------------------------- | --------- | ------------------------------------- |
| `README.md`                | `/`       | Documentación principal               |
| `CLAUDE.md`                | `/`       | Guía de desarrollo para AI assistants |
| `ARQUITECTURA-COMPLETA.md` | `/docs`   | Arquitectura detallada                |
| `PRD_MASTER.md`            | `/docs`   | Product Requirements Document         |
| `SOFIA_DESIGN_SYSTEM.md`   | `/docs`   | Sistema de diseño                     |
| `AGENTES_LIA.md`           | `/docs`   | Documentación de agentes LIA          |
| `STUDY-PLANNER-FLOW.md`    | `/docs`   | Flujo del planificador                |
| `SCORM-IMPLEMENTACION.md`  | `/docs`   | Guía de implementación SCORM          |

### Apéndice B: URLs de Desarrollo

| Servicio     | URL                          |
| ------------ | ---------------------------- |
| Frontend     | http://localhost:3000        |
| Backend API  | http://localhost:4000/api/v1 |
| Health Check | http://localhost:4000/health |

### Apéndice C: Estructura de Rutas Principales

```
📁 /                          # Landing page pública
📁 /auth                      # Autenticación
├── /[slug]                   # Login por organización
├── /[slug]/register          # Registro por organización
└── /forgot-password          # Recuperación de contraseña

📁 /admin                     # Panel Super Admin
├── /dashboard                # Dashboard principal
├── /companies                # Gestión de empresas
├── /users                    # Gestión de usuarios
├── /workshops               # Gestión de workshops
├── /communities             # Gestión de comunidades
├── /statistics              # Estadísticas de plataforma
└── /lia-analytics           # Analytics del asistente LIA

📁 /business-panel           # Panel Admin de Organización
├── /dashboard               # Dashboard empresarial
├── /users                   # Gestión de empleados
├── /teams                   # Gestión de equipos
├── /courses                 # Cursos asignados
├── /analytics               # Analytics de la org
└── /settings                # Configuración y branding

📁 /business-user            # Dashboard Empleado
├── /dashboard               # Dashboard personal
│   ├── /courses             # Mis cursos
│   ├── /calendar            # Mi calendario
│   └── /certificates        # Mis certificados
└── /teams                   # Mis equipos

📁 /courses                  # Visualización de cursos
└── /[slug]/learn            # Experiencia de aprendizaje

📁 /study-planner            # Planificador de estudio
├── /create                  # Crear nuevo plan
└── /dashboard               # Dashboard del plan activo
```

---

**Documento generado automáticamente para análisis del proyecto Aprende y Aplica**  
**Última actualización**: 26 de Enero 2026

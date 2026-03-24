# 📐 Guía de Arquitectura Completa - SofLIA Learning

> **Documento de Referencia para la Arquitectura del Proyecto SofLIA Learning (Chat-Bot-LIA)**
>
> Versión: 2.0.0  
> Última actualización: Diciembre 2024  
> Mantenido por: Equipo SofLIA Learning

---

## 📑 Tabla de Contenidos

1. [Introducción y Visión General](#1-introducción-y-visión-general)
2. [Screaming Architecture](#2-screaming-architecture)
3. [Frontend (Next.js)](#3-frontend-nextjs)
4. [Backend (Express + TypeScript)](#4-backend-express--typescript)
5. [Packages Compartidos](#5-packages-compartidos)
6. [Sistema de Diseño](#6-sistema-de-diseño)
7. [Patrones de Diseño](#7-patrones-de-diseño)
8. [Integración Frontend-Backend](#8-integración-frontend-backend)
9. [Configuración del Proyecto](#9-configuración-del-proyecto)
10. [Desarrollo Local](#10-desarrollo-local)
11. [Diseño Responsivo](#11-diseño-responsivo)
12. [Configuración de Despliegue](#12-configuración-de-despliegue)
13. [Buenas Prácticas](#13-buenas-prácticas)
14. [Módulos de Páginas Ejemplo](#14-módulos-de-páginas-ejemplo)
15. [Checklist de Migración](#15-checklist-de-migración)

---

## 1. Introducción y Visión General

### 1.1 ¿Qué es SofLIA Learning?

SofLIA Learning es una **plataforma educativa con IA integrada (Chat-Bot-LIA)** construida con tecnologías modernas. El proyecto implementa las mejores prácticas de arquitectura de software, diseño de interfaces y experiencia de usuario para ofrecer una experiencia de aprendizaje personalizada.

**Características principales:**

- ✅ Monorepo con npm workspaces
- ✅ Frontend moderno con Next.js 16 y React 18
- ✅ Backend robusto con Express y TypeScript
- ✅ Sistema de diseño completo con TailwindCSS
- ✅ Arquitectura escalable y mantenible
- ✅ Autenticación con Supabase (JWT + SSO Microsoft/Google)
- ✅ Integración con IA (Google Gemini + OpenAI)
- ✅ Componentes reutilizables y animados
- ✅ Sistema de planificación de estudios con LIA
- ✅ Visualización de datos con Nivo y Recharts

### 1.2 Stack Tecnológico Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SOFLIA LEARNING - STACK (Diciembre 2024)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FRONTEND (apps/web)              BACKEND (apps/api)                        │
│  ├─ Next.js 16.0.7               ├─ Express 4.18.2                         │
│  ├─ React 18.3.1                 ├─ Node.js 22+ (mínimo requerido)         │
│  ├─ TypeScript 5.9.3             ├─ TypeScript 5.3.3                       │
│  ├─ TailwindCSS 3.4.18           ├─ Zod 3.25.76                            │
│  ├─ Zustand 5.0.2                ├─ Supabase JS 2.76.1                     │
│  ├─ Axios 1.6.7                  ├─ Helmet 7.1.0                           │
│  ├─ Framer Motion 12.23.24       ├─ Morgan 1.10.0                          │
│  ├─ Lucide React 0.545.0         ├─ CORS 2.8.5                             │
│  ├─ Radix UI (múltiples)         ├─ Dotenv 16.4.1                          │
│  ├─ React Hook Form 7.65.0       ├─ Express Rate Limit 7.1.5               │
│  ├─ SWR 2.2.0                    ├─ Cookie Parser 1.4.6                    │
│  ├─ Headless UI 2.2.9            ├─ Compression 1.7.4                      │
│  ├─ React Three Fiber 9.4.0      └─ UUID 9.0.1                             │
│  ├─ GSAP 3.13.0                                                            │
│  └─ Three.js 0.181.2             INTEGRACIONES IA                          │
│                                   ├─ @google/generative-ai 0.24.1          │
│  VISUALIZACIÓN                    └─ OpenAI 6.8.0                          │
│  ├─ Nivo (charts) 0.99.0                                                   │
│  ├─ Recharts 3.3.0/3.5.0         AUTENTICACIÓN                             │
│  ├─ Tremor React 3.18.7          ├─ Supabase SSR 0.8.0                     │
│  └─ FullCalendar 6.1.19          ├─ Supabase JS 2.76.0                     │
│                                   ├─ bcryptjs 3.0.2 (frontend)             │
│  SHARED PACKAGES                  └─ bcrypt 5.1.1 (backend)                │
│  ├─ @aprende-y-aplica/shared                                               │
│  └─ @aprende-y-aplica/ui         TOOLS                                     │
│                                   ├─ npm workspaces                        │
│  UI COMPONENTS                    ├─ Concurrently 8.2.2                    │
│  ├─ class-variance-authority     ├─ tsx 4.6.2 / 4.20.6                    │
│  ├─ clsx 2.1.0                   ├─ ESLint 8.56.0 / 9.0.0                 │
│  └─ tailwind-merge 2.2.0         └─ Prettier 3.2.5                         │
│                                                                             │
│  UTILIDADES ADICIONALES          EXPORTACIÓN/DOCUMENTOS                    │
│  ├─ date-fns 3.6.0               ├─ jspdf 3.0.3                            │
│  ├─ moment 2.30.1                ├─ xlsx 0.18.5                            │
│  ├─ DOMPurify 3.3.0              ├─ JSZip 3.10.1                           │
│  ├─ validator 13.15.0            └─ html2canvas 1.4.1                      │
│  ├─ i18next 23.12.1                                                        │
│  └─ react-i18next 15.1.1         GRABACIÓN/REPLAY                          │
│                                   ├─ rrweb 2.0.0-alpha.18                  │
│                                   └─ rrweb-player 2.0.0-alpha.18           │
└─────────────────────────────────────────────────────────────────────────────┘

REQUISITOS DEL SISTEMA:
├─ Node.js >= 22.0.0
└─ npm >= 10.5.1
```

### 1.3 Arquitectura de Alto Nivel (Monorepo)

```
SofLIA-Learning/
│
├── apps/                      # Aplicaciones principales
│   ├── web/                  # Frontend (Next.js 16)
│   │   ├── src/
│   │   │   ├── app/         # Next.js App Router
│   │   │   ├── features/    # Features del negocio
│   │   │   ├── shared/      # Componentes compartidos
│   │   │   ├── core/        # Servicios y stores
│   │   │   └── lib/         # Utilidades y servicios
│   │   ├── public/          # Assets estáticos
│   │   └── package.json
│   │
│   └── api/                  # Backend (Express)
│       ├── src/
│       │   ├── features/    # Features del negocio
│       │   ├── core/        # Middleware y config
│       │   ├── shared/      # Tipos y constantes
│       │   └── index.ts     # Entry point
│       └── package.json
│
├── packages/                 # Paquetes compartidos
│   ├── shared/              # @aprende-y-aplica/shared
│   └── ui/                  # @aprende-y-aplica/ui
│
├── Nueva carpeta/           # Documentación de Arquitectura
│
└── package.json            # Configuración del monorepo
```

### 1.4 Principios de Diseño

**1. Screaming Architecture**

- La estructura "grita" sobre el dominio del negocio, no sobre frameworks
- Organización por features, no por tipos técnicos

**2. Separation of Concerns**

- Frontend y backend completamente separados
- Comunicación vía API REST
- Tipos compartidos entre ambos

**3. DRY (Don't Repeat Yourself)**

- Código compartido en packages
- Componentes reutilizables
- Utilidades centralizadas

**4. SOLID Principles**

- Single Responsibility
- Open/Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

---

## 2. Screaming Architecture

### 2.1 Filosofía y Principios

**Screaming Architecture** es un concepto propuesto por Robert C. Martin (Uncle Bob) que establece:

> "La arquitectura de un sistema debe gritar sobre los casos de uso del sistema, no sobre los frameworks y herramientas utilizados."

**Pregunta clave:** Al ver la estructura de carpetas, ¿qué ves primero?

❌ **Mal ejemplo (organización técnica):**

```
src/
├── controllers/
├── services/
├── models/
├── views/
└── utils/
```

_Solo veo patrones técnicos, no sé qué hace la aplicación_

✅ **Buen ejemplo (organización por dominio):**

```
src/
├── features/
│   ├── auth/           # ¡Autenticación!
│   ├── users/          # ¡Gestión de usuarios!
│   ├── dashboard/      # ¡Panel de control!
│   └── casos-exito/    # ¡Casos de éxito!
├── shared/
└── core/
```

_Inmediatamente sé que la app maneja autenticación, usuarios, dashboard y casos de éxito_

### 2.2 Estructura de Carpetas Detallada

#### Frontend (apps/web/src/)

```
apps/web/src/
│
├── app/                          # 📱 Next.js App Router (Infraestructura)
│   ├── layout.tsx               # Layout raíz con providers
│   ├── page.tsx                 # Homepage
│   ├── globals.css              # Estilos globales + tokens CSS
│   ├── loading.tsx              # Loading state global
│   ├── error.tsx                # Error boundary global
│   │
│   ├── sobre/                   # Ruta: /sobre
│   │   └── page.tsx
│   ├── contacto/                # Ruta: /contacto
│   │   ├── page.tsx            # Server Component (SEO)
│   │   └── ContactoClient.tsx  # Client Component (lógica)
│   └── [otras-rutas]/
│
├── features/                     # 🎯 DOMINIO DEL NEGOCIO (lo que grita)
│   │
│   ├── auth/                    # Feature: Autenticación
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── types.ts            # Tipos específicos de auth
│   │   └── index.ts            # Barrel export
│   │
│   ├── users/                   # Feature: Gestión de usuarios
│   │   ├── components/
│   │   │   └── UserProfile.tsx
│   │   ├── hooks/
│   │   │   └── useUsers.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── dashboard/               # Feature: Dashboard
│       ├── components/
│       │   ├── StatsCard.tsx
│       │   └── ActivityFeed.tsx
│       ├── types.ts
│       └── index.ts
│
├── core/                        # ⚙️ Lógica de negocio transversal
│   ├── services/
│   │   └── api.ts              # Cliente HTTP configurado (Axios)
│   │
│   └── stores/
│       └── authStore.ts        # Estado global (Zustand)
│
└── shared/                      # 🔧 Infraestructura técnica
    ├── components/             # Componentes UI reutilizables
    │   ├── Button/
    │   │   ├── Button.tsx
    │   │   ├── ShimmerEffect.tsx
    │   │   ├── RippleEffect.tsx
    │   │   └── index.ts
    │   ├── Card/
    │   ├── Navbar/
    │   ├── Footer/
    │   └── index.ts           # Barrel export
    │
    ├── hooks/                 # Hooks genéricos
    │   ├── useDebounce.ts
    │   └── useLocalStorage.ts
    │
    └── utils/                 # Utilidades puras
        └── cn.ts             # classnames helper
```

#### Backend (apps/api/src/)

```
apps/api/src/
│
├── features/                     # 🎯 DOMINIO DEL NEGOCIO
│   │
│   ├── auth/                    # Feature: Autenticación
│   │   ├── auth.controller.ts  # Maneja HTTP requests
│   │   ├── auth.service.ts     # Lógica de negocio
│   │   ├── auth.routes.ts      # Definición de rutas
│   │   ├── auth.types.ts       # DTOs y validaciones Zod
│   │   └── auth.middleware.ts  # Middleware específico
│   │
│   ├── users/                   # Feature: Usuarios
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.routes.ts
│   │   └── users.types.ts
│   │
│   └── contact/                 # Feature: Contacto
│       ├── contact.controller.ts
│       ├── contact.service.ts
│       ├── contact.routes.ts
│       └── contact.types.ts
│
├── core/                        # ⚙️ Infraestructura transversal
│   ├── middleware/
│   │   ├── auth.middleware.ts      # Verificación JWT
│   │   ├── errorHandler.ts         # Manejo global de errores
│   │   └── validation.middleware.ts # Validación Zod
│   │
│   ├── config/
│   │   └── index.ts                # Configuración (env vars)
│   │
│   └── utils/
│       └── index.ts                # Utilidades genéricas
│
├── shared/                      # 🔧 Compartido entre features
│   ├── constants/
│   │   └── index.ts            # Constantes globales
│   │
│   └── types/
│       └── index.ts            # Tipos compartidos
│
└── server.ts                    # 🚀 Entry point de la aplicación
```

### 2.3 Reglas de Organización

#### ¿Dónde va cada cosa?

**Pregunta 1: ¿Es específico de un dominio de negocio?**

- ✅ SÍ → Va en `/features/nombre-feature/`
- ❌ NO → Continúa a pregunta 2

**Pregunta 2: ¿Conoce sobre el dominio de negocio?**

- ✅ SÍ → Va en `/core/` (lógica de negocio transversal)
- ❌ NO → Va en `/shared/` (infraestructura técnica pura)

**Ejemplos:**

| Elemento    | ¿Dominio específico? | ¿Conoce negocio? | Ubicación                           |
| ----------- | -------------------- | ---------------- | ----------------------------------- |
| LoginForm   | SÍ (auth)            | -                | `/features/auth/components/`        |
| Button      | NO                   | NO               | `/shared/components/`               |
| authStore   | NO                   | SÍ               | `/core/stores/`                     |
| apiService  | NO                   | SÍ               | `/core/services/`                   |
| useDebounce | NO                   | NO               | `/shared/hooks/`                    |
| CasoCard    | SÍ (casos)           | -                | `/features/casos-exito/components/` |

### 2.4 Reglas de Dependencias

```
┌─────────────┐
│  features/  │  ← Puede importar de core/ y shared/
└──────┬──────┘
       │
       ↓
┌─────────────┐
│    core/    │  ← Puede importar de shared/
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   shared/   │  ← NO puede importar de nadie
└─────────────┘
```

**Reglas:**

1. ❌ `shared/` NO debe importar de `features/` ni `core/`
2. ❌ `core/` NO debe importar de `features/`
3. ✅ `features/` puede importar de `core/` y `shared/`
4. ✅ Features pueden importar entre sí, pero minimizar

---

## 3. Frontend (Next.js)

### 3.1 Configuración Next.js 15

#### next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deshabilitar checks durante builds de producción
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
```

#### App Router

Aprende y Aplica usa **App Router** (Next.js 13+):

**Estructura de rutas:**

```
app/
├── layout.tsx          → Layout raíz
├── page.tsx            → / (homepage)
├── sobre/page.tsx      → /sobre
└── contacto/
    ├── page.tsx        → /contacto (Server Component)
    └── ContactoClient.tsx → Client Component
```

#### Server vs Client Components

**Server Component (por defecto):**

```typescript
// app/sobre/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Aprende y Aplica',
};

export default function SobrePage() {
  return <div>Contenido...</div>;
}
```

**Client Component (con 'use client'):**

```typescript
// app/contacto/ContactoClient.tsx
'use client';

import { useState } from 'react';

export const ContactoClient = () => {
  const [formData, setFormData] = useState({});
  return <form>...</form>;
};
```

### 3.2 TypeScript

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/core/*": ["./src/core/*"]
    }
  }
}
```

**Path Aliases:**

```typescript
// En lugar de:
import { Button } from "../../../shared/components/Button";

// Usas:
import { Button } from "@/shared/components/Button";
```

### 3.3 TailwindCSS

#### tailwind.config.js

```javascript
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          600: "#1F5AF6",
          100: "#E8EFFD",
        },
        neutral: {
          900: "#0A1633",
          600: "#5B6472",
        },
        accent: {
          orange: "#FF7A45",
          green: "#10B981",
        },
      },
    },
  },
};
```

#### globals.css - Variables CSS

```css
:root {
  /* Colores */
  --primary-600: #1f5af6;
  --neutral-900: #0a1633;
  --accent-orange: #ff7a45;

  /* Tipografía */
  --text-base: 1rem;
  --text-xl: 1.5rem;

  /* Espaciado */
  --space-4: 1rem;
  --space-8: 2rem;

  /* Border Radius */
  --radius-base: 0.75rem;

  /* Sombras */
  --shadow-base: 0 2px 8px rgba(10, 22, 51, 0.08);
}
```

### 3.4 Estructura /features

Cada feature sigue este patrón:

```
features/nombre-feature/
├── components/
├── hooks/
├── types.ts
└── index.ts
```

**Ejemplo: features/auth/**

```typescript
// types.ts
export interface LoginCredentials {
  email: string;
  password: string;
}

// hooks/useAuth.ts
("use client");
import { useAuthStore } from "@/core/stores/authStore";

export const useAuth = () => {
  const { user, login, logout } = useAuthStore();
  return { user, login, logout };
};

// index.ts (Barrel export)
export * from "./types";
export * from "./hooks/useAuth";
```

### 3.5 Estructura /shared

Componentes reutilizables sin conocimiento del dominio:

```
shared/
├── components/
│   ├── Button/
│   ├── Card/
│   └── index.ts
├── hooks/
│   └── useDebounce.ts
└── utils/
    └── cn.ts
```

**Ejemplo: shared/utils/cn.ts**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3.6 Estructura /core

Lógica de negocio transversal:

```
core/
├── services/
│   └── api.ts
└── stores/
    └── authStore.ts
```

**Ejemplo: core/services/api.ts**

```typescript
import axios, { AxiosInstance } from "axios";

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 10000,
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }
}

export const apiService = new ApiService();
```

**Ejemplo: core/stores/authStore.ts**

```typescript
"use client";
import { create } from "zustand";
import { User } from "@aprende-y-aplica/shared";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (credentials) => {
    // Lógica de login
    const response = await apiService.post("/auth/login", credentials);
    localStorage.setItem("accessToken", response.accessToken);
    set({ user: response.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    set({ user: null, isAuthenticated: false });
  },
}));
```

---

## 4. Backend (Express + TypeScript)

### 4.1 Configuración Express

#### server.ts - Entry Point

```typescript
import dotenv from "dotenv";
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./core/middleware/errorHandler";
import { authRoutes } from "./features/auth/auth.routes";
import { userRoutes } from "./features/users/users.routes";

// Cargar variables de entorno
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middleware global
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// API Routes
const API_VERSION = process.env.API_VERSION || "v1";
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);

// Error handling (debe ir al final)
app.use(errorHandler);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: "Ruta no encontrada", code: "NOT_FOUND" },
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 API Version: ${API_VERSION}`);
});

export default app;
```

#### Middleware Stack

```
Request
  ↓
helmet()              # Seguridad HTTP headers
  ↓
cors()                # CORS policy
  ↓
morgan()              # Logging de requests
  ↓
express.json()        # Parse JSON body
  ↓
Routes                # Rutas de la aplicación
  ↓
errorHandler()        # Manejo global de errores
  ↓
Response
```

### 4.2 Estructura /features

Cada feature sigue el patrón **Controller-Service-Routes**:

```
features/nombre-feature/
├── nombre-feature.controller.ts   # Maneja HTTP
├── nombre-feature.service.ts      # Lógica de negocio
├── nombre-feature.routes.ts       # Define rutas
└── nombre-feature.types.ts        # DTOs y validación
```

#### Ejemplo Completo: features/auth/

**auth.types.ts - Validación con Zod**

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];
export type RegisterInput = z.infer<typeof registerSchema>["body"];
```

**auth.service.ts - Lógica de Negocio**

```typescript
import { User, AuthTokens } from "@aprende-y-aplica/shared";
import { LoginInput, RegisterInput } from "./auth.types";
import { createError } from "../../core/middleware/errorHandler";
import { HTTP_STATUS, ERROR_CODES } from "@aprende-y-aplica/shared";

export class AuthService {
  async login(credentials: LoginInput): Promise<{ user: User } & AuthTokens> {
    const { email, password } = credentials;

    // TODO: Validar con base de datos
    if (email === "demo@aprendeyaplica.com" && password === "demo123") {
      const user: User = {
        id: "1",
        email,
        name: "Usuario Demo",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        user,
        accessToken: "demo-access-token",
        refreshToken: "demo-refresh-token",
      };
    }

    throw createError(
      "Credenciales inválidas",
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR,
    );
  }

  async register(data: RegisterInput): Promise<{ user: User } & AuthTokens> {
    // TODO: Verificar email, hashear password, crear en DB
    const user: User = {
      id: "2",
      email: data.email,
      name: data.name,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      user,
      accessToken: "demo-access-token",
      refreshToken: "demo-refresh-token",
    };
  }
}

export const authService = new AuthService();
```

**auth.controller.ts - Maneja HTTP**

```typescript
import { Request, Response } from "express";
import { authService } from "./auth.service";
import { HTTP_STATUS } from "@aprende-y-aplica/shared";
import { asyncHandler } from "../../core/utils";

export class AuthController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: result,
    });
  });
}

export const authController = new AuthController();
```

**auth.routes.ts - Define Rutas**

```typescript
import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../core/middleware/validation.middleware";
import { loginSchema, registerSchema } from "./auth.types";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/register", validate(registerSchema), authController.register);

export { router as authRoutes };
```

### 4.3 Middleware Personalizado

#### Error Handler

```typescript
// core/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const createError = (
  message: string,
  statusCode: number,
  code: string,
) => {
  return new AppError(message, statusCode, code);
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  // Error no manejado
  console.error("Error no manejado:", err);
  res.status(500).json({
    success: false,
    error: {
      message: "Error interno del servidor",
      code: "INTERNAL_ERROR",
    },
  });
};
```

#### Authentication Middleware

```typescript
// core/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { createError } from "./errorHandler";
import { HTTP_STATUS, ERROR_CODES } from "@aprende-y-aplica/shared";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw createError(
      "Token no proporcionado",
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR,
    );
  }

  // TODO: Verificar JWT
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // req.user = decoded;

  next();
};
```

#### Validation Middleware

```typescript
// core/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { createError } from "./errorHandler";
import { HTTP_STATUS, ERROR_CODES } from "@aprende-y-aplica/shared";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      throw createError(
        error.errors[0].message,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
  };
};
```

### 4.4 Configuración TypeScript

#### tsconfig.json (Backend)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### nodemon.json

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node src/server.ts"
}
```

### 4.5 Flujo de una Request

```
HTTP Request
  ↓
Route Definition (auth.routes.ts)
  ↓
Middleware (validate, authenticate)
  ↓
Controller (auth.controller.ts)
  ↓
Service (auth.service.ts)
  ↓
Database / External API
  ↓
Service (transforma respuesta)
  ↓
Controller (formatea HTTP response)
  ↓
HTTP Response
```

**Ejemplo de flujo completo:**

```typescript
// 1. Cliente hace request
POST /api/v1/auth/login
Body: { email: "user@example.com", password: "123456" }

// 2. Route recibe y aplica middleware
router.post('/login', validate(loginSchema), authController.login);

// 3. Validation middleware valida con Zod
✓ Email válido
✓ Password mínimo 6 caracteres

// 4. Controller recibe request validada
authController.login(req, res)

// 5. Controller llama al Service
const result = await authService.login(req.body);

// 6. Service ejecuta lógica de negocio
- Busca usuario en DB
- Verifica password
- Genera tokens JWT

// 7. Service retorna resultado
return { user, accessToken, refreshToken };

// 8. Controller formatea respuesta HTTP
res.status(200).json({
  success: true,
  data: result
});

// 9. Cliente recibe respuesta
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## 5. Packages Compartidos

### 5.1 packages/shared

Código compartido entre frontend y backend:

```
packages/shared/src/
├── types/
│   └── index.ts      # User, ApiResponse, AuthTokens
├── constants/
│   └── index.ts      # HTTP_STATUS, ERROR_CODES
└── utils/
    └── index.ts      # Utilidades puras
```

**types/index.ts:**

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  GUEST = "guest",
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
```

**constants/index.ts:**

```typescript
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
} as const;
```

**Uso en Frontend:**

```typescript
import { User, ApiResponse } from "@aprende-y-aplica/shared";
```

**Uso en Backend:**

```typescript
import { User, HTTP_STATUS } from "@aprende-y-aplica/shared";
```

---

## 6. Sistema de Diseño

### 6.1 Paleta de Colores

```css
/* Primary - Azul corporativo */
--primary-600: #1f5af6;
--primary-100: #e8effd;

/* Neutral - Grises */
--neutral-900: #0a1633; /* Texto principal */
--neutral-600: #5b6472; /* Texto secundario */
--neutral-200: #e3e8f0; /* Bordes */
--neutral-100: #f7f9fb; /* Fondos claros */

/* Accent - Colores de acción */
--accent-orange: #ff7a45; /* CTAs principales */
--accent-green: #10b981; /* Success */
--accent-red: #ef4444; /* Errors */
--accent-yellow: #f59e0b; /* Warnings */
```

### 6.2 Tipografía

```css
/* Escala de tamaños */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.5rem; /* 24px */
--text-2xl: 2rem; /* 32px */
--text-3xl: 2.5rem; /* 40px */

/* Line Heights */
--leading-tight: 1.25; /* Títulos */
--leading-normal: 1.45; /* Texto normal */
--leading-relaxed: 1.6; /* Texto largo */

/* Font Family */
font-family: "Inter", system-ui, sans-serif;
```

### 6.3 Componentes Base

#### Button

```typescript
// 3 variantes: primary, secondary, tertiary
// 3 tamaños: sm, md, lg

<Button variant="primary" size="md">
  Click me
</Button>
```

**Características:**

- Animaciones con Framer Motion
- Shimmer effect en primary
- Ripple effect en secondary
- Estados: hover, active, disabled

#### Card

```typescript
<Card hover variant="default">
  Contenido
</Card>
```

**Variantes:**

- `default`: Fondo blanco sólido
- `glass`: Glassmorphism effect

### 6.4 Animaciones

**Framer Motion:**

```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Contenido animado
</motion.div>
```

**CSS Keyframes:**

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

---

## 7. Patrones de Diseño

### 7.1 Composición de Componentes

**Patrón Compound Components:**

```typescript
<Card>
  <Card.Header>
    <Card.Title>Título</Card.Title>
  </Card.Header>
  <Card.Body>
    Contenido
  </Card.Body>
</Card>
```

### 7.2 Hooks Personalizados

**useLocalStorage:**

```typescript
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue] as const;
}
```

### 7.3 Gestión de Estado con Zustand

**Patrón de Store:**

```typescript
interface Store {
  // Estado
  data: Data | null;
  isLoading: boolean;

  // Acciones
  fetchData: () => Promise<void>;
  updateData: (data: Data) => void;
  reset: () => void;
}

export const useStore = create<Store>((set) => ({
  data: null,
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });
    const data = await api.get("/data");
    set({ data, isLoading: false });
  },

  updateData: (data) => set({ data }),
  reset: () => set({ data: null, isLoading: false }),
}));
```

---

## 8. Integración Frontend-Backend

### 8.1 Flujo de Autenticación JWT

```
1. Usuario envía credenciales
   Frontend → POST /api/v1/auth/login

2. Backend valida y genera tokens
   Service → Verifica password
   Service → Genera JWT (accessToken + refreshToken)

3. Backend responde con tokens
   Response → { user, accessToken, refreshToken }

4. Frontend almacena tokens
   localStorage.setItem('accessToken', token)
   localStorage.setItem('refreshToken', token)

5. Requests subsecuentes incluyen token
   Headers: { Authorization: 'Bearer <accessToken>' }

6. Backend verifica token en cada request
   Middleware → jwt.verify(token, SECRET)

7. Token expira → Refresh
   Frontend → POST /api/v1/auth/refresh
   Backend → Genera nuevo accessToken
```

### 8.2 Sincronización de Tipos

**Definir una vez en packages/shared:**

```typescript
// packages/shared/src/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
}
```

**Usar en Frontend:**

```typescript
// apps/web/src/features/auth/types.ts
import { User } from "@aprende-y-aplica/shared";

export interface LoginResponse {
  user: User; // ✅ Mismo tipo
  accessToken: string;
}
```

**Usar en Backend:**

```typescript
// apps/api/src/features/auth/auth.service.ts
import { User } from '@aprende-y-aplica/shared';

async login(): Promise<User> {
  return user;  // ✅ Mismo tipo
}
```

---

## 9. Configuración del Proyecto

### 9.1 Monorepo con npm workspaces

**package.json (root):**

```json
{
  "name": "aprende-y-aplica",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev:web\" \"npm run dev:api\"",
    "dev:web": "npm run dev --workspace=apps/web",
    "dev:api": "npm run dev --workspace=apps/api",
    "build": "npm run build --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=10.5.1"
  }
}
```

### 9.2 Variables de Entorno

**Frontend (.env.local):**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_NAME=Aprende y Aplica
```

**Backend (.env):**

```env
PORT=4000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=30d
ALLOWED_ORIGINS=http://localhost:3000
API_VERSION=v1
```

### 9.3 Dependencias Principales

**Frontend:**

- next: 16.0.7
- react: 18.3.1
- typescript: 5.9.3
- tailwindcss: 3.4.18
- zustand: 5.0.2
- axios: 1.6.7
- framer-motion: 12.23.24

**Backend:**

- express: 4.18.2
- typescript: 5.3.3
- zod: 3.25.76
- cors: 2.8.5
- helmet: 7.1.0
- morgan: 1.10.0
- tsx: 4.20.6

---

## 10. Desarrollo Local

### 10.1 Inicio del Proyecto

```bash
# Instalar dependencias
npm install

# Crear archivos .env
# (ver sección 9.2)

# Iniciar todo
npm run dev

# O iniciar por separado
npm run dev:web  # Frontend en :3000
npm run dev:api  # Backend en :4000
```

### 10.2 Hot Reload

**Frontend (Next.js Fast Refresh):**

- Cambios en componentes → Recarga automática
- Preserva estado de React
- Actualización en < 1 segundo

**Backend (Nodemon):**

- Cambios en archivos .ts → Reinicia servidor
- Configurado en nodemon.json
- Watch en carpeta src/

### 10.3 Verificación

**Frontend:**

```bash
curl http://localhost:3000
# Debe mostrar HTML de Next.js
```

**Backend:**

```bash
curl http://localhost:4000/health
# {"status":"ok","message":"API is running"}
```

---

## 11. Diseño Responsivo

### 11.1 Breakpoints

```javascript
// tailwind.config.js usa breakpoints por defecto:
sm: "640px"; // Mobile landscape
md: "768px"; // Tablet
lg: "1024px"; // Desktop
xl: "1280px"; // Large desktop
```

**Uso:**

```typescript
<div className="
  w-full          // Mobile: 100% width
  md:w-1/2        // Tablet: 50% width
  lg:w-1/3        // Desktop: 33% width
">
```

### 11.2 Estrategia Mobile-First

```typescript
// ❌ Desktop-first (evitar)
<div className="w-1/3 sm:w-full">

// ✅ Mobile-first (correcto)
<div className="w-full md:w-1/2 lg:w-1/3">
```

### 11.3 Componentes Responsive

#### Navbar Responsive

El Navbar cambia completamente entre mobile y desktop:

**Desktop (lg+):**

```typescript
<div className="hidden lg:flex items-center gap-1">
  {navLinks.map((link) => (
    <Link href={link.href} className="px-3 py-2">
      {link.label}
    </Link>
  ))}
</div>
```

**Mobile (<lg):**

```typescript
<button
  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  className="lg:hidden p-2"
>
  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
</button>

<AnimatePresence>
  {isMobileMenuOpen && (
    <motion.div className="lg:hidden bg-white">
      {/* Menú móvil */}
    </motion.div>
  )}
</AnimatePresence>
```

#### Grid Responsive

**Pattern básico:**

```typescript
<div className="
  grid
  grid-cols-1        // Mobile: 1 columna
  md:grid-cols-2     // Tablet: 2 columnas
  lg:grid-cols-3     // Desktop: 3 columnas
  gap-6
">
```

**Pattern avanzado (4 columnas en XL):**

```typescript
<div className="
  grid
  grid-cols-1        // Mobile
  sm:grid-cols-2     // Mobile landscape
  md:grid-cols-2     // Tablet
  lg:grid-cols-3     // Desktop
  xl:grid-cols-4     // Large desktop
  gap-4 sm:gap-6 lg:gap-8  // Gap responsivo
">
```

#### Hero Section Responsive

```typescript
<section className="
  py-16 sm:py-20 md:py-24 lg:py-32  // Padding vertical responsivo
  px-4 sm:px-6 lg:px-8               // Padding horizontal responsivo
">
  <div className="max-w-7xl mx-auto">
    <h1 className="
      text-3xl sm:text-4xl md:text-5xl lg:text-6xl  // Tamaño de fuente
      font-bold
      mb-4 sm:mb-6 md:mb-8                          // Margin bottom
    ">
      Título Responsivo
    </h1>

    <p className="
      text-base sm:text-lg md:text-xl  // Tamaño de párrafo
      max-w-xl md:max-w-2xl lg:max-w-3xl  // Ancho máximo
      mx-auto
    ">
      Descripción que se adapta al tamaño de pantalla.
    </p>
  </div>
</section>
```

#### Cards Responsive

```typescript
<Card className="
  p-4 sm:p-6 md:p-8              // Padding interno
  w-full                          // Full width en mobile
  md:w-auto                       // Auto width en tablet+
">
  <div className="
    flex
    flex-col md:flex-row           // Vertical en mobile, horizontal en tablet+
    gap-4 md:gap-6                // Gap responsivo
    items-start md:items-center   // Alineación responsiva
  ">
    <div className="w-12 h-12 md:w-16 md:h-16">  {/* Tamaño de icono */}
      <Icon />
    </div>
    <div className="flex-1">
      <h3 className="text-lg md:text-xl lg:text-2xl">Título</h3>
      <p className="text-sm md:text-base">Descripción</p>
    </div>
  </div>
</Card>
```

#### Formularios Responsive

```typescript
<form className="space-y-4 md:space-y-6">
  {/* Grid de 2 columnas en tablet+ */}
  <div className="
    grid
    grid-cols-1 md:grid-cols-2
    gap-4 md:gap-6
  ">
    <div>
      <label className="text-sm md:text-base">Nombre</label>
      <input className="
        w-full
        px-3 py-2 md:px-4 md:py-3  // Padding responsivo
        text-sm md:text-base        // Tamaño de texto
      " />
    </div>
    <div>
      <label className="text-sm md:text-base">Email</label>
      <input className="w-full px-3 py-2 md:px-4 md:py-3" />
    </div>
  </div>

  {/* Botón full width en mobile */}
  <Button className="w-full md:w-auto">
    Enviar
  </Button>
</form>
```

#### Imágenes Responsive

**Con Next.js Image:**

```typescript
<div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px]">
  <Image
    src="/hero-image.jpg"
    alt="Hero"
    fill
    className="object-cover"
    sizes="(max-width: 640px) 100vw,
           (max-width: 768px) 100vw,
           (max-width: 1024px) 100vw,
           1200px"
    priority
  />
</div>
```

#### Container Responsive

```typescript
<div className="
  container
  mx-auto
  px-4 sm:px-6 lg:px-8       // Padding lateral responsivo
  max-w-7xl                   // Ancho máximo
">
  {/* Contenido */}
</div>
```

### 11.4 Utilidades Responsive Comunes

#### Mostrar/Ocultar según breakpoint

```typescript
{/* Solo en mobile */}
<div className="block md:hidden">
  Contenido mobile
</div>

{/* Solo en desktop */}
<div className="hidden md:block">
  Contenido desktop
</div>

{/* Ocultar en tablet */}
<div className="block md:hidden lg:block">
  Visible en mobile y desktop, oculto en tablet
</div>
```

#### Flexbox Responsive

```typescript
<div className="
  flex
  flex-col md:flex-row          // Dirección
  items-start md:items-center   // Alineación
  justify-start md:justify-between  // Justificación
  gap-4 md:gap-6 lg:gap-8      // Gap
">
```

#### Spacing Responsive

```typescript
{/* Padding */}
<div className="p-4 sm:p-6 md:p-8 lg:p-12">

{/* Margin */}
<div className="m-4 sm:m-6 md:m-8">

{/* Margin top */}
<div className="mt-8 md:mt-12 lg:mt-16">

{/* Gap */}
<div className="gap-4 sm:gap-6 md:gap-8">
```

### 11.5 Hooks para Responsive

#### useMediaQuery Hook

Ya documentado en la sección 17.3:

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1023px)');
const isDesktop = useMediaQuery('(min-width: 1024px)');

return (
  <>
    {isMobile && <MobileComponent />}
    {isTablet && <TabletComponent />}
    {isDesktop && <DesktopComponent />}
  </>
);
```

### 11.6 Testing Responsive

**Breakpoints a probar:**

- **Mobile:** 375px (iPhone SE)
- **Mobile Large:** 414px (iPhone Pro Max)
- **Tablet:** 768px (iPad)
- **Desktop:** 1024px
- **Large Desktop:** 1440px
- **XL Desktop:** 1920px

**Herramientas:**

- Chrome DevTools (Device Toolbar)
- Responsive Design Mode (Firefox)
- Real devices cuando sea posible

### 11.7 Patrones Comunes Responsive

#### Two-Column Layout

```typescript
<div className="
  grid
  grid-cols-1 lg:grid-cols-3
  gap-8
">
  {/* Sidebar - 1/3 en desktop */}
  <aside className="lg:col-span-1">
    Sidebar
  </aside>

  {/* Main content - 2/3 en desktop */}
  <main className="lg:col-span-2">
    Contenido principal
  </main>
</div>
```

#### Stack on Mobile, Side-by-side on Desktop

```typescript
<div className="
  flex
  flex-col md:flex-row
  gap-6
">
  <div className="flex-1">Izquierda</div>
  <div className="flex-1">Derecha</div>
</div>
```

#### Responsive Typography Scale

```typescript
// Escala de títulos
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
<h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
<h4 className="text-lg sm:text-xl md:text-2xl">
<p className="text-base sm:text-lg md:text-xl">
<small className="text-sm md:text-base">
```

---

## 12. Configuración de Despliegue

### 12.1 Frontend en Netlify

**netlify.toml:**

```toml
[build]
  command = "npm run build --workspace=apps/web"
  publish = "apps/web/.next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Variables de entorno en Netlify:**

```
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com/api
```

### 12.2 Backend en Railway/Render

**Build Command:**

```bash
npm run build --workspace=apps/api
```

**Start Command:**

```bash
npm start --workspace=apps/api
```

**Variables de entorno:**

```
PORT=4000
NODE_ENV=production
JWT_SECRET=<secret-seguro>
ALLOWED_ORIGINS=https://tu-dominio.com
```

---

## 13. Buenas Prácticas

### 13.1 TypeScript

✅ **Hacer:**

- Siempre tipar funciones y variables
- Usar interfaces para objetos
- Evitar `any`, usar `unknown` si es necesario

❌ **Evitar:**

- `any` en producción
- Type assertions innecesarios
- Ignorar errores de TypeScript

### 13.2 Componentes

✅ **Hacer:**

- Un componente = una responsabilidad
- Props con interfaces
- Componentes pequeños y reutilizables

❌ **Evitar:**

- Componentes de > 300 líneas
- Lógica de negocio en componentes UI
- Props sin tipar

### 13.3 Organización

✅ **Hacer:**

- Feature-first organization
- Barrel exports (index.ts)
- Imports absolutos con @/

❌ **Evitar:**

- Imports relativos largos (../../../)
- Archivos de > 500 líneas
- Código duplicado

---

## 14. Módulos de Páginas Ejemplo

### 14.1 Homepage

**Estructura:**

```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PilaresSection />
      <MetricasSection />
      <TestimoniosSection />
      <CTASection />
    </>
  );
}
```

### 14.2 Página de Contacto

**Características:**

- Formulario con validación
- Estados: normal, loading, success, error
- Campos: nombre, email, empresa, rol, mensaje
- Validación en tiempo real

```typescript
const [formData, setFormData] = useState({});
const [errors, setErrors] = useState({});
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setLoading(true);
  await submitForm(formData);
  setLoading(false);
};
```

---

## 15. Checklist de Migración

### ✅ Paso 1: Setup Inicial

- [ ] Clonar/crear estructura de carpetas
- [ ] Copiar package.json (root, apps, packages)
- [ ] Ejecutar `npm install`
- [ ] Verificar que workspaces funcionen

### ✅ Paso 2: Configuración

- [ ] Crear .env.local en apps/web
- [ ] Crear .env en apps/api
- [ ] Configurar tailwind.config.js
- [ ] Copiar globals.css con variables CSS
- [ ] Configurar tsconfig.json

### ✅ Paso 3: Personalización

- [ ] Cambiar colores en tailwind.config.js
- [ ] Actualizar variables CSS en globals.css
- [ ] Modificar metadata en layout.tsx
- [ ] Actualizar NEXT_PUBLIC_APP_NAME

### ✅ Paso 4: Features

- [ ] Revisar features existentes
- [ ] Eliminar features no necesarias
- [ ] Agregar nuevas features siguiendo patrón
- [ ] Actualizar rutas en server.ts (backend)

### ✅ Paso 5: Componentes

- [ ] Revisar componentes en /shared
- [ ] Personalizar Button, Card, Navbar
- [ ] Agregar componentes específicos del proyecto
- [ ] Actualizar Footer con info del proyecto

### ✅ Paso 6: Tipos Compartidos

- [ ] Actualizar types en packages/shared
- [ ] Sincronizar tipos entre frontend y backend
- [ ] Agregar nuevos tipos según necesidad

### ✅ Paso 7: Testing Local

- [ ] Iniciar frontend: `npm run dev:web`
- [ ] Iniciar backend: `npm run dev:api`
- [ ] Verificar health check: /health
- [ ] Probar navegación entre páginas
- [ ] Verificar responsive design

### ✅ Paso 8: Despliegue

- [ ] Configurar Netlify/Vercel para frontend
- [ ] Configurar Railway/Render para backend
- [ ] Agregar variables de entorno en producción
- [ ] Hacer deploy y verificar
- [ ] Configurar dominio personalizado

---

## 📚 Referencias Adicionales

- **Documentación del Proyecto:**
  - [ARCHITECTURE.md](../reference/ARCHITECTURE.md)
  - [EXAMPLES.md](../reference/EXAMPLES.md)
  - [COMMANDS.md](../reference/COMMANDS.md)
  - [GETTING_STARTED.md](./GETTING_STARTED.md)

- **Tecnologías:**
  - [Next.js Docs](https://nextjs.org/docs)
  - [Express Docs](https://expressjs.com/)
  - [TailwindCSS Docs](https://tailwindcss.com/)
  - [Zustand Docs](https://zustand-demo.pmnd.rs/)
  - [Zod Docs](https://zod.dev/)

---

## 🎉 Conclusión

Aprende y Aplica es una plataforma educativa completa y lista para producción que implementa:

✅ Arquitectura escalable (Screaming Architecture)  
✅ Stack moderno (Next.js 16 + Express + TypeScript)  
✅ Sistema de diseño completo con modo oscuro personalizado  
✅ Autenticación con Supabase (JWT + SSO Microsoft/Google)  
✅ Integración con IA (Google Gemini + OpenAI)  
✅ Tipos compartidos entre frontend y backend  
✅ Hot reload en desarrollo  
✅ Sistema de planificación de estudios con LIA  
✅ Visualización de datos con Nivo y Recharts  
✅ Configuración de despliegue

**Usa esta guía como referencia para:**

- Entender la arquitectura completa
- Migrar proyectos existentes
- Crear nuevos proyectos similares
- Mantener consistencia en el código

---

**Última actualización:** Diciembre 2024  
**Mantenido por:** Equipo Aprende y Aplica

---

## 16. Componentes Detallados con Código Completo

### 16.1 Button Component

El componente Button es uno de los más complejos, con animaciones y efectos avanzados.

**Button.tsx:**

```typescript
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';
import { ShimmerEffect } from './ShimmerEffect';
import { RippleEffect } from './RippleEffect';

const buttonAnimations = {
  primary: {
    rest: { scale: 1 },
    hover: {
      scale: 1.03,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    tap: { scale: 0.98 }
  },
  secondary: {
    rest: { scale: 1 },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    tap: { scale: 0.98 }
  },
  tertiary: {
    rest: { scale: 1 },
    hover: {
      scale: 1.01,
      transition: { duration: 0.16, ease: 'easeOut' }
    },
    tap: { scale: 0.99 }
  }
};

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-base)] font-medium transition-all duration-[var(--duration-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer relative overflow-hidden',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--accent-orange)] text-white shadow-md hover:shadow-lg hover:shadow-[var(--accent-orange)]/30',
        secondary: 'border-2 border-[var(--primary-600)] text-[var(--primary-600)] hover:bg-[var(--primary-100)] hover:shadow-md',
        tertiary: 'text-[var(--primary-600)] hover:underline hover:opacity-80',
      },
      size: {
        sm: 'h-9 px-3 text-[var(--text-sm)]',
        md: 'h-11 px-6 text-[var(--text-base)]',
        lg: 'h-13 px-8 text-[var(--text-lg)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size, children, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        variants={buttonAnimations[variant]}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        {...props}
      >
        {/* Shimmer effect para primary */}
        {variant === 'primary' && <ShimmerEffect />}

        {/* Ripple effect para secondary */}
        {variant === 'secondary' && <RippleEffect color="rgba(31, 90, 246, 0.2)" />}

        {/* Contenido del botón */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>

        {/* Glow effect en hover para primary */}
        {isHovered && variant === 'primary' && (
          <motion.div
            className="absolute inset-0 rounded-[var(--radius-base)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              boxShadow: '0 0 20px rgba(255, 122, 69, 0.5)',
            }}
          />
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
```

**ShimmerEffect.tsx:**

```typescript
'use client';

import { motion } from 'framer-motion';

export const ShimmerEffect = () => {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden rounded-[var(--radius-base)]"
      initial={{ x: '-100%' }}
      whileHover={{
        x: '100%',
        transition: {
          duration: 0.6,
          ease: 'easeInOut'
        }
      }}
    >
      <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
    </motion.div>
  );
};
```

**RippleEffect.tsx:**

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface RippleEffectProps {
  color?: string;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  color = 'rgba(255,255,255,0.6)'
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const addRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { x, y, id: Date.now() };
    setRipples([...ripples, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[var(--radius-base)]"
      onMouseEnter={addRipple}
    >
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              backgroundColor: color,
            }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{
              width: 400,
              height: 400,
              opacity: 0,
              x: -200,
              y: -200
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
```

### 16.2 AnimatedSection Component

Componente para animar secciones al hacer scroll:

```typescript
'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fade' | 'slide' | 'scale' | 'slideUp';
  delay?: number;
  duration?: number;
  threshold?: number;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className = '',
  variant = 'slideUp',
  delay = 0,
  duration = 0.6,
  threshold = 0.2
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });

  const getAnimationVariants = () => {
    switch (variant) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 }
        };
      case 'slide':
        return {
          initial: { opacity: 0, x: -50 },
          animate: { opacity: 1, x: 0 }
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 }
        };
      case 'slideUp':
      default:
        return {
          initial: { opacity: 0, y: 50 },
          animate: { opacity: 1, y: 0 }
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.div
      ref={ref}
      initial={variants.initial}
      animate={isInView ? variants.animate : variants.initial}
      transition={{
        duration,
        delay,
        ease: 'easeOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;
```

**Uso:**

```typescript
<AnimatedSection variant="slideUp" delay={0.2}>
  <h2>Título animado</h2>
</AnimatedSection>

<AnimatedSection variant="fade" duration={0.8}>
  <p>Contenido que aparece con fade</p>
</AnimatedSection>
```

### 16.3 Navbar Component

Navbar completo con menú móvil y animaciones:

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/shared/components';
import { cn } from '@/shared/utils/cn';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/sobre', label: 'Sobre Nosotros' },
    { href: '/capacitacion-ia', label: 'Capacitación IA' },
    { href: '/casos-de-exito', label: 'Casos de Éxito' },
    { href: '/recursos', label: 'Recursos' },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-[var(--shadow-md)]'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/pulse-hub-logo.png"
              alt="Logo"
              width={180}
              height={40}
              priority
              className="h-8 sm:h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = mounted && pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors rounded-lg",
                    isActive
                      ? "text-[var(--primary-600)] bg-[var(--primary-100)]"
                      : "text-[var(--neutral-600)] hover:text-[var(--primary-600)]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Link href="/contacto">
              <Button variant="primary" size="md">
                Agendar Demo
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="lg:hidden bg-white border-t shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/contacto" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full">
                  Agendar Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
```

### 16.4 Footer Component

```typescript
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[var(--neutral-900)] text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <Image
              src="/pulse-hub-logo.png"
              alt="Logo"
              width={150}
              height={35}
              className="h-8 w-auto mb-4"
            />
            <p className="text-sm text-white/70">
              Ecosistema humano-tecnológico para la adopción ética de IA.
            </p>
          </div>

          {/* Nuestros Pilares */}
          <div>
            <h4 className="font-semibold mb-4">Nuestros Pilares</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/capacitacion-ia" className="text-sm text-white/70 hover:text-white">
                  Capacitación IA
                </Link>
              </li>
              <li>
                <Link href="/adopcion-diaria" className="text-sm text-white/70 hover:text-white">
                  Adopción Diaria
                </Link>
              </li>
              <li>
                <Link href="/automatizacion" className="text-sm text-white/70 hover:text-white">
                  Automatización
                </Link>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/casos-de-exito" className="text-sm text-white/70 hover:text-white">
                  Casos de Éxito
                </Link>
              </li>
              <li>
                <Link href="/recursos" className="text-sm text-white/70 hover:text-white">
                  AI Academy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contacto" className="text-sm text-white/70 hover:text-white">
                  Agendar Demo
                </Link>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Mail size={16} />
                <a href="mailto:contacto@pulsehub.com">
                  contacto@pulsehub.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex justify-between items-center">
          <p className="text-sm text-white/60">
            © 2025 Pulse Hub. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
```

---

## 17. Hooks Personalizados Completos

### 17.1 useDebounce

```typescript
"use client";

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Uso:**

```typescript
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  // Se ejecuta solo después de 500ms sin cambios
  if (debouncedSearch) {
    fetchResults(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 17.2 useLocalStorage

```typescript
"use client";

import { useState, useEffect } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
```

**Uso:**

```typescript
const [theme, setTheme] = useLocalStorage("theme", "light");

// Cambiar tema
setTheme("dark");

// El valor persiste en localStorage
```

### 17.3 useMediaQuery

```typescript
"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}
```

**Uso:**

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');
const isDesktop = useMediaQuery('(min-width: 1024px)');

return (
  <div>
    {isMobile ? <MobileNav /> : <DesktopNav />}
  </div>
);
```

---

## 18. Configuración Adicional

### 18.1 PostCSS

**postcss.config.js:**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 18.2 ESLint

**eslint.config.mjs:**

```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**"],
  },
];

export default eslintConfig;
```

### 18.3 Prettier

**.prettierrc:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 18.4 Git Ignore

**.gitignore:**

```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build
/dist

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

---

## 19. Formularios y Validación

### 19.1 Formulario de Contacto Completo

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/shared/components';

interface FormData {
  fullName: string;
  email: string;
  company: string;
  role: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

export const ContactForm = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    company: '',
    role: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'La empresa es requerida';
    }

    if (!formData.role) {
      newErrors.role = 'El rol es requerido';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'El mensaje es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos los campos como touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as { [key: string]: boolean });
    setTouched(allTouched);

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Enviar formulario
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          fullName: '',
          email: '',
          company: '',
          role: '',
          message: ''
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Nombre completo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          onBlur={() => handleBlur('fullName')}
          className={`w-full px-4 py-3 rounded-lg border ${
            touched.fullName && errors.fullName
              ? 'border-red-500'
              : 'border-gray-300'
          }`}
          placeholder="María González"
        />
        {touched.fullName && errors.fullName && (
          <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Email corporativo <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={() => handleBlur('email')}
          className={`w-full px-4 py-3 rounded-lg border ${
            touched.email && errors.email
              ? 'border-red-500'
              : 'border-gray-300'
          }`}
          placeholder="maria@empresa.com"
        />
        {touched.email && errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Empresa */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Empresa <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          onBlur={() => handleBlur('company')}
          className="w-full px-4 py-3 rounded-lg border"
          placeholder="Nombre de la empresa"
        />
      </div>

      {/* Rol */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Tu rol <span className="text-red-500">*</span>
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          onBlur={() => handleBlur('role')}
          className="w-full px-4 py-3 rounded-lg border"
        >
          <option value="">Selecciona tu rol</option>
          <option value="ceo">CEO/Dirección</option>
          <option value="cto">CTO/CIO</option>
          <option value="manager">Manager</option>
          <option value="hr">RR.HH.</option>
          <option value="ops">Operaciones</option>
          <option value="other">Otro</option>
        </select>
      </div>

      {/* Mensaje */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Mensaje <span className="text-red-500">*</span>
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          onBlur={() => handleBlur('message')}
          rows={5}
          className="w-full px-4 py-3 rounded-lg border"
          placeholder="Cuéntanos sobre tu organización..."
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Enviando...' : 'Enviar Mensaje'}
      </Button>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 text-green-800 rounded-lg">
          ¡Gracias por tu mensaje! Nos pondremos en contacto pronto.
        </div>
      )}
    </form>
  );
};
```

---

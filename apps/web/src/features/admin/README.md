# Panel de Administración - SofLIA

## 📋 Descripción

El panel de administración es una interfaz completa para gestionar todos los aspectos de la plataforma SofLIA. Permite a los administradores gestionar usuarios, talleres, comunidades, prompts, apps de IA, noticias y visualizar estadísticas.

## 🏗️ Arquitectura

### Estructura de Archivos
```
src/features/admin/
├── components/
│   ├── AdminDashboard.tsx          # Página principal del dashboard
│   ├── AdminLayout.tsx             # Layout con protección de rutas
│   ├── AdminSidebar.tsx            # Navegación lateral
│   ├── AdminHeader.tsx             # Header con controles
│   ├── AdminStats.tsx              # Tarjetas de estadísticas
│   ├── AdminQuickActions.tsx       # Acciones rápidas
│   ├── AdminRecentActivity.tsx     # Actividad reciente
│   ├── AdminUsersPage.tsx          # Gestión de usuarios
│   ├── AdminWorkshopsPage.tsx      # Gestión de talleres
│   ├── AdminCommunitiesPage.tsx    # Gestión de comunidades
│   ├── AdminPromptsPage.tsx        # Gestión de prompts
│   ├── AdminStatisticsPage.tsx     # Estadísticas y métricas
│   └── index.ts                    # Exportaciones
└── README.md                       # Esta documentación
```

### Rutas del Panel
```
/admin/
├── dashboard/          # Dashboard principal
├── users/             # Gestión de usuarios
├── workshops/         # Gestión de talleres
├── communities/       # Gestión de comunidades
├── prompts/           # Gestión de prompts
├── ai-apps/           # Gestión de apps de IA
├── news/              # Gestión de noticias
├── statistics/        # Estadísticas
└── settings/          # Configuración
```

## 🔐 Autenticación y Autorización

### Sistema de Roles
- **Administrador**: Acceso completo al panel
- **Instructor**: Acceso limitado (futuro)
- **Usuario**: Redirigido al dashboard normal

### Protección de Rutas
- Middleware automático que verifica el rol `cargo_rol` en la tabla `users`
- Redirección automática según el rol del usuario
- Layout con verificación de permisos

## 🎨 Características de Diseño

### Animaciones y Transiciones
- **Hover Effects**: Escalado y sombras en tarjetas
- **Loading States**: Skeleton loaders con animaciones
- **Sidebar**: Transiciones suaves de apertura/cierre
- **Icons**: Rotación y cambios de color en hover
- **Cards**: Efectos de elevación y gradientes

### Responsive Design
- **Mobile First**: Diseño optimizado para móviles
- **Sidebar Colapsible**: Se oculta en pantallas pequeñas
- **Grid Adaptativo**: Se ajusta según el tamaño de pantalla
- **Touch Friendly**: Botones y elementos táctiles

### Tema Oscuro/Claro
- Soporte completo para ambos temas
- Transiciones suaves entre temas
- Colores consistentes en ambos modos

## 📊 Funcionalidades

### Dashboard Principal
- **Estadísticas Generales**: Métricas clave de la plataforma
- **Acciones Rápidas**: Acceso directo a funciones comunes
- **Actividad Reciente**: Timeline de eventos importantes

### Gestión de Usuarios
- **Lista de Usuarios**: Vista tabular con filtros
- **Estadísticas**: Contadores por rol y estado
- **Filtros**: Por rol, estado de verificación, búsqueda
- **Acciones**: Editar, eliminar, ver perfil

### Gestión de Talleres
- **Vista de Tarjetas**: Diseño visual atractivo
- **Filtros**: Por categoría, nivel, estado
- **Estadísticas**: Duración, estudiantes, engagement
- **Acciones**: Crear, editar, activar/desactivar

### Gestión de Comunidades
- **Vista de Tarjetas**: Información detallada
- **Filtros**: Por categoría, estado, privacidad
- **Métricas**: Miembros, posts, actividad
- **Acciones**: Moderar, editar, eliminar

### Gestión de Prompts
- **Lista Detallada**: Con tags y métricas
- **Filtros**: Por categoría, estado, búsqueda
- **Estadísticas**: Likes, vistas, engagement
- **Acciones**: Destacar, editar, eliminar

### Estadísticas
- **Métricas Generales**: Crecimiento y tendencias
- **Gráficos**: Visualización de datos
- **Filtros Temporales**: Diferentes períodos
- **Actividad Reciente**: Timeline de eventos

## 🚀 Uso

### Acceso al Panel
1. Iniciar sesión con una cuenta de administrador
2. El sistema detecta automáticamente el rol
3. Redirección automática a `/admin/dashboard`

### Navegación
- **Sidebar**: Navegación principal entre secciones
- **Header**: Controles globales y información del usuario
- **Breadcrumbs**: Navegación contextual (futuro)

### Acciones Comunes
- **Crear Contenido**: Botones de "Agregar" en cada sección
- **Filtrar Datos**: Filtros en la parte superior de cada lista
- **Buscar**: Campo de búsqueda en cada sección
- **Acciones Masivas**: Selección múltiple (futuro)

## 🔧 Configuración

### Variables de Entorno
```env
# Configuración de Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Dependencias
```json
{
  "@heroicons/react": "^2.0.0",
  "next": "^14.0.0",
  "react": "^18.0.0",
  "tailwindcss": "^3.0.0"
}
```

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🎯 Próximas Funcionalidades

### Fase 2
- [ ] Gestión de Apps de IA
- [ ] Gestión de Noticias
- [ ] Configuración del Sistema
- [ ] Reportes Avanzados

### Fase 3
- [ ] Panel de Instructores
- [ ] Modo de Edición en Línea
- [ ] Notificaciones en Tiempo Real
- [ ] Exportación de Datos

## 🐛 Solución de Problemas

### Problemas Comunes
1. **No se puede acceder al panel**: Verificar que el usuario tenga rol "Administrador"
2. **Sidebar no se abre**: Verificar que no haya errores de JavaScript
3. **Datos no cargan**: Verificar conexión a Supabase y permisos

### Logs de Debug
- Activar logs en el navegador para ver errores
- Verificar la consola del servidor para errores de API
- Revisar la red en DevTools para requests fallidos

## 📝 Notas de Desarrollo

### Convenciones de Código
- **Componentes**: PascalCase
- **Archivos**: PascalCase para componentes
- **Props**: camelCase
- **Estados**: camelCase

### Patrones de Diseño
- **Composición**: Componentes reutilizables
- **Props Drilling**: Evitar cuando sea posible
- **Estado Local**: Para UI, estado global para datos
- **Loading States**: Siempre mostrar feedback visual

---

*Última actualización: Diciembre 2024*
*Versión: 1.0*

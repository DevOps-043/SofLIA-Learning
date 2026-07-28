# Sistema de Diseño SofLIA - Guía de Identidad Visual

## 1. Paleta de Colores

### Colores Principales (Core)

#### 1.1 Azul Profundo - `#0A2540`

- **Psicología**: Transmite seriedad, estabilidad, confianza B2B. Evoca tecnología profesional y confiabilidad.
- **Uso**:
  - Fondos de header
  - Botones primarios
  - Elementos clave de navegación
  - Textos principales en modo claro
  - Bordes y acentos estructurales
- **Aplicación**: Color principal de la marca, representa la base tecnológica sólida.

#### 1.2 Aqua / Verde Azulado - `#00D4B3`

- **Psicología**: Evoca crecimiento, innovación, frescura. Representa aprendizaje activo e IA viva.
- **Uso**:
  - Acentos y resaltes en UI
  - Estado activo de elementos
  - Barras de progreso
  - Métricas positivas
  - Elementos asociados a LIA (asistente de IA)
  - Enlaces y acciones destacadas
- **Aplicación**: Color de acción y dinamismo, representa el aprendizaje continuo.

#### 1.3 Blanco / Casi Blanco - `#FFFFFF`

- **Psicología**: Sensación de espacio, transparencia, foco. Claridad y orden.
- **Uso**:
  - Fondos de tarjetas
  - Áreas de lectura
  - Pantallas principales en modo claro
  - Textos sobre fondos oscuros
  - Espacios negativos para respiración visual
- **Aplicación**: Base para contraste y legibilidad.

### Colores Secundarios

#### 2.1 Verde Suave - `#10B981`

- **Psicología**: Logro, progreso, éxito, completado.
- **Uso**:
  - Estados de éxito
  - Indicadores de completado
  - "Objetivo alcanzado"
  - Badges de logro
  - Confirmaciones positivas

#### 2.2 Amarillo Ámbar Suave - `#F59E0B`

- **Psicología**: Alerta, foco, atención, advertencia suave.
- **Uso**:
  - Notificaciones importantes
  - Módulos pendientes
  - Riesgos detectados
  - Estados de advertencia (no críticos)
  - Recordatorios

#### 2.3 Grises Neutros

**Gris Claro - `#E9ECEF`**

- **Uso**:
  - Fondos secundarios
  - Separadores sutiles
  - Bordes suaves
  - Estados hover suaves

**Gris Medio - `#6C757D`**

- **Uso**:
  - Textos secundarios
  - Iconos deshabilitados
  - Separar secciones
  - Estructurar tablas
  - Mantener look limpio

### Colores para Modo Oscuro

#### Fondo Principal Oscuro - `#0F1419`

- **Uso**: Fondo principal de la aplicación en modo oscuro
- **Psicología**: Profundidad, enfoque, reduce fatiga visual

#### Fondo Secundario Oscuro - `#1E2329`

- **Uso**:
  - Tarjetas y modales en modo oscuro
  - Fondos de secciones secundarias
  - Superficies elevadas

#### Fondo Terciario Oscuro - `#0A0D12`

- **Uso**:
  - Fondos de elementos anidados
  - Áreas de menor jerarquía visual

## 2. Tipografía

### Familias del sistema

- **Newsreader**: títulos editoriales y encabezados de página.
- **Inter Tight**: navegación, botones, formularios, párrafos y contenido de interfaz.
- **IBM Plex Sans**: etiquetas, tablas, métricas, fechas y datos.
- **Monoespaciada del sistema**: código, identificadores técnicos y claves.

Esta jerarquía aplica a la página pública, autenticación, Business, Super Admin,
cursos, usuarios, certificados, estadísticas y cualquier panel nuevo.

### Escala Tipográfica

#### Títulos

**H1 - Título Principal**

- **Familia**: Newsreader
- **Peso**: Light (300)
- **Tamaño**: 40px (2.5rem)
- **Line Height**: 1.1
- **Tracking**: -0.025em
- **Uso**: Títulos principales de página y encabezados de panel

**H2 - Título de Sección**

- **Familia**: Newsreader
- **Peso**: Light (300)
- **Tamaño**: 28px (1.75rem)
- **Line Height**: 1.2
- **Tracking**: -0.025em
- **Uso**: Títulos de secciones principales

**H3–H6 - Títulos de Contenido**

- **Familia**: Newsreader
- **Peso**: Regular (400)
- **Tracking**: -0.015em
- **Uso**: Tarjetas, modales y agrupaciones internas

#### Subtítulos

**Subtítulo / Secciones**

- **Familia**: Inter Tight
- **Peso**: Medium (500)
- **Tamaño**: 20px (1.25rem)
- **Line Height**: 1.4
- **Uso**: Subtítulos de secciones, encabezados de tarjetas

#### Cuerpo de Texto

**Body - Texto Principal**

- **Familia**: Inter Tight
- **Peso**: Regular (400)
- **Tamaño**: 16px (1rem)
- **Line Height**: 1.5
- **Uso**: Párrafos, contenido principal, descripciones

**Body Small - Texto Secundario**

- **Familia**: Inter Tight
- **Peso**: Regular (400)
- **Tamaño**: 14px (0.875rem)
- **Line Height**: 1.5
- **Uso**: Textos secundarios, metadata, captions

#### UI Elements

**UI - Elementos de Interfaz**

- **Familia**: Inter Tight
- **Peso**: Medium (500)
- **Tamaño**: 14px (0.875rem)
- **Line Height**: 1.4
- **Uso**: Botones, navegación y elementos interactivos

**Labels y Datos**

- **Familia**: IBM Plex Sans
- **Peso**: Medium (500)
- **Tamaño**: 12px (0.75rem)
- **Line Height**: 1.4
- **Uso**: Labels, badges, tablas, métricas, fechas y metadatos

## 3. Iconografía

### Estilo de Iconos

- **Estilo**: Line icons con peso medio (1.5-2px)
- **Tamaño estándar**: 20px, 24px, 32px
- **Color**:
  - Primario: `#0A2540` (modo claro) / `#FFFFFF` (modo oscuro)
  - Acento: `#00D4B3` para estados activos
  - Secundario: `#6C757D` para iconos deshabilitados
- **Familia recomendada**: Lucide Icons (ya implementada)

### Uso de Iconos

- **Navegación**: Iconos claros y reconocibles
- **Acciones**: Iconos de acción con color acento cuando están activos
- **Estados**: Iconos que cambian de color según el estado (activo, deshabilitado, error)

## 4. Estilo Gráfico

### Recursos Visuales

- **Abstracciones tecnológicas**: Nodos, redes, capas superpuestas, flujos
- **Patrones modulares**: Rejillas, bloques y tarjetas que se ensamblan
- **Grafismos de IA**: Líneas curvas que conectan puntos, gradientes sutiles

### Texturas y Patrones

- **Fondos sutiles**: Malla de nodos o capas traslúcidas para secciones clave
- **Prioridad**: Superficies limpias con patrones ligeros
- **Evitar**: Texturas ruidosas que compitan con el contenido

### Tratamiento de Imágenes

- **Ilustración**: Vectorial o 3D suave, formas redondeadas
- **Personas**: Representación inclusiva y diversa
- **Contexto**: Enfocado en contextos laborales reales
- **Uso en UI**: Estados vacíos, onboarding, mensajes de LIA, marketing

## 5. Principios de Diseño

### Filosofía Visual

- **Cool**: Estética moderna y sofisticada
- **Tecnológico**: Evoca innovación sin ser frío
- **Humano**: Accesible y acogedor
- **Limpio**: Espacios bien organizados, sin saturación visual

### Contraste y Legibilidad

- **Ratio mínimo**: 4.5:1 para texto normal, 3:1 para texto grande
- **Fondos**: Usar colores sólidos o gradientes sutiles
- **Textos**: Alto contraste sobre fondos oscuros/claros según el modo

### Espaciado

- **Sistema de 8px**: Base para todos los espaciados
- **Consistencia**: Mantener espaciados uniformes entre elementos relacionados
- **Respiración**: Espacios generosos para mejorar legibilidad

## 6. Aplicación en Componentes

### Botones

- **Primario**: Fondo `#0A2540`, texto blanco, hover `#0d2f4d`
- **Secundario**: Borde `#0A2540`, texto `#0A2540`, hover fondo `#0A2540`
- **Acento**: Fondo `#00D4B3`, texto blanco o `#0A2540`
- **Ghost**: Transparente, texto según contexto

### Tarjetas

- **Fondo**: Blanco (modo claro) / `#1E2329` (modo oscuro)
- **Borde**: Sutil, `#E9ECEF` (modo claro) / `#6C757D` (modo oscuro)
- **Sombra**: Sutil para elevación
- **Radio**: 12px-16px para esquinas redondeadas

### Enlaces

- **Color**: `#00D4B3` (aqua)
- **Hover**: Subrayado o cambio de opacidad
- **Visitado**: Mismo color con opacidad reducida

### Estados

- **Activo**: `#00D4B3` (aqua)
- **Éxito**: `#10B981` (verde suave)
- **Advertencia**: `#F59E0B` (ámbar suave)
- **Error**: Rojo suave (definir según necesidad)
- **Deshabilitado**: `#6C757D` con opacidad reducida

## 7. Aplicación a Producto Digital (UI/UX)

### 7.1 Estilo General de la Interfaz

#### Botones

- **Primarios**:
  - Relleno sólido en azul profundo (`#0A2540`)
  - Bordes ligeramente redondeados (12px-16px)
  - Texto blanco para máximo contraste
  - Hover con ligera elevación y cambio de tono

- **Secundarios**:
  - Borde visible y fondo blanco
  - Mantienen jerarquía clara sin competir con primarios
  - Texto en azul profundo para coherencia

#### Tarjetas

- **Uso intensivo** para:
  - Rutas de aprendizaje
  - Cápsulas de contenido
  - Recomendaciones de LIA
  - Módulos educativos

- **Características**:
  - Sombras suaves y consistentes (no dramáticas)
  - Bordes sutiles para definición
  - Espaciado generoso interno
  - Hover sutil para interactividad

#### Fondos y Grillas

- **Fondos claros**:
  - Mucho espacio en blanco para respiración visual
  - Fondos neutros que no compiten con el contenido
  - Transiciones suaves entre secciones

- **Sistema de grillas**:
  - Grilla de 12 columnas para dashboards y paneles
  - Mantiene orden y consistencia
  - Responsive con breakpoints claros

#### Coherencia entre Pantallas

**Dashboards (Pantallas Densas)**:

- Layouts de 2-3 columnas con tarjetas de datos
- Overview primero, detalle en clic
- KPIs clave visibles de inmediato
- Gráficos secundarios organizados jerárquicamente

**Módulos de Aprendizaje (Pantallas Ligeras)**:

- Vistas más enfocadas
- Un solo foco de atención por pantalla
- Elementos de distracción mínimos
- Navegación clara y simple

### 7.2 Uso de Color en UI

#### Jerarquía de Información

- **Elementos clave**:
  - Botones primarios: Azul profundo (`#0A2540`)
  - Acciones principales: Azul profundo
  - Progresos relevantes: Azul profundo o Aqua (`#00D4B3`)

- **Métricas y estados positivos**:
  - Progreso: Verde suave (`#10B981`) o Aqua (`#00D4B3`)
  - Completado: Verde suave
  - Logros: Aqua para destacar

- **Tipografía**:
  - Texto principal: Casi negro / gris muy oscuro (`#0A2540` o `#1E2329`)
  - Texto secundario: Grises medios (`#6C757D`)
  - Texto deshabilitado: Gris claro con opacidad reducida

#### Colores para Estados

- **Éxito**: Verde suave (`#10B981`)
  - Completado, guardado, confirmado
  - Badges de logro
  - Indicadores de progreso positivo

- **Alerta / Riesgo**: Ámbar (`#F59E0B`)
  - Notificaciones importantes
  - Módulos pendientes
  - Advertencias no críticas

- **Información**: Aqua / Azul claro (`#00D4B3`)
  - Mensajes informativos
  - Tips y sugerencias
  - Estados activos

- **Error crítico**: Rojo moderado
  - Reservado solo para mensajes realmente importantes
  - Errores que requieren acción inmediata
  - No usar para advertencias menores

#### Acciones Primarias vs. Secundarias

- **Primaria**:
  - Botón sólido con color de alta saturación
  - Máxima visibilidad y contraste
  - Acción principal de la pantalla

- **Secundaria**:
  - Contorno o texto solamente
  - Nunca compiten en saturación con primarias
  - Mantienen jerarquía visual clara

#### Espacio Conversacional de LIA

- **Burbujas de chat**:
  - Mensajes de LIA: Acento de color Aqua (`#00D4B3`)
  - Mensajes del usuario: Neutro (gris/blanco)
  - Diferenciación clara entre emisor y receptor

- **Características del espacio**:
  - Tipografía muy legible (Inter Tight, 16px mínimo)
  - Líneas de tiempo organizadas
  - Opciones rápidas: chips y botones accesibles
  - "Lugar seguro y claro" para interacción

### 7.3 Principios de Diseño

#### 1. Siempre Explicable

**Principio**: El sistema debe explicar por qué recomienda algo.

**Ejemplo**:

- En el panel de ruta de aprendizaje, cada módulo incluye "¿por qué lo ves?" con una breve explicación
- LIA siempre justifica sus recomendaciones
- Los filtros muestran el impacto de su selección

#### 2. Datos Primero, Ruido Mínimo

**Principio**: Mostrar lo esencial de un vistazo, sin adornos innecesarios.

**Ejemplo**:

- En el dashboard, KPIs clave (progreso, adopción, impacto) arriba
- Gráficos secundarios abajo
- Información accesible pero no abrumadora

#### 3. No Abrumar con Visualizaciones

**Principio**: Gráficos simples, con foco; nada de dashboards "árbol de Navidad".

**Ejemplo**:

- En el panel de analítica, preferir un gráfico principal con filtros claros
- Evitar cinco gráficos pequeños e ilegibles
- Calidad sobre cantidad en visualizaciones

#### 4. Un Solo Foco por Pantalla

**Principio**: Cada vista debe tener una acción principal clara.

**Ejemplo**:

- En la cápsula de microaprendizaje, reducir opciones a:
  - "Completar" (acción principal)
  - "Guardar para después" (secundaria)
  - "Ver recursos relacionados" (terciaria)

#### 5. Lenguaje y Visual Alineados

**Principio**: Lo que se ve y lo que se lee deben contar la misma historia.

**Ejemplo**:

- Si LIA habla de "ruta simplificada", la interfaz muestra:
  - Menos pasos visibles
  - Solo módulos esenciales resaltados
  - Navegación más directa

#### 6. Personalización Visible

**Principio**: Que el usuario perciba que la experiencia está hecha para él/ella.

**Ejemplo**:

- En el panel personal, mostrar:
  - Rol del usuario
  - Metas establecidas
  - Competencias foco
  - "Próximo mejor paso" destacado

#### 7. Consistencia ante Todo

**Principio**: Patrones repetibles de botones, tarjetas, iconos y estilos de gráficos.

**Ejemplo**:

- Las cápsulas de microaprendizaje tienen siempre los mismos elementos:
  - Duración
  - Formato
  - Objetivo
  - Nivel
- En el mismo orden y posición
- Mismos estilos de interacción

### 7.4 Guías de Implementación

#### Componentes Reutilizables

- **Tarjetas de módulo**: Estructura consistente con título, descripción, duración, nivel
- **Botones de acción**: Variantes claramente definidas (primario, secundario, acento)
- **Indicadores de progreso**: Barras y círculos con colores consistentes
- **Burbujas de chat**: Estilos diferenciados para LIA y usuario

#### Patrones de Navegación

- **Breadcrumbs**: Para rutas de aprendizaje complejas
- **Tabs**: Para alternar entre vistas relacionadas
- **Sidebar**: Para navegación principal en dashboards
- **Bottom navigation**: Para móviles en vistas principales

#### Feedback Visual

- **Estados de carga**: Spinners sutiles, skeletons para contenido
- **Confirmaciones**: Toasts no intrusivos, modales para acciones críticas
- **Errores**: Mensajes claros con acciones sugeridas
- **Éxito**: Confirmaciones breves y celebratorias

## 8. Patrón de Modales: Split Panel Modal (SofLIA)

### 8.1 Descripción

El **Split Panel Modal** es el patrón de diseño oficial para todos los modales complejos en SofLIA. Inspirado en el estilo de Notion y Linear, proporciona una experiencia de usuario premium y consistente.

### 8.2 Características del Patrón

#### Estructura de Dos Columnas

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────────┬────────────────────────────────┐  │
│  │              │                                │  │
│  │   PREVIEW    │           FORM                 │  │
│  │   PANEL      │           PANEL                │  │
│  │   (320px)    │           (flex-1)             │  │
│  │              │                                │  │
│  │  - Avatar    │  - Header con título           │  │
│  │  - Info      │  - Campos del formulario       │  │
│  │  - Stats     │  - Secciones organizadas       │  │
│  │  - Actions   │  - Footer con botones          │  │
│  │              │                                │  │
│  └──────────────┴────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Panel Izquierdo (Preview)

- **Ancho fijo**: `320px` (`w-80`)
- **Contenido**:
  - Icono o avatar con animación
  - Título contextual
  - Preview en tiempo real de los datos
  - Información secundaria
  - Botones de acción secundaria
- **Estilo**: Gradiente sutil usando colores de la organización
- **Fondo**: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)`

#### Panel Derecho (Form)

- **Ancho flexible**: `flex-1`
- **Secciones**:
  1. **Header**: Título, subtítulo y botón de cerrar
  2. **Content**: Campos del formulario con scroll
  3. **Footer**: Botones de acción (Cancelar, Guardar)

### 8.3 Especificaciones Técnicas

#### Backdrop

```tsx
// SIN fondo - Transparente
<motion.div className="absolute inset-0" onClick={onClose} />

// O con glassmorphism suave (opcional)
<motion.div
  className="absolute inset-0 backdrop-blur-md"
  style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
  onClick={onClose}
/>
```

#### Contenedor Principal

```tsx
<div
  className="fixed inset-0 flex items-center justify-center"
  style={{ zIndex: 99999 }}
>
```

#### Modal Box

```tsx
<div
  className="rounded-2xl shadow-2xl overflow-hidden border border-white/10"
  style={{ backgroundColor: "var(--org-card-background, #1a1f2e)" }}
>
  <div className="flex min-h-[550px]">
    {/* Left Panel */}
    <div
      className="w-80 p-8 border-r border-white/5"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)`,
      }}
    >
      ...
    </div>

    {/* Right Panel */}
    <div className="flex-1 flex flex-col">...</div>
  </div>
</div>
```

### 8.4 Elementos del Preview Panel

#### Avatar/Icono Animado

```tsx
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  className="relative"
>
  <div
    className="w-24 h-24 rounded-2xl flex items-center justify-center"
    style={{
      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
      boxShadow: `0 8px 30px ${primaryColor}40`,
    }}
  >
    {/* Contenido del avatar */}
  </div>

  {/* Badge animado */}
  <motion.div
    animate={{ scale: [1, 1.2, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
    className="absolute -top-2 -right-2 w-8 h-8 rounded-full"
    style={{ backgroundColor: accentColor }}
  >
    <Sparkles className="w-4 h-4 text-white" />
  </motion.div>
</motion.div>
```

### 8.5 Colores y Theming

Los modales **DEBEN** usar los colores personalizados de la organización:

```tsx
const { styles } = useOrganizationStylesContext();
const panelStyles = styles?.panel;

const primaryColor = panelStyles?.primary_button_color || "#0EA5E9";
const accentColor = panelStyles?.accent_color || "#10B981";
```

#### Aplicación de Colores

- **Gradientes de botones**: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
- **Sombras**: `0 4px 15px ${primaryColor}40`
- **Badges y estados activos**: `backgroundColor: ${primaryColor}20`
- **Bordes activos**: `borderColor: ${primaryColor}`

### 8.6 Inputs y Campos

#### Estilo de Input

```tsx
<input
  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 
             text-white placeholder-white/30 focus:outline-none focus:border-white/20 
             transition-colors"
/>
```

#### Input con Icono

```tsx
<div className="relative">
  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
  <input className="pl-10 ..." />
</div>
```

### 8.7 Botones del Footer

```tsx
{
  /* Botón Cancelar */
}
<button
  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 
                   hover:text-white hover:bg-white/5 transition-colors"
>
  Cancelar
</button>;

{
  /* Botón Principal */
}
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
  style={{
    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
    boxShadow: `0 4px 15px ${primaryColor}40`,
  }}
>
  Acción Principal
</motion.button>;
```

### 8.8 Modales Implementados con este Patrón

| Modal             | Archivo                        | Descripción                             |
| ----------------- | ------------------------------ | --------------------------------------- |
| Crear Equipo      | `BusinessTeamModal.tsx`        | Crear/editar equipos de trabajo         |
| Agregar Usuario   | `BusinessAddUserModal.tsx`     | Agregar nuevo usuario a la organización |
| Importar Usuarios | `BusinessImportUsersModal.tsx` | Importar usuarios desde CSV             |

### 8.9 Cuándo Usar Este Patrón

✅ **Usar Split Panel Modal para:**

- Formularios de creación/edición con múltiples campos
- Acciones que requieren preview o visualización previa
- Wizards o procesos de varios pasos
- Modales con acciones secundarias

❌ **NO usar para:**

- Confirmaciones simples (usar Alert Dialog)
- Mensajes de éxito/error (usar Toast)
- Pop-ups informativos breves (usar Popover)

## 9. Patrón de Dropdowns: Premium Dropdown (SofLIA)

### 9.1 Descripción

El **Premium Dropdown** es el patrón de diseño oficial para todos los selectores y filtros en SofLIA. Reemplaza los elementos `<select>` nativos del navegador con dropdowns personalizados que mantienen consistencia visual con el resto de la aplicación.

### 9.2 Características del Patrón

- **Diseño oscuro** consistente con el tema de la organización
- **Animaciones suaves** con Framer Motion
- **Indicador visual** de opción seleccionada
- **Icono de chevron animado** que rota al abrir/cerrar
- **Bordes dinámicos** que cambian cuando hay una selección activa

### 9.3 Estructura del Componente

```tsx
// Estado para controlar visibilidad
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const [selectedValue, setSelectedValue] = useState("all");

// Opciones del dropdown
const options = [
  { value: "all", label: "Todas las opciones" },
  { value: "option1", label: "Opción 1" },
  { value: "option2", label: "Opción 2" },
];
```

### 9.4 Especificaciones Técnicas

#### Botón Trigger

```tsx
<div className="relative min-w-[160px]">
  <button
    type="button"
    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
    className="w-full px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-2 transition-all duration-300"
    style={{
      backgroundColor: "var(--org-card-background, #1E2329)",
      borderColor:
        selectedValue !== "all" ? primaryColor : "rgba(255,255,255,0.1)",
      color: "var(--org-text-color, #FFFFFF)",
    }}
  >
    <span className="text-sm">
      {options.find((o) => o.value === selectedValue)?.label}
    </span>
    <motion.svg
      animate={{ rotate: isDropdownOpen ? 180 : 0 }}
      className="w-4 h-4 opacity-50"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </motion.svg>
  </button>

  {/* Menu desplegable */}
</div>
```

#### Menú Desplegable con Animación

```tsx
<AnimatePresence>
  {isDropdownOpen && (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden shadow-2xl z-50"
      style={{
        backgroundColor: "var(--org-card-background, #1E2329)",
        borderColor: "rgba(255,255,255,0.15)",
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            setSelectedValue(option.value);
            setIsDropdownOpen(false);
          }}
          className={`w-full px-4 py-3 text-left text-sm transition-colors ${
            selectedValue === option.value
              ? "text-white"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
          style={
            selectedValue === option.value
              ? { backgroundColor: `${primaryColor}30` }
              : {}
          }
        >
          {option.label}
        </button>
      ))}
    </motion.div>
  )}
</AnimatePresence>
```

### 9.5 Estilos y Tokens

#### Contenedor Principal

| Propiedad   | Valor      |
| ----------- | ---------- |
| `min-width` | `160px`    |
| `position`  | `relative` |

#### Botón Trigger

| Propiedad                 | Valor                                 |
| ------------------------- | ------------------------------------- |
| `padding`                 | `14px 16px` (`py-3.5 px-4`)           |
| `border-radius`           | `12px` (`rounded-xl`)                 |
| `border-width`            | `2px`                                 |
| `background`              | `var(--org-card-background, #1E2329)` |
| `border-color (inactivo)` | `rgba(255,255,255,0.1)`               |
| `border-color (activo)`   | `${primaryColor}`                     |

#### Menú Desplegable

| Propiedad       | Valor                    |
| --------------- | ------------------------ |
| `margin-top`    | `8px` (`mt-2`)           |
| `border-radius` | `12px` (`rounded-xl`)    |
| `border-color`  | `rgba(255,255,255,0.15)` |
| `box-shadow`    | `shadow-2xl`             |
| `z-index`       | `50`                     |

#### Opciones

| Estado       | Background               | Text Color              |
| ------------ | ------------------------ | ----------------------- |
| Normal       | `transparent`            | `rgba(255,255,255,0.7)` |
| Hover        | `rgba(255,255,255,0.05)` | `white`                 |
| Seleccionado | `${primaryColor}30`      | `white`                 |

### 9.6 Animaciones

#### Chevron Icon

```tsx
animate={{ rotate: isDropdownOpen ? 180 : 0 }}
```

#### Menú Entrada

```tsx
initial={{ opacity: 0, y: -10, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ duration: 0.15 }}
```

#### Menú Salida

```tsx
exit={{ opacity: 0, y: -10, scale: 0.95 }}
```

### 9.7 Comportamiento UX

1. **Click Toggle**: El menú se abre/cierra al hacer clic en el botón
2. **Auto-cierre**: Al seleccionar una opción, el menú se cierra
3. **Múltiples Dropdowns**: Si hay varios dropdowns, al abrir uno se cierra el otro
4. **Indicador Visual**: El borde cambia de color cuando hay una selección diferente a "todos"
5. **Animación de Chevron**: El icono rota 180° para indicar el estado

### 9.8 Ejemplo de Uso con Múltiples Dropdowns

```tsx
const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)

// Al abrir un dropdown, cerrar el otro
onClick={() => {
  setIsRoleDropdownOpen(!isRoleDropdownOpen)
  setIsStatusDropdownOpen(false)  // Cerrar el otro
}}
```

### 9.9 Cuándo Usar Este Patrón

✅ **Usar Premium Dropdown para:**

- Filtros de búsqueda
- Selectores de rol, estado, categoría
- Cualquier selector que reemplace un `<select>` nativo
- Menús de ordenamiento

❌ **NO usar para:**

- Menús de navegación (usar Sidebar o NavigationMenu)
- Acciones contextuales (usar ContextMenu)
- Autocompletado de búsqueda (usar ComboBox con input)

---

## 10. Patrón Premium DatePicker

### 10.1 Descripción

El **Premium DatePicker** es el componente oficial para selección de fechas en SOFIA. Reemplaza el date picker nativo del navegador con un diseño moderno, animado y completamente integrado con los colores de la organización.

### 10.2 Estructura Visual

```
┌─────────────────────────────────────────────────┐
│  📅  Seleccionar fecha                      ✕   │  ← Trigger Button
└─────────────────────────────────────────────────┘

         ↓ (Al hacer clic)

┌─────────────────────────────────────────────────┐
│   ←     Diciembre 2024                      →   │  ← Header con navegación
├─────────────────────────────────────────────────┤
│  Dom  Lun  Mar  Mié  Jue  Vie  Sáb              │  ← Días de la semana
├─────────────────────────────────────────────────┤
│   1    2    3    4    5    6    7               │
│   8    9   10   11   12   13   14               │
│  15   16   17   18   19  [20]  21               │  ← Día seleccionado
│  22   23   24   25   26   27   28               │
│  29   30   31    1    2    3    4               │  ← Días del siguiente mes
├─────────────────────────────────────────────────┤
│   Limpiar                              Hoy      │  ← Footer con acciones
└─────────────────────────────────────────────────┘
```

### 10.3 Componentes

#### Trigger Button

- **Fondo**: `${cardBackground}80`
- **Borde**: `rgba(255,255,255,0.1)` → `primaryColor` cuando está abierto
- **Box Shadow activo**: `0 0 0 3px ${primaryColor}20`
- **Icono de calendario**: Color `primaryColor`
- **Botón X para limpiar**: Visible cuando hay fecha seleccionada

#### Calendar Popup

- **Fondo**: `cardBackground`
- **Borde**: `rgba(255,255,255,0.1)`
- **Sombra**: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${primaryColor}20`
- **Border radius**: `1rem` (16px)
- **Padding**: `1rem`
- **Min-width**: `320px`

### 10.4 Estados de Días

| Estado        | Background          | Color          | Box Shadow                     |
| ------------- | ------------------- | -------------- | ------------------------------ |
| Normal        | `transparent`       | `textColor`    | ninguno                        |
| Hover         | animación scale 1.1 | -              | -                              |
| Hoy           | `${primaryColor}20` | `primaryColor` | + punto indicador              |
| Seleccionado  | `primaryColor`      | `#FFFFFF`      | `0 4px 15px ${primaryColor}40` |
| Otro mes      | opacity: 0.3        | -              | -                              |
| Deshabilitado | -                   | opacity: 0.3   | cursor: not-allowed            |

### 10.5 Animaciones

#### Popup Entrada

```tsx
initial={{ opacity: 0, y: -10, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ type: 'spring', stiffness: 400, damping: 25 }}
```

#### Popup Salida

```tsx
exit={{ opacity: 0, y: -10, scale: 0.95 }}
```

#### Días Hover

```tsx
whileHover={{ scale: 1.1 }}
whileTap={{ scale: 0.9 }}
```

#### Navegación de Mes

```tsx
// Chevron izquierdo
whileHover={{ scale: 1.1, x: -2 }}

// Chevron derecho
whileHover={{ scale: 1.1, x: 2 }}
```

### 10.6 Footer

- **Botón Limpiar**: Texto simple con hover `bg-white/5`
- **Botón Hoy**: Background `${accentColor}20`, color `accentColor`

### 10.7 Props del Componente

```tsx
interface PremiumDatePickerProps {
  value: string; // Formato YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string; // Default: "Seleccionar fecha"
  minDate?: Date; // Fecha mínima permitida
  maxDate?: Date; // Fecha máxima permitida
  disabled?: boolean; // Deshabilitar el picker
  className?: string; // Clases adicionales
}
```

### 10.8 Ejemplo de Uso

```tsx
import { PremiumDatePicker } from '@/features/business-panel/components/PremiumDatePicker'

const [dueDate, setDueDate] = useState('')

<PremiumDatePicker
  value={dueDate}
  onChange={setDueDate}
  placeholder="Fecha límite (opcional)"
  minDate={new Date()}
/>
```

### 10.9 Cuándo Usar Este Patrón

✅ **Usar Premium DatePicker para:**

- Selección de fechas límite
- Filtros de fecha
- Programación de eventos
- Cualquier input de tipo fecha

❌ **NO usar para:**

- Rangos de fecha (crear componente específico)
- Selección de hora (crear TimePicker)

---

**Última actualización**: Diciembre 2024
**Versión**: 1.5

## 11. Patrón de Menú de Usuario: Standard User Dropdown

### 11.1 Descripción

El **Standard User Dropdown** es el componente de menú de usuario unificado para toda la plataforma SOFIA. Sigue el diseño implementado en el **Business Panel**, garantizando consistencia visual, animaciones fluidas y una estructura clara de información.

### 11.2 Características del Patrón

- **Contenedor Flotante Premium**: Uso de `backdrop-blur`, bordes sutiles y sombras elevadas.
- **Cabecera de Usuario**: Sección destacada con avatar (con anillo de color), nombre y rol.
- **Animaciones**: Entrada/salida suave con escalado y opacidad usando Framer Motion.
- **Iconografía Consistente**: Uso de iconos Lucide con opacidad reducida (70%) que se aclaran al hover.
- **Micro-interacciones**: Efecto de deslizamiento (`x: 2`) al hacer hover en las opciones.

### 11.3 Estructura del Componente

```tsx
// Dropdown Menu Container
<motion.div
  initial={{ opacity: 0, y: -8, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -8, scale: 0.95 }}
  className="absolute right-0 mt-2 w-56 rounded-xl border backdrop-blur-xl shadow-xl z-[999] overflow-hidden"
  style={{
    backgroundColor: 'var(--bg-panel, rgba(15, 23, 42, 0.85))',
    borderColor: 'var(--border-panel, rgba(71, 85, 105, 0.3))'
  }}
>
  {/* 1. Header de Usuario */}
  <div className="px-4 py-3 border-b border-white/10">
    <div className="flex items-center gap-3">
      {/* Avatar con Ring de Gradiente */}
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center ring-2 ring-white/20"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-active))' }}
      >
        <img src={user.avatar} className="h-full w-full rounded-full object-cover" />
      </div>

      {/* Detalle Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate text-white">
          {user.name}
        </p>
        <p className="text-xs truncate opacity-70 text-white">
          {user.role}
        </p>
      </div>
    </div>
  </div>

  {/* 2. Opciones del Menú */}
  <div className="py-1.5">
    <MenuOption icon={LayoutDashboard} label="Panel Principal" onClick={...} />
    <MenuOption icon={User} label="Editar Perfil" onClick={...} />

    {/* Submenú (ej. Idioma) */}
    <div className="relative">
       <MenuOption icon={Globe} label="Idioma" hasSubmenu />
       {/* Lógica de submenú recursivo o expandible */}
    </div>

    <div className="my-1 border-t border-white/10" />

    <MenuOption icon={LogOut} label="Cerrar Sesión" isDestructive onClick={handleLogout} />
  </div>
</motion.div>
```

### 11.4 Componente de Opción (Menu Item)

```tsx
const MenuOption = ({ icon: Icon, label, onClick, isDestructive }) => (
  <motion.button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors 
      ${isDestructive ? "text-red-400 hover:opacity-80" : "text-white/80 hover:bg-white/5"}`}
    whileHover={{ x: 2 }}
  >
    <Icon className="h-4 w-4 opacity-70" />
    <span>{label}</span>
  </motion.button>
);
```

### 11.5 Especificaciones Visuales

#### Contenedor

- **Ancho**: `w-56` (224px)
- **Radio**: `rounded-xl` (12px)
- **Fondo**: Se recomienda usar colores con transparencia (alpha 0.85 - 0.95) para el efecto backdrop.
- **Z-Index**: `z-[999]` para asegurar que flote sobre otros elementos UI.

#### Avatar en Header

- **Tamaño**: `h-10 w-10` (40px)
- **Anillo**: `ring-2` con color sutil (`white/20`) para separar del fondo.
- **Fondo de fallback**: Gradiente lineal entre el color primario y secundario de la marca.

#### Tipografía

- **Nombre**: `text-sm font-semibold`
- **Rol/Email**: `text-xs opacity-70`

### 11.6 Implementación de Referencia

Para ver la implementación "canonical" de este diseño, consultar archivo:
`apps/web/src/features/business-panel/components/BusinessPanelHeader.tsx`

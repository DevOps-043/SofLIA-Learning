export type UserRole = 'usuario' | 'instructor' | 'administrador' | 'business' | 'business user' | null;

export interface PageMetadata {
  path: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  availableActions: string[];
  relatedPages: string[];
  // Campos adicionales para mayor detalle
  features?: string[]; // Funcionalidades específicas (búsqueda, filtros, etc.)
  contentSections?: string[]; // Secciones de contenido dentro de la página
  specialNotes?: string; // Notas importantes (ej: "Los reels están en pestaña dentro de noticias")
  // Control de acceso por roles
  allowedRoles?: UserRole[]; // Roles que pueden acceder a esta página. Si no se especifica, todos pueden acceder
  isAdminOnly?: boolean; // Si es true, solo administradores pueden acceder
  isBusinessOnly?: boolean; // Si es true, solo usuarios business pueden acceder
}

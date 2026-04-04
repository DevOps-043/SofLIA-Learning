// Base scalar types
export type UserType = 'b2b' | 'b2c';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type SessionType = 'short' | 'medium' | 'long';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type CalendarProvider = 'google' | 'microsoft';
export type PlanGenerationMode = 'manual' | 'ai_generated';

// Professional profile
export interface UserRole {
  id: number;
  slug: string;
  nombre: string;
  areaId?: number;
}

export interface UserArea {
  id: number;
  slug: string;
  nombre: string;
}

export interface UserNivel {
  id: number;
  slug: string;
  nombre: string;
}

export interface EmpresaTamano {
  id: number;
  slug: string;
  nombre: string;
  minEmpleados?: number;
  maxEmpleados?: number;
}

export interface UserSector {
  id: number;
  slug: string;
  nombre: string;
}

export interface UserRelacion {
  id: number;
  slug: string;
  nombre: string;
}

export interface UserProfessionalProfile {
  cargoTitulo?: string;
  rol?: UserRole;
  nivel?: UserNivel;
  area?: UserArea;
  tamanoEmpresa?: EmpresaTamano;
  sector?: UserSector;
  relacion?: UserRelacion;
  pais?: string;
  dificultadId?: number;
  usoIaRespuesta?: string;
}

// Organization & team (B2B)
export interface OrganizationInfo {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  plan?: string;
}

export interface WorkTeam {
  teamId: string;
  name: string;
  description?: string;
  role: 'member' | 'leader' | 'co-leader';
  status: 'active' | 'inactive';
  courseId?: string;
  memberCount?: number;
}

// Basic user info
export interface UserBasicInfo {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profilePictureUrl?: string;
  cargoRol?: string;
  typeRol?: string;
}

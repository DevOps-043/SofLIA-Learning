import type { ScormPackage, SCORMVersion } from './types'

export interface SCORMAdapterConfig {
  packageId: string;
  version: SCORMVersion;
  onError?: (error: string) => void;
  onComplete?: (status: string, score?: number) => void;
}

export interface SCORMPlayerProps {
  packageId: string;
  version: SCORMVersion;
  storagePath: string;
  entryPoint: string;
  onComplete?: (status: string, score?: number) => void;
  onError?: (error: string) => void;
  className?: string;
}

export interface SCORMUploaderProps {
  courseId: string;
  organizationId: string;
  onSuccess?: (packageData: ScormPackage) => void;
  onError?: (error: string) => void;
}

export interface CMIData {
  [key: string]: string;
}

export interface ScormUploadResponse {
  success: boolean;
  package?: ScormPackage;
  error?: string;
}

export interface ScormInitializeResponse {
  success: boolean;
  attemptId?: string;
  cmiData?: CMIData;
  error?: string;
}

export interface ScormRuntimeResponse {
  success: boolean;
  error?: string;
}

export interface ScormPackagesResponse {
  packages: ScormPackage[];
  error?: string;
}

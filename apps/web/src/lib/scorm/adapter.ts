import {
  SCORMVersion,
  SCORMAdapterConfig,
  type ScormInitializeResponse,
} from './types';

interface ScormWindow extends Window {
  API?: SCORMAPIAdapter;
  API_1484_11?: SCORMAPIAdapter;
}

function getScormWindow(win: Window): ScormWindow {
  return win as ScormWindow;
}

export class SCORMAPIAdapter {
  private attemptId: string | null = null;
  private cache: Map<string, string> = new Map();
  private lastError: string = '0';
  private initialized: boolean = false;
  private terminated: boolean = false;
  private config: SCORMAdapterConfig;
  private initPromise: Promise<void> | null = null;

  constructor(config: SCORMAdapterConfig) {
    this.config = config;
  }

  // =====================
  // SCORM 1.2 API
  // =====================

  LMSInitialize(param: string): string {
    if (this.initialized) {
      this.lastError = '101';
      return 'false';
    }

    this.initPromise = this.initializeAsync();
    this.initialized = true;
    return 'true';
  }

  private async initializeAsync() {
    try {
      const res = await fetch('/api/scorm/runtime/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: this.config.packageId })
      });

      const data: ScormInitializeResponse = await res.json();
      if (data.success) {
        this.attemptId = data.attemptId;
        Object.entries(data.cmiData || {}).forEach(([key, value]) => {
          this.cache.set(key, value);
        });
      } else {
        this.config.onError?.('Failed to initialize: ' + data.error);
      }
    } catch (error) {
      this.config.onError?.('Failed to initialize');
    }
  }

  LMSGetValue(key: string): string {
    if (!this.initialized) {
      this.lastError = '301';
      return '';
    }

    const value = this.cache.get(key);
    if (value === undefined) {
      if (key.endsWith('._count')) {
        return '0';
      }
      if (key.endsWith('._children')) {
        return this.getChildrenForKey(key);
      }
      this.lastError = '201';
      return '';
    }

    this.lastError = '0';
    return value;
  }

  private getChildrenForKey(key: string): string {
    const childrenMap: Record<string, string> = {
      'cmi.core._children': 'student_id,student_name,lesson_location,credit,lesson_status,entry,score,total_time,lesson_mode,exit,session_time',
      'cmi.score._children': 'raw,min,max',
      'cmi.core.score._children': 'raw,min,max',
      'cmi.interactions._children': 'id,objectives,time,type,correct_responses,weighting,student_response,result,latency',
    };
    return childrenMap[key] || '';
  }

  LMSSetValue(key: string, value: string): string {
    if (!this.initialized) {
      this.lastError = '301';
      return 'false';
    }

    if (this.terminated) {
      this.lastError = '101';
      return 'false';
    }

    const readOnly = [
      'cmi.core._children', 'cmi.core.student_id', 'cmi.core.student_name',
      'cmi.core.total_time', 'cmi.core.entry', 'cmi.core.lesson_mode',
      'cmi._version', 'cmi.interactions._children', 'cmi.interactions._count'
    ];

    if (readOnly.includes(key)) {
      this.lastError = '403';
      return 'false';
    }

    this.cache.set(key, value);
    this.setValueAsync(key, value);

    // Detectar completado
    if (key === 'cmi.core.lesson_status' || key === 'cmi.completion_status') {
      if (value === 'completed' || value === 'passed' || value === 'failed') {
        const scoreKey = this.config.version === 'SCORM_2004'
          ? 'cmi.score.raw'
          : 'cmi.core.score.raw';
        const score = parseFloat(this.cache.get(scoreKey) || '');
        this.config.onComplete?.(value, isNaN(score) ? undefined : score);
      }
    }

    this.lastError = '0';
    return 'true';
  }

  private async setValueAsync(key: string, value: string) {
    if (!this.attemptId) {
      await this.initPromise;
    }
    if (!this.attemptId) return;

    try {
      await fetch('/api/scorm/runtime/setValue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: this.attemptId,
          key,
          value
        })
      });
    } catch (error) {
      // Silent fail - datos en cache local
    }
  }

  LMSCommit(param: string): string {
    if (!this.initialized || this.terminated) {
      this.lastError = '301';
      return 'false';
    }

    this.commitAsync();
    this.lastError = '0';
    return 'true';
  }

  private async commitAsync() {
    if (!this.attemptId) {
      await this.initPromise;
    }
    if (!this.attemptId) return;

    try {
      await fetch('/api/scorm/runtime/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: this.attemptId })
      });
    } catch (error) {
      // Silent fail
    }
  }

  LMSFinish(param: string): string {
    if (!this.initialized) {
      this.lastError = '301';
      return 'false';
    }

    if (this.terminated) {
      this.lastError = '101';
      return 'false';
    }

    this.terminateAsync();
    this.terminated = true;
    this.lastError = '0';
    return 'true';
  }

  private async terminateAsync() {
    await this.commitAsync();

    try {
      await fetch('/api/scorm/runtime/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: this.attemptId })
      });
    } catch (error) {
      // Silent fail
    }
  }

  LMSGetLastError(): string {
    return this.lastError;
  }

  LMSGetErrorString(errorCode: string): string {
    const errors: Record<string, string> = {
      '0': 'No error',
      '101': 'General exception',
      '201': 'Invalid argument error',
      '202': 'Element cannot have children',
      '203': 'Element not an array - cannot have count',
      '301': 'Not initialized',
      '401': 'Not implemented error',
      '402': 'Invalid set value, element is a keyword',
      '403': 'Element is read only',
      '404': 'Element is write only',
      '405': 'Incorrect data type'
    };
    return errors[errorCode] || 'Unknown error';
  }

  LMSGetDiagnostic(errorCode: string): string {
    return this.LMSGetErrorString(errorCode);
  }

  // =====================
  // SCORM 2004 API (alias)
  // =====================

  Initialize = (param: string) => this.LMSInitialize(param);
  GetValue = (key: string) => this.LMSGetValue(key);
  SetValue = (key: string, value: string) => this.LMSSetValue(key, value);
  Commit = (param: string) => this.LMSCommit(param);
  Terminate = (param: string) => this.LMSFinish(param);
  GetLastError = () => this.LMSGetLastError();
  GetErrorString = (code: string) => this.LMSGetErrorString(code);
  GetDiagnostic = (code: string) => this.LMSGetDiagnostic(code);

  // Métodos de utilidad
  isInitialized(): boolean {
    return this.initialized;
  }

  isTerminated(): boolean {
    return this.terminated;
  }

  getAttemptId(): string | null {
    return this.attemptId;
  }
}

// Inyectar en window
export function initializeSCORMAPI(config: SCORMAdapterConfig): SCORMAPIAdapter {
  const adapter = new SCORMAPIAdapter(config);
  const scormWindow = getScormWindow(window);

  if (config.version === 'SCORM_2004') {
    scormWindow.API_1484_11 = adapter;
  } else {
    scormWindow.API = adapter;
  }

  return adapter;
}

export function cleanupSCORMAPI() {
  const scormWindow = getScormWindow(window);
  delete scormWindow.API;
  delete scormWindow.API_1484_11;
}

// Función para que el SCO encuentre el API
export function findAPI(win: Window): SCORMAPIAdapter | null {
  let findAttempts = 0;
  const findAttemptLimit = 500;
  let currentWindow = getScormWindow(win);

  while (
    currentWindow.API == null &&
    currentWindow.API_1484_11 == null &&
    currentWindow.parent != null &&
    currentWindow.parent != currentWindow
  ) {
    findAttempts++;
    if (findAttempts > findAttemptLimit) {
      return null;
    }
    currentWindow = getScormWindow(currentWindow.parent);
  }

  return currentWindow.API_1484_11 || currentWindow.API || null;
}

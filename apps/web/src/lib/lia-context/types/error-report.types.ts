export interface RecentError {
  component?: string;
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  type: 'console' | 'network' | 'component' | 'api';
  url?: string;
  userId?: string;
}

export interface SimilarBug {
  categoria: string;
  created_at: string;
  descripcion: string;
  estado: string;
  pagina_url?: string;
  titulo: string;
}

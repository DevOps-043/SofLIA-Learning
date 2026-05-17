export interface StatisticsQuestionData {
  section?: string | null;
  bloque?: string | null;
  peso?: number | null;
  escala?: Record<string, number> | null;
  respuesta_correcta?: string | null;
  texto?: string | null;
  dimension?: string[] | null;
}

export interface StatisticsResponseRow {
  valor: unknown;
  preguntas?: StatisticsQuestionData | null;
}

export interface RadarDimensionScore {
  dimension: string;
  score: number;
  rawScore: number;
  maxPossibleScore: number;
}

export interface AnalysisSummary {
  adoption: {
    score: number;
    level: string;
    description: string;
    totalQuestions: number;
  };
  knowledge: {
    score: number;
    correct: number;
    total: number;
    level: string;
    description: string;
  };
}

export interface RecommendationItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

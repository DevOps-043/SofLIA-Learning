import type {
  LessonCompletionDetails,
  LessonProgressApiResponse,
  QuizStatusApiResponse,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseQuizStatusApiResponse(value: unknown): QuizStatusApiResponse {
  if (!isRecord(value)) return {};

  return {
    hasRequiredQuizzes:
      typeof value.hasRequiredQuizzes === "boolean" ? value.hasRequiredQuizzes : undefined,
    allQuizzesPassed:
      typeof value.allQuizzesPassed === "boolean" ? value.allQuizzesPassed : undefined,
    totalRequiredQuizzes:
      typeof value.totalRequiredQuizzes === "number" ? value.totalRequiredQuizzes : undefined,
    passedQuizzes: typeof value.passedQuizzes === "number" ? value.passedQuizzes : undefined,
  };
}

export function parseLessonProgressApiResponse(value: unknown): LessonProgressApiResponse {
  if (!isRecord(value)) return {};

  const progressValue = isRecord(value.progress) ? value.progress : undefined;

  return {
    code: typeof value.code === "string" ? value.code : undefined,
    error: typeof value.error === "string" ? value.error : undefined,
    details: parseLessonCompletionDetails(value.details),
    progress: progressValue
      ? {
          overall_progress:
            typeof progressValue.overall_progress === "number"
              ? progressValue.overall_progress
              : undefined,
        }
      : undefined,
  };
}

export function buildCompletionDetailsText(
  details?: Partial<LessonCompletionDetails>
): string | undefined {
  if (typeof details?.passed !== "number" || typeof details.totalRequired !== "number") {
    return undefined;
  }

  return `Completados: ${details.passed} de ${details.totalRequired}`;
}

function parseLessonCompletionDetails(value: unknown) {
  if (!isRecord(value)) return undefined;

  return {
    totalRequired: typeof value.totalRequired === "number" ? value.totalRequired : undefined,
    passed: typeof value.passed === "number" ? value.passed : undefined,
    message: typeof value.message === "string" ? value.message : undefined,
  };
}

import { CircleHelp, Gauge, Trophy } from "lucide-react";

interface QuizIntroProps {
  passingThreshold: number;
  totalPoints?: number;
  totalQuestions: number;
}

export function QuizIntro({ passingThreshold, totalPoints, totalQuestions }: QuizIntroProps) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-white/85">
        Responde las {totalQuestions} pregunta{totalQuestions !== 1 ? "s" : ""} para completar este quiz.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-gray-400 dark:text-white/40">
        <span className="inline-flex items-center gap-1">
          <CircleHelp className="h-3 w-3" /> {totalQuestions} reactivos
        </span>
        {totalPoints !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3 w-3" /> {totalPoints} puntos
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Gauge className="h-3 w-3" /> Umbral: {passingThreshold}%
        </span>
        <span>
          ({Math.ceil((totalQuestions * passingThreshold) / 100)} de {totalQuestions} para aprobar)
        </span>
      </div>
    </div>
  );
}

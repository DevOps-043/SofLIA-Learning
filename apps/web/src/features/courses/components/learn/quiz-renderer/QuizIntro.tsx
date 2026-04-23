interface QuizIntroProps {
  passingThreshold: number;
  totalPoints?: number;
  totalQuestions: number;
}

export function QuizIntro({
  passingThreshold,
  totalPoints,
  totalQuestions,
}: QuizIntroProps) {
  return (
    <div className="px-4 py-3 border-l-2 border-gray-300 dark:border-white/20">
      <p className="text-gray-600 dark:text-white/60 text-xs mb-1">
        Responde las {totalQuestions} pregunta
        {totalQuestions !== 1 ? "s" : ""} para completar este quiz.
      </p>
      <div className="flex items-center gap-4 text-[10px] text-gray-400 dark:text-white/40">
        {totalPoints !== undefined && <span>{totalPoints} puntos</span>}
        <span>Umbral: {passingThreshold}%</span>
        <span>
          ({Math.ceil((totalQuestions * passingThreshold) / 100)} de{" "}
          {totalQuestions} para aprobar)
        </span>
      </div>
    </div>
  );
}

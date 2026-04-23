import {
  isQuizAnswerCorrect,
  type QuizQuestion,
  type SelectedQuizAnswers,
} from "../quiz.utils";
import { QuizQuestionCard } from "./QuizQuestionCard";

interface QuizQuestionsListProps {
  normalizedQuizData: QuizQuestion[];
  onAnswerSelect: (questionId: string, answer: string | number) => void;
  selectedAnswers: SelectedQuizAnswers;
  showResults: boolean;
}

export function QuizQuestionsList({
  normalizedQuizData,
  onAnswerSelect,
  selectedAnswers,
  showResults,
}: QuizQuestionsListProps) {
  return (
    <div className="space-y-4">
      {normalizedQuizData.map((question, index) => {
        const selectedAnswer = selectedAnswers[question.id];
        const isCorrect =
          selectedAnswer !== undefined &&
          isQuizAnswerCorrect(question, selectedAnswer);

        return (
          <QuizQuestionCard
            key={question.id}
            index={index}
            isCorrect={isCorrect}
            onAnswerSelect={onAnswerSelect}
            question={question}
            selectedAnswer={selectedAnswer}
            showExplanation={showResults && selectedAnswer !== undefined}
            showResults={showResults}
          />
        );
      })}
    </div>
  );
}

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string | number;
  explanation?: string;
  points?: number;
  questionType?: string;
};

export type SelectedQuizAnswers = Record<string, string | number>;

const TRUE_FALSE_OPTIONS = new Set(["verdadero", "falso", "true", "false"]);

function normalizeOption(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeTrueFalse(value: string): string {
  const normalized = normalizeOption(value);

  if (normalized === "true" || normalized === "verdadero") {
    return "verdadero";
  }

  if (normalized === "false" || normalized === "falso") {
    return "falso";
  }

  return normalized;
}

export function isQuizAnswerCorrect(
  question: QuizQuestion,
  selectedAnswer: string | number
): boolean {
  const { correctAnswer, options, questionType } = question;

  if (questionType === "true_false") {
    if (typeof selectedAnswer === "number") {
      const selectedOption = options[selectedAnswer];

      if (typeof correctAnswer === "string") {
        return (
          normalizeTrueFalse(selectedOption) === normalizeTrueFalse(correctAnswer)
        );
      }

      if (typeof correctAnswer === "number") {
        return selectedAnswer === correctAnswer;
      }
    }

    if (typeof selectedAnswer === "string") {
      if (typeof correctAnswer === "string") {
        return (
          normalizeTrueFalse(selectedAnswer) === normalizeTrueFalse(correctAnswer)
        );
      }

      if (typeof correctAnswer === "number") {
        return (
          normalizeTrueFalse(selectedAnswer) ===
          normalizeTrueFalse(options[correctAnswer])
        );
      }
    }

    return false;
  }

  if (typeof selectedAnswer === "number") {
    if (typeof correctAnswer === "number") {
      return selectedAnswer === correctAnswer;
    }

    if (typeof correctAnswer === "string") {
      return (
        normalizeOption(options[selectedAnswer]) === normalizeOption(correctAnswer)
      );
    }
  }

  if (typeof selectedAnswer === "string") {
    if (typeof correctAnswer === "string") {
      return normalizeOption(selectedAnswer) === normalizeOption(correctAnswer);
    }

    if (typeof correctAnswer === "number") {
      return (
        normalizeOption(selectedAnswer) === normalizeOption(options[correctAnswer])
      );
    }
  }

  return false;
}

export function isTrueFalseQuizQuestion(question: QuizQuestion): boolean {
  if (question.questionType === "true_false") {
    return true;
  }

  if (question.options.length !== 2) {
    return false;
  }

  return question.options.every((option) =>
    TRUE_FALSE_OPTIONS.has(normalizeOption(option))
  );
}

export function normalizeQuizQuestions(quizData: QuizQuestion[]): QuizQuestion[] {
  return quizData.map((question) => {
    if (!isTrueFalseQuizQuestion(question)) {
      return question;
    }

    const hasValidOptions =
      Array.isArray(question.options) &&
      question.options.length === 2 &&
      ["Verdadero", "Falso"].includes(question.options[0]) &&
      ["Verdadero", "Falso"].includes(question.options[1]);

    if (hasValidOptions) {
      return question;
    }

    return {
      ...question,
      options: ["Verdadero", "Falso"],
    };
  });
}

function shuffleOptions(
  options: string[],
  random: () => number
): { options: string[]; originalIndexes: number[] } {
  const shuffled = options.map((option, originalIndex) => ({
    option,
    originalIndex,
  }));

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return {
    options: shuffled.map((item) => item.option),
    originalIndexes: shuffled.map((item) => item.originalIndex),
  };
}

export function shuffleQuizQuestions(
  quizData: QuizQuestion[],
  random: () => number = Math.random
): QuizQuestion[] {
  return quizData.map((question) => {
    if (isTrueFalseQuizQuestion(question) || question.options.length < 2) {
      return question;
    }

    const { options, originalIndexes } = shuffleOptions(question.options, random);

    if (options.every((option, index) => option === question.options[index])) {
      return question;
    }

    const correctAnswer =
      typeof question.correctAnswer === "number"
        ? originalIndexes.indexOf(question.correctAnswer)
        : question.correctAnswer;

    return {
      ...question,
      correctAnswer,
      options,
    };
  });
}

export function mapAnswerIndexesToOptionText(
  quizData: QuizQuestion[],
  selectedAnswers: SelectedQuizAnswers
): SelectedQuizAnswers {
  return Object.entries(selectedAnswers).reduce<SelectedQuizAnswers>(
    (mappedAnswers, [questionId, selectedAnswer]) => {
      const question = quizData.find((item) => item.id === questionId);

      if (typeof selectedAnswer === "number" && question) {
        mappedAnswers[questionId] =
          question.options[selectedAnswer] ?? selectedAnswer;
        return mappedAnswers;
      }

      mappedAnswers[questionId] = selectedAnswer;
      return mappedAnswers;
    },
    {}
  );
}

export function calculateQuizResults(
  quizData: QuizQuestion[],
  selectedAnswers: SelectedQuizAnswers
) {
  return quizData.reduce(
    (result, question) => {
      const selectedAnswer = selectedAnswers[question.id];

      if (
        selectedAnswer !== undefined &&
        isQuizAnswerCorrect(question, selectedAnswer)
      ) {
        result.correctCount += 1;
        result.pointsEarned += question.points || 1;
      }

      return result;
    },
    { correctCount: 0, pointsEarned: 0 }
  );
}

export function buildQuizFeedbackPrompt(
  quizData: QuizQuestion[],
  selectedAnswers: SelectedQuizAnswers
): string | null {
  const incorrectQuestions = quizData.filter((question) => {
    const selectedAnswer = selectedAnswers[question.id];
    return (
      selectedAnswer === undefined ||
      !isQuizAnswerCorrect(question, selectedAnswer)
    );
  });

  if (incorrectQuestions.length === 0) {
    return null;
  }

  // El prompt del cliente contiene solo datos: las reglas de comportamiento
  // viven exclusivamente en el system instruction del endpoint de feedback,
  // para evitar instrucciones contradictorias entre cliente y servidor.
  const promptLines = [
    "Ayudame a reflexionar sobre estas preguntas que respondi incorrectamente en el quiz, sin darme las respuestas directamente:",
    "",
  ];

  incorrectQuestions.forEach((question, index) => {
    const selectedAnswer = selectedAnswers[question.id];
    let selectedAnswerText = "No respondio";

    if (selectedAnswer !== undefined) {
      selectedAnswerText =
        typeof selectedAnswer === "number"
          ? question.options[selectedAnswer] || String(selectedAnswer)
          : String(selectedAnswer);
    }

    promptLines.push(
      `${index + 1}. Pregunta: ${question.question}`,
      `   Mi respuesta: ${selectedAnswerText}`,
      ""
    );
  });

  return promptLines.join("\n").trimEnd();
}

export function parseQuizExplanation(
  question: QuizQuestion,
  selectedAnswer: string | number
): string | null {
  const { explanation, options } = question;

  if (!explanation) {
    return null;
  }

  if (!explanation.includes("---")) {
    return explanation;
  }

  const explanationParts = explanation.split("---").map((part) => part.trim());
  const selectedOptionText =
    typeof selectedAnswer === "number"
      ? options[selectedAnswer] || ""
      : selectedAnswer;
  const selectedLetterMatch = selectedOptionText.match(/\(([A-Z])\)/);
  const selectedLetter = selectedLetterMatch?.[1];

  if (!selectedLetter) {
    return explanation;
  }

  for (const part of explanationParts) {
    const feedbackMatch = part.match(
      new RegExp(
        `^\\(${selectedLetter}\\)\\s+(Feedback|Comentarios):?\\s*(.*)`,
        "s"
      )
    );

    if (feedbackMatch) {
      return feedbackMatch[2].trim();
    }
  }

  return explanation;
}

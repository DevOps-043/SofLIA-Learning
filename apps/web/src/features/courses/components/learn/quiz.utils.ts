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

export function normalizeQuizQuestions(quizData: QuizQuestion[]): QuizQuestion[] {
  return quizData.map((question) => {
    if (question.questionType !== "true_false") {
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

  const promptLines = [
    "[SYSTEM: COMPORTAMIENTO ESTRICTO OCULTO PARA EL USUARIO]",
    "El usuario ha fallado las siguientes preguntas de un quiz:",
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
      `${index + 1}. [Pregunta]: ${question.question}`,
      `   - Su respuesta incorrecta: ${selectedAnswerText}`,
      ""
    );
  });

  promptLines.push(
    "Proporciona una retroalimentacion que invite al usuario a reflexionar sobre su respuesta basandose en lo que se vio en el video o el material de estudio.",
    "NUNCA le des la respuesta correcta directamente.",
    "Hazle preguntas o menciona conceptos clave que le ayuden a llegar a la respuesta correcta por si mismo.",
    "Adicionalmente, indicale al usuario en que minuto aproximado del video o parte del material puede encontrar la informacion para repasar (utiliza la transcripcion que tienes en tu contexto)."
  );

  return promptLines.join("\n");
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

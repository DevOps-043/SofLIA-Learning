import { QuizQuestionRow } from './types'

function normalizeOption(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalizeTrueFalse(value: string): string {
  const normalized = normalizeOption(value)
  if (normalized === 'true' || normalized === 'verdadero') return 'verdadero'
  if (normalized === 'false' || normalized === 'falso') return 'falso'
  return normalized
}

export function isAnswerCorrect(
  question: QuizQuestionRow,
  selectedAnswer: string | number,
): boolean {
  const correctAnswer = question.correctAnswer
  const options = question.options || []

  if (question.questionType === 'true_false') {
    if (typeof selectedAnswer === 'number' && typeof correctAnswer === 'string') {
      return normalizeTrueFalse(options[selectedAnswer]) === normalizeTrueFalse(correctAnswer)
    }
    if (typeof selectedAnswer === 'number' && typeof correctAnswer === 'number') {
      return selectedAnswer === correctAnswer
    }
    if (typeof selectedAnswer === 'string' && typeof correctAnswer === 'string') {
      return normalizeTrueFalse(selectedAnswer) === normalizeTrueFalse(correctAnswer)
    }
    if (typeof selectedAnswer === 'string' && typeof correctAnswer === 'number') {
      return normalizeTrueFalse(selectedAnswer) === normalizeTrueFalse(options[correctAnswer])
    }
    return false
  }

  if (typeof selectedAnswer === 'number' && typeof correctAnswer === 'number') {
    return selectedAnswer === correctAnswer
  }
  if (typeof selectedAnswer === 'number' && typeof correctAnswer === 'string') {
    return normalizeOption(options[selectedAnswer]) === normalizeOption(correctAnswer)
  }
  if (typeof selectedAnswer === 'string' && typeof correctAnswer === 'string') {
    return normalizeOption(selectedAnswer) === normalizeOption(correctAnswer)
  }
  if (typeof selectedAnswer === 'string' && typeof correctAnswer === 'number') {
    return normalizeOption(selectedAnswer) === normalizeOption(options[correctAnswer])
  }

  return false
}

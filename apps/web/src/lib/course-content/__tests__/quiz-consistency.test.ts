import { describe, expect, it } from 'vitest'

import { findQuizAnswerKeyConflict } from '../quiz-consistency'

const CEB_OPTIONS = [
  'El Solucionador de Problemas',
  'El Constructor de Relaciones',
  'El Trabajador Diligente',
  'El Challenger',
]

describe('findQuizAnswerKeyConflict', () => {
  it('detecta el conflicto real: explicación declara B pero el key marca otra opción', () => {
    const conflict = findQuizAnswerKeyConflict({
      correctAnswer: 'El Challenger',
      explanation:
        "La opción correcta es B. El estudio de CEB/Gartner identificó al 'Constructor de " +
        "Relaciones' como el perfil de vendedor con el rendimiento más bajo en ventas B2B complejas.",
      options: CEB_OPTIONS,
    })

    expect(conflict).toEqual({
      declaredCorrectOption: 'El Constructor de Relaciones',
      storedCorrectAnswer: 'El Challenger',
    })
  })

  it('no reporta cuando la explicación coincide con el answer key', () => {
    const conflict = findQuizAnswerKeyConflict({
      correctAnswer: 'El Constructor de Relaciones',
      explanation: 'La opción correcta es B, porque prioriza la armonía sobre el valor desafiante.',
      options: CEB_OPTIONS,
    })

    expect(conflict).toBeNull()
  })

  it('resuelve answer key numérico contra letra declarada', () => {
    const conflict = findQuizAnswerKeyConflict({
      correctAnswer: 3,
      explanation: 'La respuesta correcta es la opción B.',
      options: CEB_OPTIONS,
    })

    expect(conflict).toEqual({
      declaredCorrectOption: 'El Constructor de Relaciones',
      storedCorrectAnswer: 'El Challenger',
    })
  })

  it('detecta declaraciones por texto de opción entre comillas', () => {
    const conflict = findQuizAnswerKeyConflict({
      correctAnswer: 'El Challenger',
      explanation: 'La opción correcta es «El Constructor de Relaciones» según el estudio.',
      options: CEB_OPTIONS,
    })

    expect(conflict?.declaredCorrectOption).toBe('El Constructor de Relaciones')
  })

  it('detecta declaraciones en inglés y portugués', () => {
    expect(
      findQuizAnswerKeyConflict({
        correctAnswer: 'El Challenger',
        explanation: 'The correct answer is B because relationship builders underperform.',
        options: CEB_OPTIONS,
      }),
    ).not.toBeNull()

    expect(
      findQuizAnswerKeyConflict({
        correctAnswer: 'El Challenger',
        explanation: 'A resposta correta é a letra B, pois prioriza a harmonia.',
        options: CEB_OPTIONS,
      }),
    ).not.toBeNull()
  })

  it('no reporta cuando la explicación no declara opción explícita', () => {
    const conflict = findQuizAnswerKeyConflict({
      correctAnswer: 'El Challenger',
      explanation: 'El estudio muestra que desafiar al cliente genera mejores resultados.',
      options: CEB_OPTIONS,
    })

    expect(conflict).toBeNull()
  })

  it('ignora letras declaradas fuera del rango de opciones', () => {
    const conflict = findQuizAnswerKeyConflict({
      correctAnswer: 'Sí',
      explanation: 'La opción correcta es Z.',
      options: ['Sí', 'No'],
    })

    expect(conflict).toBeNull()
  })

  it('ignora preguntas true_false y sin opciones', () => {
    expect(
      findQuizAnswerKeyConflict({
        correctAnswer: 'Verdadero',
        explanation: 'La opción correcta es B.',
        options: ['Verdadero', 'Falso'],
        questionType: 'true_false',
      }),
    ).toBeNull()

    expect(
      findQuizAnswerKeyConflict({
        correctAnswer: 'respuesta libre',
        explanation: 'La opción correcta es A.',
        options: [],
      }),
    ).toBeNull()
  })

  it('compara sin sensibilidad a prefijos de enumeración ni mayúsculas', () => {
    const conflict = findQuizAnswerKeyConflict({
      correctAnswer: 'B) El Constructor de Relaciones',
      explanation: 'La opción correcta es B.',
      options: [
        'A) El Solucionador de Problemas',
        'B) El Constructor de Relaciones',
        'C) El Trabajador Diligente',
        'D) El Challenger',
      ],
    })

    expect(conflict).toBeNull()
  })
})

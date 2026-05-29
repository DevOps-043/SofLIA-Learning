import { describe, it, expect } from 'vitest'

import { normalizeQuizQuestion, normalizeQuizQuestions } from '../quiz-normalize'

describe('normalizeQuizQuestion - multiple_choice', () => {
  it('resuelve correct_answer numérico (índice) al texto de la opción', () => {
    const result = normalizeQuizQuestion({
      type: 'MULTIPLE_CHOICE',
      options: ['Madrid', 'Paris', 'Londres'],
      correct_answer: 1,
    })
    expect(result.questionType).toBe('multiple_choice')
    expect(result.correctAnswer).toBe('Paris')
  })

  it('resuelve correct_answer por letra con opciones prefijadas (caso M2 L2)', () => {
    const result = normalizeQuizQuestion({
      type: 'MULTIPLE_CHOICE',
      options: ['A) Riesgo Inaceptable', 'B) Riesgo Alto', 'C) Riesgo Limitado', 'D) Riesgo Mínimo'],
      correct_answer: 'B',
    })
    expect(result.correctAnswer).toBe('B) Riesgo Alto')
    expect(result.options).toEqual([
      'A) Riesgo Inaceptable',
      'B) Riesgo Alto',
      'C) Riesgo Limitado',
      'D) Riesgo Mínimo',
    ])
  })

  it('resuelve correct_answer por letra con opciones sin prefijo (por posición)', () => {
    const result = normalizeQuizQuestion({
      questionType: 'multiple_choice',
      options: ['Reskilling', 'Upskilling', 'Re-engineering', 'Job crafting'],
      correctAnswer: 'B',
    })
    expect(result.correctAnswer).toBe('Upskilling')
  })

  it('es idempotente cuando correctAnswer ya es el texto exacto', () => {
    const result = normalizeQuizQuestion({
      questionType: 'multiple_choice',
      options: ['Construir interfaces de usuario', 'Manejar bases de datos'],
      correctAnswer: 'Construir interfaces de usuario',
    })
    expect(result.correctAnswer).toBe('Construir interfaces de usuario')
  })

  it('resuelve por coincidencia insensible a mayúsculas/espacios', () => {
    const result = normalizeQuizQuestion({
      questionType: 'multiple_choice',
      options: ['París', 'Londres'],
      correctAnswer: '  parís ',
    })
    expect(result.correctAnswer).toBe('París')
  })

  it('conserva el valor si no es resoluble (sin inventar)', () => {
    const result = normalizeQuizQuestion({
      questionType: 'multiple_choice',
      options: ['A', 'B'],
      correctAnswer: 'Z',
    })
    expect(result.correctAnswer).toBe('Z')
  })
})

describe('normalizeQuizQuestion - true_false', () => {
  it('canoniza opciones a Verdadero/Falso y conserva la respuesta textual', () => {
    const result = normalizeQuizQuestion({
      type: 'TRUE_FALSE',
      options: ['Verdadero', 'Falso'],
      correct_answer: 'Falso',
    })
    expect(result.options).toEqual(['Verdadero', 'Falso'])
    expect(result.correctAnswer).toBe('Falso')
  })

  it('resuelve letra "B" con opciones prefijadas (caso M1 L1)', () => {
    const result = normalizeQuizQuestion({
      type: 'TRUE_FALSE',
      options: ['A) Verdadero', 'B) Falso'],
      correct_answer: 'B',
    })
    expect(result.options).toEqual(['Verdadero', 'Falso'])
    expect(result.correctAnswer).toBe('Falso')
  })

  it('resuelve índice numérico 0/1', () => {
    expect(normalizeQuizQuestion({ type: 'true_false', correct_answer: 0 }).correctAnswer).toBe('Verdadero')
    expect(normalizeQuizQuestion({ type: 'true_false', correct_answer: 1 }).correctAnswer).toBe('Falso')
  })

  it('resuelve variantes en inglés y defaultea opciones cuando faltan (caso M1 L3)', () => {
    const result = normalizeQuizQuestion({
      type: 'TRUE_FALSE',
      options: [],
      correct_answer: 'False',
    })
    expect(result.options).toEqual(['Verdadero', 'Falso'])
    expect(result.correctAnswer).toBe('Falso')
  })

  it('deja vacío si la respuesta V/F es irresoluble', () => {
    const result = normalizeQuizQuestion({ type: 'true_false', correct_answer: 'xyz' })
    expect(result.correctAnswer).toBe('')
  })
})

describe('normalizeQuizQuestion - metadata', () => {
  it('conserva el id existente', () => {
    expect(normalizeQuizQuestion({ id: 'q-abc', type: 'multiple_choice' }).id).toBe('q-abc')
  })

  it('usa un id determinista por índice cuando falta', () => {
    expect(normalizeQuizQuestion({ type: 'multiple_choice' }, 3).id).toBe('q-3')
  })

  it('normaliza una lista preservando orden e índices', () => {
    const result = normalizeQuizQuestions([
      { type: 'multiple_choice', options: ['x', 'y'], correct_answer: 1 },
      { type: 'true_false', options: ['Verdadero', 'Falso'], correct_answer: 'Verdadero' },
    ])
    expect(result).toHaveLength(2)
    expect(result[0].correctAnswer).toBe('y')
    expect(result[1].correctAnswer).toBe('Verdadero')
  })

  it('points por defecto a 1 cuando es inválido', () => {
    expect(normalizeQuizQuestion({ type: 'multiple_choice', points: 'abc' }).points).toBe(1)
    expect(normalizeQuizQuestion({ type: 'multiple_choice', points: 3 }).points).toBe(3)
  })
})

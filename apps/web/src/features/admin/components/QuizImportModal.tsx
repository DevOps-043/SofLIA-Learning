'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { FileJson, FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { QuizQuestion } from './QuizBuilder'

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuizImportModalProps {
  onImport: (questions: QuizQuestion[], mode: 'append' | 'replace') => void
  onClose: () => void
}

type ImportTab = 'json' | 'csv'

interface ParseResult {
  questions: QuizQuestion[]
  errors: string[]
}

// ─── CSV Template ────────────────────────────────────────────────────────────

// id es opcional: si se deja vacío se genera automáticamente
const CSV_HEADERS = [
  'id',
  'pregunta',
  'tipo',
  'opcion1',
  'opcion2',
  'opcion3',
  'opcion4',
  'respuestaCorrecta',
  'explicacion',
  'puntos',
]

const CSV_EXAMPLE_ROWS = [
  [
    'q1_lighthill',
    '¿Qué fue el Informe Lighthill y cuál fue su principal consecuencia?',
    'multiple_choice',
    'Un documento que celebraba los logros de la IA, impulsando la inversión.',
    'Un informe crítico que señaló la incapacidad de la IA para resolver problemas del mundo real, provocando recortes masivos de financiación.',
    'Un plan de desarrollo para la creación de las máquinas Lisp.',
    'El primer programa de IA que venció a un campeón mundial de ajedrez.',
    'Un informe crítico que señaló la incapacidad de la IA para resolver problemas del mundo real, provocando recortes masivos de financiación.',
    'El Informe Lighthill (1973) fue muy crítico con el estado de la investigación en IA en el Reino Unido, lo que llevó al gobierno británico a cortar drásticamente la financiación.',
    '10',
  ],
  [
    'q2_winter_def',
    'El término invierno de la IA se refiere a un periodo en el que la investigación se detuvo por completo debido a la falta de interés de los científicos.',
    'true_false',
    '',
    '',
    '',
    '',
    'Falso',
    'Aunque la financiación se desplomó, la investigación académica fundamental continuó a menor escala. El invierno se refiere principalmente a la crisis de financiación y de expectativas.',
    '10',
  ],
  [
    'q3_respuesta_corta',
    '¿Cómo se denomina el crecimiento exponencial del espacio de búsqueda a medida que un problema se vuelve más complejo?',
    'short_answer',
    '',
    '',
    '',
    '',
    'Explosión combinatoria',
    '',
    '10',
  ],
]

function generateCSVTemplate(): string {
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`
  const header = CSV_HEADERS.join(',')
  const rows = CSV_EXAMPLE_ROWS.map(row => row.map(escape).join(','))
  return [header, ...rows].join('\r\n')
}

function downloadCSVTemplate() {
  const content = generateCSVTemplate()
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'plantilla_preguntas_quiz.csv'
  link.click()
  URL.revokeObjectURL(url)
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current.trim())
  return fields
}

function parseCSV(text: string): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return { questions: [], errors: ['El archivo no contiene filas de datos (solo encabezado o vacío)'] }
  }

  const errors: string[] = []
  const questions: QuizQuestion[] = []

  // Skip header row (index 0)
  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1
    const fields = parseCSVLine(lines[i])

    const [
      idRaw = '',
      pregunta = '',
      tipo = '',
      opcion1 = '',
      opcion2 = '',
      opcion3 = '',
      opcion4 = '',
      respuestaCorrecta = '',
      explicacion = '',
      puntosRaw = '10',
    ] = fields

    if (!pregunta) {
      errors.push(`Fila ${rowNum}: el campo "pregunta" está vacío`)
      continue
    }

    const validTypes = ['multiple_choice', 'true_false', 'short_answer']
    if (!validTypes.includes(tipo)) {
      errors.push(
        `Fila ${rowNum}: tipo inválido "${tipo}". Debe ser multiple_choice, true_false o short_answer`
      )
      continue
    }

    const questionType = tipo as QuizQuestion['questionType']
    const points = Math.max(1, parseInt(puntosRaw) || 10)

    let options: string[] | undefined
    if (questionType === 'multiple_choice') {
      options = [opcion1, opcion2, opcion3, opcion4].filter(Boolean)
      if (options.length < 2) {
        errors.push(`Fila ${rowNum}: multiple_choice requiere al menos 2 opciones`)
        continue
      }
      if (!options.includes(respuestaCorrecta)) {
        errors.push(
          `Fila ${rowNum}: "respuestaCorrecta" debe coincidir exactamente con una de las opciones`
        )
        continue
      }
    } else if (questionType === 'true_false') {
      options = ['Verdadero', 'Falso']
      if (respuestaCorrecta !== 'Verdadero' && respuestaCorrecta !== 'Falso') {
        errors.push(`Fila ${rowNum}: true_false requiere "Verdadero" o "Falso" como respuestaCorrecta`)
        continue
      }
    }

    if (!respuestaCorrecta) {
      errors.push(`Fila ${rowNum}: el campo "respuestaCorrecta" está vacío`)
      continue
    }

    questions.push({
      id: idRaw || `q${i}_${Date.now()}`,
      question: pregunta,
      questionType,
      options,
      correctAnswer: respuestaCorrecta,
      explanation: explicacion || undefined,
      points,
    })
  }

  return { questions, errors }
}

// ─── JSON Parser ─────────────────────────────────────────────────────────────

function parseJSONInput(raw: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { questions: [], errors: ['JSON inválido. Verifica la sintaxis (comas, llaves, comillas).'] }
  }

  // Acepta tanto el formato de BD { questions: [...], totalPoints, passing_score }
  // como un arreglo directo de preguntas [ {...}, {...} ]
  let questionsArray: unknown[]
  if (Array.isArray(parsed)) {
    questionsArray = parsed
  } else if (
    typeof parsed === 'object' &&
    parsed !== null &&
    Array.isArray((parsed as Record<string, unknown>).questions)
  ) {
    questionsArray = (parsed as Record<string, unknown>).questions as unknown[]
  } else {
    return {
      questions: [],
      errors: [
        'Formato no reconocido. El JSON debe ser un arreglo [ {...} ] o el objeto de BD { "questions": [...], "totalPoints": ..., "passing_score": ... }',
      ],
    }
  }

  const errors: string[] = []
  const questions: QuizQuestion[] = []
  const validTypes = ['multiple_choice', 'true_false', 'short_answer']

  for (let i = 0; i < questionsArray.length; i++) {
    const item = questionsArray[i] as Record<string, unknown>
    const idx = i + 1

    if (typeof item !== 'object' || item === null) {
      errors.push(`Pregunta ${idx}: debe ser un objeto JSON`)
      continue
    }

    const question = String(item.question ?? '').trim()
    if (!question) {
      errors.push(`Pregunta ${idx}: "question" es requerido`)
      continue
    }

    const questionType = String(item.questionType ?? '')
    if (!validTypes.includes(questionType)) {
      errors.push(
        `Pregunta ${idx}: "questionType" inválido "${questionType}". Debe ser multiple_choice, true_false o short_answer`
      )
      continue
    }

    const correctAnswer = String(item.correctAnswer ?? '').trim()
    if (!correctAnswer) {
      errors.push(`Pregunta ${idx}: "correctAnswer" es requerido`)
      continue
    }

    let options: string[] | undefined
    let resolvedCorrectAnswer = correctAnswer

    if (questionType === 'multiple_choice') {
      if (!Array.isArray(item.options) || (item.options as unknown[]).length < 2) {
        errors.push(`Pregunta ${idx}: multiple_choice requiere "options" con al menos 2 elementos`)
        continue
      }
      options = (item.options as unknown[]).map(String)

      if (!options.includes(resolvedCorrectAnswer)) {
        // Intenta resolver formato abreviado: "A", "B", "C", "D" o "(A)", "(B)"...
        // Busca la opción cuyo texto empiece con la letra entre paréntesis o seguida de punto
        const letterPattern = /^[A-Da-d]$/
        const cleanLetter = resolvedCorrectAnswer.replace(/[().\s]/g, '').toUpperCase()
        if (letterPattern.test(cleanLetter)) {
          const resolved = options.find(opt =>
            opt.trimStart().startsWith(`(${cleanLetter})`) ||
            opt.trimStart().startsWith(`${cleanLetter}.`) ||
            opt.trimStart().startsWith(`${cleanLetter})`) ||
            opt.trimStart().startsWith(`${cleanLetter} `)
          )
          if (resolved) {
            resolvedCorrectAnswer = resolved
          } else {
            errors.push(
              `Pregunta ${idx}: "correctAnswer" "${correctAnswer}" no coincide con ninguna opción (texto completo o letra A–D)`
            )
            continue
          }
        } else {
          errors.push(
            `Pregunta ${idx}: "correctAnswer" "${correctAnswer}" no coincide con ninguna opción`
          )
          continue
        }
      }
    } else if (questionType === 'true_false') {
      options = ['Verdadero', 'Falso']
      if (resolvedCorrectAnswer !== 'Verdadero' && resolvedCorrectAnswer !== 'Falso') {
        errors.push(`Pregunta ${idx}: true_false requiere "Verdadero" o "Falso" como correctAnswer`)
        continue
      }
    }

    const points = Math.max(1, parseInt(String(item.points ?? '10')) || 10)
    const explanation = item.explanation ? String(item.explanation) : undefined

    questions.push({
      id: item.id ? String(item.id) : `q${i + 1}_${Date.now()}`,
      question,
      questionType: questionType as QuizQuestion['questionType'],
      options,
      correctAnswer: resolvedCorrectAnswer,
      explanation,
      points,
    })
  }

  return { questions, errors }
}

// ─── Component ───────────────────────────────────────────────────────────────

const JSON_EXAMPLE = `{
  "questions": [
    {
      "id": "q1_lighthill",
      "question": "¿Qué fue el Informe Lighthill y cuál fue su principal consecuencia?",
      "questionType": "multiple_choice",
      "options": [
        "Un documento que celebraba los logros de la IA.",
        "Un informe crítico que señaló la incapacidad de la IA para resolver problemas del mundo real, provocando recortes masivos de financiación.",
        "Un plan de desarrollo para las máquinas Lisp.",
        "El primer programa de IA que venció a un campeón mundial de ajedrez."
      ],
      "correctAnswer": "Un informe crítico que señaló la incapacidad de la IA para resolver problemas del mundo real, provocando recortes masivos de financiación.",
      "explanation": "El Informe Lighthill (1973) fue muy crítico con el estado de la investigación en IA, lo que llevó al gobierno británico a cortar drásticamente la financiación.",
      "points": 10
    },
    {
      "id": "q2_winter_def",
      "question": "El término invierno de la IA se refiere a un periodo en el que la investigación se detuvo por completo.",
      "questionType": "true_false",
      "options": ["Verdadero", "Falso"],
      "correctAnswer": "Falso",
      "explanation": "La investigación académica continuó a menor escala. El invierno se refiere a la crisis de financiación.",
      "points": 10
    }
  ],
  "totalPoints": 20,
  "passing_score": 80
}`

export function QuizImportModal({ onImport, onClose }: QuizImportModalProps) {
  const [activeTab, setActiveTab] = useState<ImportTab>('json')
  const [jsonInput, setJsonInput] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabs: { id: ImportTab; label: string; icon: typeof FileJson }[] = [
    { id: 'json', label: 'Importar JSON', icon: FileJson },
    { id: 'csv', label: 'Importar CSV', icon: FileSpreadsheet },
  ]

  const handleJSONValidate = () => {
    if (!jsonInput.trim()) {
      setParseResult({ questions: [], errors: ['Pega el JSON antes de validar'] })
      return
    }
    setParseResult(parseJSONInput(jsonInput))
  }

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setParseResult(parseCSV(text))
    }
    reader.readAsText(file, 'UTF-8')
    // Reset so the same file can be re-selected if needed
    e.target.value = ''
  }

  const canImport = parseResult !== null && parseResult.questions.length > 0

  const handleConfirm = () => {
    if (!canImport) return
    onImport(parseResult.questions, importMode)
    onClose()
  }

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl max-w-2xl w-full border border-[#E9ECEF] dark:border-[#6C757D]/30 max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 px-6 py-4 border-b border-[#0A2540]/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00D4B3]/20 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-[#00D4B3]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Importar Preguntas</h3>
                    <p className="text-xs text-white/70">Carga preguntas desde JSON o CSV</p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-6 py-3 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                {tabs.map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id
                  return (
                    <motion.button
                      key={id}
                      onClick={() => {
                        setActiveTab(id)
                        setParseResult(null)
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20'
                          : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </motion.button>
                  )
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence mode="wait">
                  {activeTab === 'json' && (
                    <motion.div
                      key="json"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                          Pega el JSON aquí *
                        </label>
                        <textarea
                          rows={10}
                          value={jsonInput}
                          onChange={(e) => {
                            setJsonInput(e.target.value)
                            setParseResult(null)
                          }}
                          placeholder={JSON_EXAMPLE}
                          className="w-full px-4 py-3 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D]/50 dark:placeholder-white/30 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-[#6C757D] dark:text-white/50">
                        Acepta el formato de BD{' '}
                        <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">{'{ "questions": [...], "totalPoints": ..., "passing_score": ... }'}</code>{' '}
                        o un arreglo directo{' '}
                        <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">{'[{...}]'}</code>.
                        Campos por pregunta:{' '}
                        <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">id</code>,{' '}
                        <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">question</code>,{' '}
                        <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">questionType</code>,{' '}
                        <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">options</code>,{' '}
                        <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">correctAnswer</code>,{' '}
                        <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">explanation</code>,{' '}
                        <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">points</code>.
                      </p>
                      <motion.button
                        type="button"
                        onClick={handleJSONValidate}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0A2540] hover:bg-[#0d2f4d] rounded-lg transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Validar JSON
                      </motion.button>
                    </motion.div>
                  )}

                  {activeTab === 'csv' && (
                    <motion.div
                      key="csv"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Step 1: Download template */}
                      <div className="p-4 bg-[#00D4B3]/5 dark:bg-[#00D4B3]/10 border border-[#00D4B3]/20 rounded-xl">
                        <p className="text-sm font-semibold text-[#0A2540] dark:text-white mb-1">
                          Paso 1 — Descarga la plantilla
                        </p>
                        <p className="text-xs text-[#6C757D] dark:text-white/60 mb-3">
                          La plantilla incluye ejemplos de los tres tipos de preguntas (multiple_choice, true_false, short_answer).
                          Completa las filas y borra las de ejemplo antes de importar.
                        </p>
                        <motion.button
                          type="button"
                          onClick={downloadCSVTemplate}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#00D4B3] bg-[#00D4B3]/10 hover:bg-[#00D4B3]/20 border border-[#00D4B3]/30 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Descargar plantilla CSV
                        </motion.button>
                      </div>

                      {/* Step 2: Upload filled CSV */}
                      <div>
                        <p className="text-sm font-semibold text-[#0A2540] dark:text-white mb-1">
                          Paso 2 — Sube el CSV completado
                        </p>
                        <p className="text-xs text-[#6C757D] dark:text-white/60 mb-3">
                          Columna{' '}
                          <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">id</code> opcional (slug semántico, ej.{' '}
                          <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">q1_lighthill</code>).
                          Requeridas:{' '}
                          <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">pregunta</code>,{' '}
                          <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">tipo</code>,{' '}
                          <code className="bg-[#E9ECEF] dark:bg-[#0A0D12] px-1 rounded">respuestaCorrecta</code>.
                          Las opciones (opcion1–4) son requeridas solo para multiple_choice.
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,text/csv"
                          onChange={handleCSVFile}
                          className="hidden"
                        />
                        <motion.button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0A2540] dark:text-white bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329] transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Seleccionar archivo CSV
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Parse result feedback */}
                {parseResult !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {parseResult.questions.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-700 dark:text-green-300">
                          <span className="font-semibold">{parseResult.questions.length} pregunta{parseResult.questions.length !== 1 ? 's' : ''}</span>{' '}
                          listas para importar
                          {parseResult.errors.length > 0 && ` (${parseResult.errors.length} fila${parseResult.errors.length !== 1 ? 's' : ''} con errores omitidas)`}
                        </p>
                      </div>
                    )}

                    {parseResult.errors.length > 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                            {parseResult.errors.length} error{parseResult.errors.length !== 1 ? 'es' : ''} encontrado{parseResult.errors.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ul className="space-y-1 ml-6">
                          {parseResult.errors.map((err, i) => (
                            <li key={i} className="text-xs text-red-600 dark:text-red-400 list-disc">
                              {err}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parseResult.questions.length === 0 && parseResult.errors.length === 0 && (
                      <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          No se encontraron preguntas válidas en el archivo.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Import mode selector — only when there are valid questions */}
                {canImport && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl"
                  >
                    <p className="text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-3 uppercase tracking-wide">
                      Modo de importación
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        {
                          value: 'append' as const,
                          label: 'Agregar a las existentes',
                          description: 'Las preguntas importadas se añaden a las que ya hay en el quiz',
                        },
                        {
                          value: 'replace' as const,
                          label: 'Reemplazar todo',
                          description: 'Se eliminan las preguntas actuales y se usan solo las importadas',
                        },
                      ].map(({ value, label, description }) => (
                        <label key={value} className="flex items-start gap-3 cursor-pointer group">
                          <div className="relative mt-0.5">
                            <input
                              type="radio"
                              name="importMode"
                              value={value}
                              checked={importMode === value}
                              onChange={() => setImportMode(value)}
                              className="sr-only"
                            />
                            <motion.div
                              animate={{
                                borderColor: importMode === value ? '#00D4B3' : '#6C757D',
                                backgroundColor: importMode === value ? '#00D4B3' : 'transparent',
                              }}
                              className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                            >
                              {importMode === value && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </motion.div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0A2540] dark:text-white">{label}</p>
                            <p className="text-xs text-[#6C757D] dark:text-white/60">{description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-[#E9ECEF]/30 dark:bg-[#0A0D12] border-t border-[#E9ECEF] dark:border-[#6C757D]/30 flex items-center justify-end gap-3">
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 text-sm font-medium text-[#6C757D] dark:text-white/60 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 transition-all duration-200"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!canImport}
                  whileHover={{ scale: canImport ? 1.02 : 1 }}
                  whileTap={{ scale: canImport ? 0.98 : 1 }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
                >
                  <Upload className="w-4 h-4" />
                  {canImport
                    ? `Importar ${parseResult!.questions.length} pregunta${parseResult!.questions.length !== 1 ? 's' : ''}`
                    : 'Importar'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </>
    </AnimatePresence>
  )
}

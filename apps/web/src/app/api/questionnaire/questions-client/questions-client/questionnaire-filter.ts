import type { QuestionRow, UserProfileRow } from './questionnaire.types'

function isAdoptionBlock(question: QuestionRow) {
  if (!question.bloque) return false

  const block = question.bloque.toLowerCase()
  return (
    block.includes('adopción') ||
    block.includes('adopcion') ||
    question.bloque === 'Adopción/uso'
  )
}

function isKnowledgeBlock(question: QuestionRow) {
  return Boolean(question.bloque?.toLowerCase().includes('conocimiento'))
}

function matchesProfile(question: QuestionRow, profile: UserProfileRow) {
  const areaMatch = question.area_id === profile.area_id || question.area_id === null
  const roleMatch = question.exclusivo_rol_id === profile.rol_id || question.exclusivo_rol_id === null
  return question.dificultad === profile.dificultad_id && areaMatch && roleMatch
}

function sortByProfileSpecificity(profile: UserProfileRow) {
  return (a: QuestionRow, b: QuestionRow) => {
    const aIsRoleSpecific = a.exclusivo_rol_id === profile.rol_id
    const bIsRoleSpecific = b.exclusivo_rol_id === profile.rol_id
    if (aIsRoleSpecific && !bIsRoleSpecific) return -1
    if (!aIsRoleSpecific && bIsRoleSpecific) return 1

    const aIsAreaSpecific = a.area_id === profile.area_id
    const bIsAreaSpecific = b.area_id === profile.area_id
    if (aIsAreaSpecific && !bIsAreaSpecific) return -1
    if (!aIsAreaSpecific && bIsAreaSpecific) return 1

    return a.id - b.id
  }
}

export function selectProfileQuestions(
  questions: QuestionRow[],
  profile: UserProfileRow,
) {
  const sortQuestions = sortByProfileSpecificity(profile)

  return {
    adoption: questions
      .filter((question) => isAdoptionBlock(question) && matchesProfile(question, profile))
      .sort(sortQuestions)
      .slice(0, 6),
    knowledge: questions
      .filter((question) => isKnowledgeBlock(question) && matchesProfile(question, profile))
      .sort(sortQuestions)
      .slice(0, 6),
  }
}

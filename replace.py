import re

filepath = 'apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Borrar handleVoiceQuestion
pattern_vq = r'  const handleVoiceQuestion = async \([^)]*\) => \{.*?\n  \};\n'
content = re.sub(pattern_vq, '  // handleVoiceQuestion moved\\n', content, flags=re.DOTALL)

# Borrar handleSendMessage
pattern_msg = r'  const handleSendMessage = async \([^)]*\) => \{.*?\n  \};\n'
content = re.sub(pattern_msg, '  // handleSendMessage moved\\n', content, flags=re.DOTALL)

# Reemplazar states
content = re.sub(r'const \[savedLessonDistribution, setSavedLessonDistribution\] = useState<StoredLessonDistribution\[\]>\(\[\]\);', '// savedLessonDistribution moved', content)
content = re.sub(r'const \[hasShownFinalSummary, setHasShownFinalSummary\] = useState<boolean>\(false\);', '// hasShownFinalSummary moved', content)
content = re.sub(r'const \[isProcessing, setIsProcessing\] = useState\(false\);', '// isProcessing moved', content)
content = re.sub(r'const \[conversationHistory, setConversationHistory\] = useState<Array<\{ role: string, content: string \}>>\(\[\]\);', '// conversationHistory moved', content)

# Inyectar el hook usage  alrededor de dispatch
hook_code = """
  // --- INICIO HOOK ---
  const {
    conversationHistory,
    setConversationHistory,
    isProcessing,
    savedLessonDistribution,
    setSavedLessonDistribution,
    hasShownFinalSummary,
    setHasShownFinalSummary,
    handleSendMessage,
    handleVoiceQuestion
  } = useStudyPlannerLIA({
    userContext,
    assignedCourses,
    availableCourses,
    selectedCourseIds,
    liaData,
    pendingLessonsRef,
    connectedCalendar,
    savedCalendarData,
    studyApproach,
    targetDate,
    hasAskedApproach,
    hasAskedTargetDate,
    showDateModal,
    isAudioEnabled,
    processingRef,
    setStudyApproach,
    setTargetDate,
    setHasAskedApproach,
    setHasAskedTargetDate,
    setShowApproachModal,
    loadUserCourses,
    handleStudyApproachResponse,
    handleTargetDateResponse,
    executeFinalPlanSave,
    speakText,
    stopAllAudio,
    onSetLiaConversationId: setLiaConversationId
  });
  // --- FIN HOOK ---
"""

# Insertar antes de 'const voice = useVoiceEngine'
content = content.replace('  const voice = useVoiceEngine({', hook_code + '\\n  const voice = useVoiceEngine({')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Reemplazo con Python finalizado.')

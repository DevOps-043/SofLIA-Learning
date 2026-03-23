const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx');
let lines = fs.readFileSync(file, 'utf8').split('\\n');

// Reemplazar handleVoiceQuestion (líneas 1340-1528 => índices 1339-1527)
for (let i = 1339; i <= 1527; i++) {
    lines[i] = '// deleted handleVoiceQuestion line ' + i;
}

// Reemplazar handleSendMessage (líneas 7794-9305 => índices 7793-9304)
for (let i = 7793; i <= 9304; i++) {
    lines[i] = '// deleted handleSendMessage line ' + i;
}

// Inyectar el hook usage alrededor de la línea 420
const hookUsage = \`
  // --- INICIO HOOK EXTRACTO ---
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
  // --- FIN HOOK EXTRACTO ---
\`;
lines.splice(415, 0, hookUsage);

// Agregar import
lines.splice(20, 0, "import { useStudyPlannerLIA } from '../hooks/useStudyPlannerLIA';");

// Borrar los states antiguos (isProcessing, conversationHistory, savedLessonDistribution, hasShownFinalSummary)
const statesToRemove = [
    'const [savedLessonDistribution, setSavedLessonDistribution]',
    'const [hasShownFinalSummary, setHasShownFinalSummary]',
    'const [isProcessing, setIsProcessing]',
    'const [conversationHistory, setConversationHistory]'
];

for (let i = 0; i < lines.length; i++) {
    statesToRemove.forEach(state => {
        if (lines[i].includes(state)) {
            lines[i] = '// ' + lines[i]; // Comentar la línea
        }
    });
}

fs.writeFileSync(file, lines.join('\\n'), 'utf8');
console.log('Update by exact lines completed');

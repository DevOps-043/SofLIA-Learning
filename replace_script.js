const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx');
let content = fs.readFileSync(file, 'utf8');

const removeFunction = (name) => {
    const startIdx = content.indexOf(`  const ${name} = async (`);
    if (startIdx === -1) {
        console.log(`No se encontró ${name}`);
        return;
    }

    let openBraces = 0;
    let endIdx = -1;
    let started = false;

    for (let i = startIdx; i < content.length; i++) {
        if (content[i] === '{') {
            openBraces++;
            started = true;
        } else if (content[i] === '}') {
            openBraces--;
            if (started && openBraces === 0) {
                endIdx = i + 1;
                break;
            }
        }
    }

    if (endIdx !== -1) {
        const toReplace = content.substring(startIdx, endIdx);
        content = content.replace(toReplace, `  // ${name} has been moved to useStudyPlannerLIA hook`);
        console.log(`Eliminada: ${name}`);
    }
};

removeFunction('handleSendMessage');
removeFunction('handleVoiceQuestion');

// Remove states
content = content.replace('const [savedLessonDistribution, setSavedLessonDistribution] = useState<StoredLessonDistribution[]>([]);', '// State savedLessonDistribution moved');
content = content.replace('const [hasShownFinalSummary, setHasShownFinalSummary] = useState<boolean>(false);', '// State hasShownFinalSummary moved');
content = content.replace('const [isProcessing, setIsProcessing] = useState(false);', '// State isProcessing moved');
content = content.replace('const [conversationHistory, setConversationHistory] = useState<Array<{ role: string, content: string }>>([]);', '// State conversationHistory moved');

// Add hook usage at the top of the component (around line 430)
const hookUsage = `
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
`;

// Insert the hook usage near the voice engine definition
const voiceIndex = content.indexOf('  const voice = useVoiceEngine({');
if (voiceIndex !== -1) {
   content = content.substring(0, voiceIndex) + hookUsage + '\n' + content.substring(voiceIndex);
   console.log('Hook call added');
}

// Add imports
if (!content.includes('import { useStudyPlannerLIA }')) {
    const importRegex = /import [^;]+;/g;
    let match;
    let lastImportIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
        lastImportIndex = match.index + match[0].length;
    }
    content = content.substring(0, lastImportIndex) + '\\nimport { useStudyPlannerLIA } from \\'../hooks/useStudyPlannerLIA\\';\\n' + content.substring(lastImportIndex);
}

fs.writeFileSync(file, content, 'utf8');
console.log('File updated successfully');

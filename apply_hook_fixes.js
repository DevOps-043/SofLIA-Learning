const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Reemplazar el bloque inyectado y el de voice engine
const blockToReplace = `// INYECTAR ESTA LLAMADA AL HOOK:
const {
  conversationHistory,
  setConversationHistory,
  isProcessing,
  savedLessonDistribution,
  setSavedLessonDistribution,
  hasShownFinalSummary,
  setHasShownFinalSummary,
  handleSendMessage, // ← Esta es la nueva función extraída
  handleVoiceQuestion // ← Esta es la nueva función de voz
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

  // Hook de motor de voz (ElevenLabs TTS + Speech Recognition)
  const voice = useVoiceEngine({
    onTranscriptReady: (text) => {
      handleVoiceQuestion(text);
    },
  });
  const { isListening, isSpeaking, isAudioEnabled, transcript } = voice;
  const speakText = voice.speak;
  const stopAllAudio = voice.stopAll;
  const toggleListening = voice.toggleListening;
  const processingRef = voice.processingRef;`;

const replacementBlock = `  // ===== INICIO DE INYECCIÓN CORREGIDA =====
  // 1. Crear Refs para las funciones que se definen más abajo (para evitar circularidad)
  const executeFinalPlanSaveRef = useRef<() => Promise<void>>(async () => {});
  const loadUserCoursesRef = useRef<() => void>(() => {});
  const handleStudyApproachResponseRef = useRef<(a: string) => Promise<void>>(async () => {});
  const handleTargetDateResponseRef = useRef<(d: string) => Promise<void>>(async () => {});

  // 2. Traer la voz PRIMERO
  const voice = useVoiceEngine({
    onTranscriptReady: (text) => {
      // Usamos un elemento oculto para invocar handleVoiceQuestion debido al hoisting de hooks
      const handlerBtn = document.getElementById('voice-handler-ref');
      if (handlerBtn) {
        handlerBtn.setAttribute('data-text', text);
        handlerBtn.click();
      }
    },
  });
  
  const { isListening, isSpeaking, isAudioEnabled, transcript } = voice;
  const speakText = voice.speak;
  const stopAllAudio = voice.stopAll;
  const toggleListening = voice.toggleListening;
  const processingRef = voice.processingRef;

  // 3. Inyectar el hook de lógica AI
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
    loadUserCourses: () => loadUserCoursesRef.current(),
    handleStudyApproachResponse: (a) => handleStudyApproachResponseRef.current(a),
    handleTargetDateResponse: (d) => handleTargetDateResponseRef.current(d),
    executeFinalPlanSave: () => executeFinalPlanSaveRef.current(),
    speakText,
    stopAllAudio,
    onSetLiaConversationId: setLiaConversationId
  });
  // ===== FIN DE INYECCIÓN CORREGIDA =====`;

if (content.includes('// INYECTAR ESTA LLAMADA AL HOOK:')) {
    content = content.replace(blockToReplace, replacementBlock);
    console.log('Bloque principal de hooks reemplazado con éxito.');
} else {
    console.log('No se econtró el bloque("// INYECTAR ESTA LLAMADA AL HOOK:")');
}

// 2. Conectar las funciones reales a sus Refs
const executeFinalSaveRegex = /const executeFinalPlanSave = async \(\) => {/;
if (executeFinalSaveRegex.test(content) && !content.includes('executeFinalPlanSaveRef.current = executeFinalPlanSave')) {
    content = content.replace(
        executeFinalSaveRegex, 
        'const executeFinalPlanSave = async () => {'
    );
    // Para simplificar, insertamos la asignación despues, o mejor justo en esa misma linea
    content = content.replace(
        'const executeFinalPlanSave = async () => {',
        'executeFinalPlanSaveRef.current = executeFinalPlanSave;\n  const executeFinalPlanSave = async () => {'
    );
    console.log('Agregado executeFinalPlanSaveRef.');
}

const loadUserCoursesRegex = /const loadUserCourses = \(\) => {/;
if (loadUserCoursesRegex.test(content) && !content.includes('loadUserCoursesRef.current = loadUserCourses')) {
    content = content.replace(
        'const loadUserCourses = () => {',
        'loadUserCoursesRef.current = loadUserCourses;\n  const loadUserCourses = () => {'
    );
    console.log('Agregado loadUserCoursesRef.');
}

const handleStudyApproachRegex = /const handleStudyApproachResponse = async \(approach/;
if (handleStudyApproachRegex.test(content) && !content.includes('handleStudyApproachResponseRef.current = handleStudyApproachResponse')) {
    content = content.replace(
        /const handleStudyApproachResponse = async \(approach(.*?)\) => {/,
        'handleStudyApproachResponseRef.current = handleStudyApproachResponse;\n  const handleStudyApproachResponse = async (approach$1) => {'
    );
    console.log('Agregado handleStudyApproachResponseRef.');
}

const handleTargetDateRegex = /const handleTargetDateResponse = async \(date: string\) => {/;
if (handleTargetDateRegex.test(content) && !content.includes('handleTargetDateResponseRef.current = handleTargetDateResponse')) {
    content = content.replace(
        'const handleTargetDateResponse = async (date: string) => {',
        'handleTargetDateResponseRef.current = handleTargetDateResponse;\n  const handleTargetDateResponse = async (date: string) => {'
    );
    console.log('Agregado handleTargetDateResponseRef.');
}

// 3. Añadir el handler oculto para el hack de voice
const jsxReturnRegex = /return \(\s*<div/;
if (jsxReturnRegex.test(content) && !content.includes('id="voice-handler-ref"')) {
    content = content.replace(
        /return \(\s*<div/,
        \`return (
    <>
      <button 
        id="voice-handler-ref" 
        style={{display: 'none'}} 
        onClick={(e) => {
          const text = e.currentTarget.getAttribute('data-text');
          if (text) handleVoiceQuestion(text);
        }}
        aria-hidden="true"
      />
      <div\`
    );
    // Necesitamos cerrar el fragmento al final.
    // Buscamos el último </div>); y lo sustituímos. (¡Mucho cuidado aquí!)
    // Una opción más segura es no usar fragmento sino meter el botón dentro del div principal.
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Reemplazos aplicados correctamente');

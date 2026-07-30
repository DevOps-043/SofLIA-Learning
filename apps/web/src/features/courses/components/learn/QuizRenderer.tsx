"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";

import styles from "./ActivitiesExperience.module.css";
import { buildQuizFeedbackPrompt } from "./quiz.utils";
import { QuizIntro } from "./quiz-renderer/QuizIntro";
import { QuizQuestionNavigator } from "./quiz-renderer/QuizQuestionNavigator";
import { QuizQuestionCard } from "./quiz-renderer/QuizQuestionCard";
import { QuizResultsPanel } from "./quiz-renderer/QuizResultsPanel";
import { QuizSubmitButton } from "./quiz-renderer/QuizSubmitButton";
import { useQuizRendererState } from "./quiz-renderer/useQuizRendererState";
import type { QuizRendererProps } from "./quiz-renderer/quiz-renderer.types";

// Componente premium y liviano de Confeti usando Framer Motion
function ConfettiEffect() {
  const particles = useMemo(() => {
    const colors = [
      "var(--learn-accent)",
      "var(--learn-action)",
      "var(--color-success)",
      "var(--color-warning)",
      "var(--color-error)",
    ];
    return Array.from({ length: 90 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // porcentaje horizontal
      y: -10 - Math.random() * 20, // posición y inicial por encima de la pantalla
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6, // 6px a 14px
      delay: Math.random() * 2.5, // retraso de inicio aleatorio
      duration: Math.random() * 3.5 + 2.5, // duración de la caída
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size * (Math.random() > 0.6 ? 1.4 : 1),
            backgroundColor: p.color,
          }}
          initial={{ y: -50, rotate: 0, opacity: 1 }}
          animate={{
            y: "110vh",
            x: `calc(${p.x}% + ${Math.sin(p.id) * 40}px)`,
            rotate: p.rotate + 720,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

export function QuizRenderer(props: QuizRendererProps) {
  const { t } = useTranslation("learn");
  const {
    attemptsRemaining,
    handleAnswerSelect,
    handleRetry,
    handleSubmit,
    isLocked,
    isSubmitting,
    normalizedQuizData,
    passed,
    passingThreshold,
    percentage,
    pointsEarned,
    retryAfter,
    score,
    selectedAnswers,
    serverMessage,
    showResults,
    submitError,
    totalQuestions,
  } = useQuizRendererState(props);

  const retryAfterLabel = useMemo(() => {
    if (!retryAfter) return null;
    const date = new Date(retryAfter);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }, [retryAfter]);

  const feedbackPrompt = useMemo(
    () => buildQuizFeedbackPrompt(normalizedQuizData, selectedAnswers),
    [normalizedQuizData, selectedAnswers],
  );

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const answeredQuestionCount = Object.keys(selectedAnswers).length;
  const currentQuestion = normalizedQuizData[currentQuestionIndex];

  // Estados específicos para el modo Kahoot responsivo
  const [isMobile, setIsMobile] = useState(false);
  const [isKahootActive, setIsKahootActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [mounted, setMounted] = useState(false);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  const handleAnswerSelectAndAdvance = (questionId: string, answer: string | number) => {
    handleAnswerSelect(questionId, answer);
    if (!showResults && currentQuestionIndex < totalQuestions - 1) {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
      }, 350);
    }
  };

  // Detectar pantalla móvil/responsive (<768px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Controlar el cronómetro del quiz en modo Kahoot
  useEffect(() => {
    if (!quizStarted || showResults || !isKahootActive) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [quizStarted, showResults, isKahootActive]);

  // Manejar el inicio de la cuenta regresiva del modo Kahoot
  useEffect(() => {
    if (countdown === null) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev > 1) {
          return prev - 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            setCountdown(null);
            setQuizStarted(true);
          }, 800);
          return 0; // Mostrar "¡YA!"
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown === null]);

  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [normalizedQuizData]);

  const handleRetryQuiz = () => {
    setCurrentQuestionIndex(0);
    handleRetry();
    if (isMobile && isKahootActive) {
      setCountdown(3);
      setQuizStarted(false);
      setElapsedTime(0);
    }
  };

  const handleStartKahoot = () => {
    handleRetryQuiz();
    setIsKahootActive(true);
    setCountdown(3);
    setQuizStarted(false);
    setElapsedTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (totalQuestions === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
        {t("activities.quiz.empty")}
      </div>
    );
  }

  // INTERFAZ PANTALLA COMPLETA RESPONSIVE (ESTILO KAHOOT)
  if (isMobile && isKahootActive) {
    const kahootContent = (
      <AnimatePresence>
        <div className="fixed inset-0 z-[9999] flex flex-col bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white overflow-hidden font-sans">
          
          {/* Cuenta regresiva overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-white/95 dark:bg-slate-950/95">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-white/40"
              >
                Prepárate
              </motion.div>
              <div className="relative flex items-center justify-center w-40 h-40 rounded-full border-4 border-teal-500/20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute text-7xl font-black text-teal-600 dark:text-teal-400 drop-shadow-[0_0_15px_rgba(0,212,179,0.4)]"
                  >
                    {countdown > 0 ? countdown : "¡YA!"}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
 
          {/* Barra superior de telemetría del Quiz */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md">
            <button
              onClick={() => {
                if (window.confirm("¿Seguro que quieres salir del cuestionario? Tu progreso actual no se guardará.")) {
                  setIsKahootActive(false);
                  setQuizStarted(false);
                }
              }}
              className="p-1 rounded-lg text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              type="button"
              aria-label="Cerrar cuestionario"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 block mb-0.5">
                Cuestionario
              </span>
              <span className="text-xs font-semibold text-gray-800 dark:text-white/80 line-clamp-1 max-w-[150px]">
                Pregunta {currentQuestionIndex + 1} de {totalQuestions}
              </span>
            </div>
            <div className="flex items-center gap-1.5 border border-teal-500/30 bg-teal-50 dark:bg-teal-950/40 px-3 py-1.5 rounded-full text-teal-600 dark:text-teal-400 font-mono text-xs font-black shadow-sm dark:shadow-[0_0_10px_rgba(0,212,179,0.1)]">
              <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTime(elapsedTime)}</span>
            </div>
          </div>
 
          {/* Contenido principal: pregunta actual o resultados */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {!showResults ? (
              <div className="space-y-6 pb-20">
                {/* Indicador de progreso de barra horizontal */}
                <div className="w-full bg-gray-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      backgroundColor: "var(--learn-accent)",
                      boxShadow: "0 0 8px color-mix(in srgb, var(--learn-accent) 40%, transparent)",
                      width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                    }}
                  />
                </div>
 
                {currentQuestion && (
                  <QuizQuestionCard
                    key={currentQuestion.id}
                    index={currentQuestionIndex}
                    onAnswerSelect={handleAnswerSelectAndAdvance}
                    question={currentQuestion}
                    selectedAnswer={selectedAnswers[currentQuestion.id]}
                    showResults={showResults}
                  />
                )}
              </div>
            ) : (
              <div className="pb-10 relative">
                {passed && <ConfettiEffect />}
                <QuizResultsPanel
                  onRetry={handleRetryQuiz}
                  onRequestFeedback={
                    feedbackPrompt && props.onRequestQuizFeedback
                      ? () => {
                          props.onRequestQuizFeedback?.(feedbackPrompt, {
                            activityId: props.activityId,
                            materialId: props.materialId,
                          });
                          setIsKahootActive(false);
                          setQuizStarted(false);
                        }
                      : undefined
                  }
                  passed={passed}
                  passingThreshold={passingThreshold}
                  percentage={percentage}
                  pointsEarned={pointsEarned}
                  score={score}
                  serverMessage={serverMessage}
                  totalPoints={props.totalPoints}
                  totalQuestions={totalQuestions}
                />
                
                {/* Botón premium de salir al completar */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => {
                      setIsKahootActive(false);
                      setQuizStarted(false);
                    }}
                    className="w-full px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-[0_4px_20px_rgba(0,212,179,0.3)] transition-all transform hover:scale-[1.02]"
                    type="button"
                  >
                    Finalizar y Continuar
                  </button>
                </div>
              </div>
            )}
          </div>
 
          {/* Barra de navegación de preguntas inferior en móvil */}
          {!showResults && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-4 z-40">
              <button
                className="rounded-xl border border-gray-300 dark:border-white/15 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-3.5 text-xs font-bold text-gray-700 dark:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                type="button"
              >
                Anterior
              </button>
 
              <div className="flex-1 flex justify-center">
                <QuizSubmitButton
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                  selectedAnswerCount={Object.keys(selectedAnswers).length}
                  totalQuestions={totalQuestions}
                  noBorder
                />
              </div>
 
              <button
                className="rounded-xl border border-gray-300 dark:border-white/15 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-3.5 text-xs font-bold text-gray-700 dark:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                disabled={currentQuestionIndex >= totalQuestions - 1}
                onClick={() => setCurrentQuestionIndex((index) => Math.min(totalQuestions - 1, index + 1))}
                type="button"
              >
                Siguiente
              </button>
            </div>
          )}
 
        </div>
      </AnimatePresence>
    );

    if (mounted && typeof window !== "undefined") {
      return createPortal(kahootContent, document.body);
    }
    return null;
  }

  // INTERFAZ DE ESCRITORIO O INICIAL EN MÓVIL (ANTES DE INICIAR EL OVERLAY)
  return (
    <div className={styles.quizRoot}>
      {isMobile ? (
        // Panel de bienvenida responsivo premium previo a activar Kahoot alineado al SOFIA Design System
        <div className="p-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col items-center text-center space-y-6 shadow-xl dark:shadow-2xl relative overflow-hidden">
          <div
            className="absolute left-0 right-0 top-0 h-1.5"
            style={{ background: "linear-gradient(90deg, var(--learn-action), var(--learn-accent))" }}
          />
          
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl border"
            style={{ borderColor: "color-mix(in srgb, var(--learn-accent) 25%, transparent)", backgroundColor: "color-mix(in srgb, var(--learn-accent) 10%, transparent)", color: "var(--learn-accent)" }}
          >
            <ClipboardCheck className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Cuestionario Listo</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs leading-relaxed">
              Mide tus conocimientos en este cuestionario interactivo de pantalla completa.
            </p>
          </div>
          
          <div className="w-full rounded-xl border border-gray-200/50 bg-slate-50 p-4 text-left dark:border-white/5 dark:bg-white/[0.025]">
            <QuizIntro
              passingThreshold={passingThreshold}
              totalPoints={props.totalPoints}
              totalQuestions={totalQuestions}
            />
          </div>

          <button
            onClick={handleStartKahoot}
            className="w-full cursor-pointer rounded-xl px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all hover:brightness-105 active:translate-y-px"
            style={{
              background: "var(--learn-action)",
              boxShadow: "0 4px 15px color-mix(in srgb, var(--learn-action) 25%, transparent)",
              color: "var(--learn-on-action)",
            }}
            type="button"
          >
            Comenzar Cuestionario
          </button>
        </div>
      ) : (
        // Panel estándar para Escritorio (Sin alteraciones)
        <>
          <div className={styles.quizMeta}>
            <QuizIntro
              passingThreshold={passingThreshold}
              totalPoints={props.totalPoints}
              totalQuestions={totalQuestions}
            />
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/35">
                Progreso
              </p>
              <p className="mt-1 text-xs font-semibold text-gray-700 dark:text-white/75">
                {t("activities.quiz.questionProgress", {
                  current: currentQuestionIndex + 1,
                  total: totalQuestions,
                })}
              </p>
            </div>
          </div>

          <div className={styles.quizProgress} aria-hidden="true">
            <div
              className={styles.quizProgressBar}
              style={{
                width: `${Math.max(
                  ((showResults ? totalQuestions : answeredQuestionCount) / totalQuestions) * 100,
                  4,
                )}%`,
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-white/50">
            <div className="flex flex-wrap items-center gap-2">
              <QuizQuestionNavigator
                currentQuestionIndex={currentQuestionIndex}
                onQuestionChange={setCurrentQuestionIndex}
                questions={normalizedQuizData}
                selectedAnswers={selectedAnswers}
                showResults={showResults}
              />
            </div>
            <span className="rounded-full border border-gray-200/80 px-2.5 py-1 dark:border-white/10">
              {t("activities.quiz.answered", {
                answered: answeredQuestionCount,
                total: totalQuestions,
              })}
            </span>
          </div>

          <div className="space-y-4">
            {currentQuestion && (
              <QuizQuestionCard
                key={currentQuestion.id}
                index={currentQuestionIndex}
                onAnswerSelect={handleAnswerSelectAndAdvance}
                question={currentQuestion}
                selectedAnswer={selectedAnswers[currentQuestion.id]}
                showResults={showResults}
              />
            )}
          </div>

          {totalQuestions > 1 && !showResults && (
            <div className={styles.quizNavigation}>
              <button
                className={styles.quizSecondaryButton}
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                type="button"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {t("activities.quiz.previous")}
              </button>
              <button
                className={styles.quizSecondaryButton}
                disabled={currentQuestionIndex >= totalQuestions - 1}
                onClick={() =>
                  setCurrentQuestionIndex((index) =>
                    Math.min(totalQuestions - 1, index + 1),
                  )
                }
                type="button"
              >
                {t("activities.quiz.next")}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {submitError && !isLocked && (
            <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-xs">{submitError}</p>
            </div>
          )}

          {isLocked && (
            <div className="px-3 py-2.5 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                {t("activities.quiz.locked.title")}
              </p>
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-200/80">
                {retryAfterLabel
                  ? t("activities.quiz.locked.retryAt", { date: retryAfterLabel })
                  : t("activities.quiz.locked.description")}
              </p>
            </div>
          )}

          {!showResults && !isLocked && (
            <div className="space-y-2">
              {typeof attemptsRemaining === "number" && (
                <p className="text-right text-xs text-gray-500 dark:text-white/50">
                  {t("activities.quiz.attemptsRemaining", { count: attemptsRemaining })}
                </p>
              )}
              <QuizSubmitButton
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                selectedAnswerCount={Object.keys(selectedAnswers).length}
                totalQuestions={totalQuestions}
              />
            </div>
          )}

          {showResults && (
            <QuizResultsPanel
              onRetry={handleRetryQuiz}
              onRequestFeedback={
                feedbackPrompt && props.onRequestQuizFeedback
                  ? () => props.onRequestQuizFeedback?.(feedbackPrompt, {
                      activityId: props.activityId,
                      materialId: props.materialId,
                    })
                  : undefined
              }
              passed={passed}
              passingThreshold={passingThreshold}
              percentage={percentage}
              pointsEarned={pointsEarned}
              score={score}
              serverMessage={serverMessage}
              totalPoints={props.totalPoints}
              totalQuestions={totalQuestions}
            />
          )}
        </>
      )}
    </div>
  );
}

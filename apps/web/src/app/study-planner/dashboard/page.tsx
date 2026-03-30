'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  X,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Zap,
  Send,
} from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { StudyPlannerCalendar } from '@/features/study-planner/components/StudyPlannerCalendar';
import { ToastNotification } from '@/core/components/ToastNotification';
import { CalendarSelectionPanel } from '@/features/study-planner/components/CalendarSelection';
import { redirectToDashboard } from '@/features/auth/actions/dashboard-redirect';
import { type DashboardMessage } from '@/features/study-planner/hooks/useStudyPlannerDashboardSofLIA';
import Joyride from 'react-joyride';
import { useStudyPlannerDashboardLogic } from '@/features/study-planner/hooks/useStudyPlannerDashboardLogic';

// Renderizar mensaje del chat (JSX helper — stays in page)
const renderMessage = (msg: DashboardMessage) => {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden mr-2">
          <Image
            src="/lia-avatar.png"
            alt="LIA"
            width={32}
            height={32}
            className="object-cover"
          />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
            ? 'bg-blue-500 text-white rounded-br-sm'
            : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm rounded-bl-sm'
          }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-base font-semibold mb-1">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-semibold mb-1 mt-1.5">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold mb-1 mt-1.5">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-1.5 leading-relaxed">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-1.5 space-y-0.5">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-1.5 space-y-0.5">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                br: () => <br />,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
        {msg.actionStatus === 'success' && (
          <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
            <CheckCircle className="w-3 h-3" />
            <span>Acción completada</span>
          </div>
        )}
        {msg.actionStatus === 'error' && (
          <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
            <XCircle className="w-3 h-3" />
            <span>Error en la acción</span>
          </div>
        )}
        <span className="text-xs opacity-60 mt-1 block">
          {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};

// Ancho del panel cuando está expandido
const expandedWidth = 'w-[520px]';

export default function StudyPlannerDashboardPage() {
  const {
    // SofLIA chat
    messages,
    isSending,
    error,
    clearError,
    // Tour
    restartTour,
    joyrideProps,
    isMounted,
    // LIA panel
    isLiaPanelOpen,
    setIsLiaPanelOpen,
    isLiaCollapsed,
    setIsLiaCollapsed,
    liaPanelRef,
    messagesEndRef,
    // Message input
    message,
    setMessage,
    messageInputRef,
    // Calendar connection
    isCalendarModalOpen,
    setIsCalendarModalOpen,
    isGoogleConnected,
    connectedProvider,
    isConnecting,
    connectingProvider,
    hoveredButton,
    setHoveredButton,
    calendarError,
    // Plan state
    isDeletingPlan,
    isRecreatingPlan,
    showOnlyPlanEvents,
    setShowOnlyPlanEvents,
    isCalendarConfigOpen,
    setIsCalendarConfigOpen,
    hasConfiguredCalendars,
    setHasConfiguredCalendars,
    calendarRefreshTrigger,
    setCalendarRefreshTrigger,
    // Toast
    toast,
    setToast,
    // Confirm dialog
    confirmDialog,
    // Handlers
    handleConnect,
    handleDisconnect,
    handleDeletePlan,
    handleRecreatePlan,
    handleSendMessage,
  } = useStudyPlannerDashboardLogic();

  return (
    <div className="min-h-screen flex overflow-hidden bg-white dark:bg-[#0F1419]">
      {/* Panel Central - Calendario */}
      <div
        id="dashboard-calendar-container"
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isLiaPanelOpen && !isLiaCollapsed ? 'mr-[520px]' : ''
          }`}
      >
        {/* Barra superior con iconos de acción */}
        <div className="flex items-center justify-start gap-3 px-6 pt-6 pb-2">
          {/* Botón Dashboard */}
          <div className="relative">
            <motion.button
              id="dashboard-back-button"
              layout
              onClick={async () => {
                await redirectToDashboard();
              }}
              onMouseEnter={() => setHoveredButton('dashboard')}
              onMouseLeave={() => setHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-white dark:bg-[#1E2329] text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 border border-[#E9ECEF] dark:border-[#6C757D]/30 transition-colors flex items-center overflow-hidden"
              title="Ir al Dashboard"
              aria-label="Ir al Dashboard"
            >
              <motion.div
                className="p-2.5 flex-shrink-0 flex items-center justify-center"
                animate={hoveredButton === 'dashboard' ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0],
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: hoveredButton === 'dashboard' ? Infinity : 0,
                  repeatType: 'reverse',
                  ease: 'easeInOut'
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.div>
              <AnimatePresence>
                {hoveredButton === 'dashboard' && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    Ir al Dashboard
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Botón Ver Tour */}
          <div className="relative">
            <motion.button
              layout
              onClick={restartTour}
              onMouseEnter={() => setHoveredButton('tour')}
              onMouseLeave={() => setHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-white dark:bg-[#1E2329] text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 border border-[#E9ECEF] dark:border-[#6C757D]/30 transition-colors flex items-center overflow-hidden"
              title="Ver Tour"
            >
              <motion.div
                className="p-2.5 flex-shrink-0 flex items-center justify-center"
                animate={hoveredButton === 'tour' ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, -10, 10, 0],
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: hoveredButton === 'tour' ? Infinity : 0,
                  repeatType: 'reverse',
                  ease: 'easeInOut'
                }}
              >
                <Zap className="w-5 h-5" />
              </motion.div>
              <AnimatePresence>
                {hoveredButton === 'tour' && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    Ver Tour
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Icono de Calendario de Google */}
          <div className="relative calendar-menu-container">
            <motion.button
              id="dashboard-connect-calendar-button"
              layout
              onClick={() => {
                setIsCalendarModalOpen(true);
              }}
              onMouseEnter={() => setHoveredButton('calendar')}
              onMouseLeave={() => setHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className={`
                rounded-lg transition-colors flex items-center overflow-hidden
                ${isGoogleConnected
                  ? 'bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] dark:text-[#10B981] hover:bg-[#10B981]/20 dark:hover:bg-[#10B981]/30 border border-[#10B981]/30 dark:border-[#10B981]/40'
                  : 'bg-white dark:bg-[#1E2329] text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 border border-[#E9ECEF] dark:border-[#6C757D]/30'
                }
              `}
            >
              <motion.div
                className="p-2.5 flex-shrink-0 flex items-center justify-center"
                animate={hoveredButton === 'calendar' ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: hoveredButton === 'calendar' ? Infinity : 0,
                  repeatType: 'reverse',
                  ease: 'easeInOut'
                }}
              >
                {isGoogleConnected ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
              </motion.div>
              <AnimatePresence>
                {hoveredButton === 'calendar' && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    {isGoogleConnected ? 'Google conectado' : 'Conectar calendario'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

          </div>

          {/* Botón Configuración de Calendarios */}
          <div className="relative">
            <motion.button
              layout
              onClick={() => setIsCalendarConfigOpen(true)}
              disabled={!connectedProvider}
              onMouseEnter={() => setHoveredButton('calConfig')}
              onMouseLeave={() => setHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className={`
                rounded-lg transition-colors flex items-center overflow-hidden
                ${!connectedProvider
                  ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 border border-gray-200 dark:border-gray-700 cursor-not-allowed'
                  : 'bg-white dark:bg-[#1E2329] text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 border border-[#E9ECEF] dark:border-[#6C757D]/30'
                }
              `}
              title="Configuración de calendarios"
            >
              <motion.div
                className="p-2.5 flex-shrink-0 flex items-center justify-center"
                animate={hoveredButton === 'calConfig' ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 90, 0],
                } : {}}
                transition={{
                  duration: 0.6,
                  repeat: hoveredButton === 'calConfig' ? Infinity : 0,
                  repeatType: 'reverse',
                  ease: 'easeInOut'
                }}
              >
                <Settings className="w-5 h-5" />
              </motion.div>
              <AnimatePresence>
                {hoveredButton === 'calConfig' && connectedProvider && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    Configuración
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Badge de notificación primeriza */}
            {connectedProvider && !hasConfiguredCalendars && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75" />
                <span className="relative w-2 h-2 bg-white rounded-full" />
              </motion.span>
            )}
          </div>

          {/* Botón Añadir y Eliminar Plan */}
          <div className="relative">
            <motion.button
              id="dashboard-new-plan-button"
              layout
              onClick={handleRecreatePlan}
              disabled={isRecreatingPlan}
              onMouseEnter={() => setHoveredButton('recreate')}
              onMouseLeave={() => setHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-[#0A2540] dark:bg-[#0A2540] text-white hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] border border-[#0A2540] dark:border-[#0A2540] transition-colors flex items-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <motion.div
                className="p-2.5 flex-shrink-0 flex items-center justify-center"
                animate={isRecreatingPlan ? {
                  rotate: 360,
                } : hoveredButton === 'recreate' ? {
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{
                  duration: isRecreatingPlan ? 1 : 0.5,
                  repeat: isRecreatingPlan ? Infinity : 0,
                  ease: 'linear'
                }}
              >
                {isRecreatingPlan ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </motion.div>
              <AnimatePresence>
                {hoveredButton === 'recreate' && !isRecreatingPlan && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    Nuevo plan
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Botón Eliminar Plan */}
          <div className="relative">
            <motion.button
              id="dashboard-delete-plan-button"
              layout
              onClick={handleDeletePlan}
              disabled={isDeletingPlan}
              onMouseEnter={() => setHoveredButton('delete')}
              onMouseLeave={() => setHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 border border-red-600 dark:border-red-700 transition-colors flex items-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <motion.div
                className="p-2.5 flex-shrink-0 flex items-center justify-center"
                animate={isDeletingPlan ? {
                  rotate: 360,
                } : hoveredButton === 'delete' ? {
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{
                  duration: isDeletingPlan ? 1 : 0.5,
                  repeat: isDeletingPlan ? Infinity : 0,
                  ease: 'linear'
                }}
              >
                {isDeletingPlan ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </motion.div>
              <AnimatePresence>
                {hoveredButton === 'delete' && !isDeletingPlan && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    Eliminar plan
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

        </div>

        <div className="flex-1 overflow-auto px-0 sm:px-6 pb-6">
          {/* Calendario de Estudios */}
          <div className="bg-white dark:bg-[#1E2329] rounded-none sm:rounded-xl shadow-sm border-x-0 sm:border border-[#E9ECEF] dark:border-[#6C757D]/30 p-0 sm:p-6 h-full flex flex-col">
            <StudyPlannerCalendar showOnlyPlanEvents={showOnlyPlanEvents} refreshTrigger={calendarRefreshTrigger} />
          </div>
        </div>
      </div>

      {/* Panel Derecho - Chat con LIA (Diseño Premium) */}
      <AnimatePresence>
        {isLiaPanelOpen && !isLiaCollapsed && (
          <motion.aside
            id="dashboard-lia-panel"
            ref={liaPanelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-[420px] h-screen bg-white dark:bg-[#0a0f14] border-l border-gray-200 dark:border-[#1e2a35] rounded-tl-[30px] rounded-bl-[30px] overflow-hidden z-40 flex flex-col shadow-[-4px_0_32px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_32px_rgba(0,0,0,0.4)]"
          >
            {/* Header del panel */}
            <div
              className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-[#1e2a35] bg-white dark:bg-[#0a0f14]"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Avatar de LIA con indicador online */}
                <div style={{ position: 'relative' }}>
                  <Image
                    src="/lia-avatar.png"
                    alt="SofLIA"
                    width={40}
                    height={40}
                    style={{
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #00D4B3',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '14px',
                      height: '14px',
                      backgroundColor: '#22c55e',
                      borderRadius: '50%',
                      border: '2px solid #0a0f14',
                    }}
                  />
                </div>

                <div>
                  <h2 className="text-gray-900 dark:text-white text-base font-semibold m-0 leading-[1.2]">
                    SofLIA
                  </h2>
                  <p className="text-[#00D4B3] text-xs font-medium m-0">
                    Asistente de tu plan
                  </p>
                </div>
              </div>

              {/* Botones de acción (Limpiar + Cerrar) */}
              <div className="flex gap-2">
                <button
                  onClick={() => {/* TODO: clearMessages */ }}
                  title="Limpiar conversación"
                  className={`
                    w-8 h-8 rounded-lg bg-transparent border-none flex items-center justify-center transition-colors
                    hover:bg-red-50 dark:hover:bg-[#450a0a]
                    ${messages.length > 0 ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'}
                  `}
                >
                  <Trash2 className="w-[18px] h-[18px] text-red-500 dark:text-[#f87171]" />
                </button>

                <button
                  onClick={() => setIsLiaCollapsed(true)}
                  className="w-8 h-8 rounded-lg bg-transparent border-none flex items-center justify-center transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1e2a35]"
                >
                  <X className="w-[18px] h-[18px] text-gray-500 dark:text-[#6b7280]" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3"
            >
              {messages.length === 0 ? (
                // Empty State / Loading Screen Style
                <div
                  className="flex-1 flex flex-col items-center justify-center text-center opacity-80 px-5"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ marginBottom: '24px', position: 'relative' }}
                  >
                    {/* Glow effect behind avatar */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      backgroundColor: '#00D4B3',
                      filter: 'blur(40px)',
                      opacity: 0.2,
                      zIndex: 0
                    }} />

                    <Image
                      src="/lia-avatar.png"
                      alt="SofLIA"
                      width={80}
                      height={80}
                      style={{
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #00D4B3',
                        boxShadow: '0 0 20px rgba(0, 212, 179, 0.4)',
                        position: 'relative',
                        zIndex: 1
                      }}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-2">
                      SofLIA
                    </h3>
                    <p className="text-gray-500 dark:text-[#6b7280] text-sm leading-relaxed max-w-[280px] mx-auto">
                      Puedo ayudarte a reprogramar sesiones, ajustar tu plan o resolver conflictos de horario.
                    </p>
                  </motion.div>
                </div>
              ) : (
                // Chat Messages
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role !== 'user' && (
                        <div className="mr-2 flex-shrink-0">
                          <Image
                            src="/lia-avatar.png"
                            alt="SofLIA"
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        </div>
                      )}
                      <div
                        className={`
                          max-w-[85%] px-4 py-3
                          ${msg.role === 'user'
                            ? 'bg-[#0A2540] dark:bg-[#0A2540] text-white rounded-[16px_16px_4px_16px]'
                            : 'bg-gray-100 dark:bg-[#1e2a35] text-gray-900 dark:text-white rounded-[16px_16px_16px_4px]'}
                        `}
                      >
                        <div className="text-sm leading-relaxed m-0 whitespace-pre-wrap">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              ul: ({ children }) => <ul className="my-2 pl-5 list-disc">{children}</ul>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        {msg.actionStatus === 'success' && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
                            <CheckCircle className="w-3 h-3" />
                            <span>Acción completada</span>
                          </div>
                        )}
                        {msg.actionStatus === 'error' && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                            <XCircle className="w-3 h-3" />
                            <span>Error en la acción</span>
                          </div>
                        )}
                        <p
                          className={`text-[10px] mt-1.5 mb-0 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                          {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}

              {/* Loading indicator */}
              {isSending && (
                <div className="flex justify-start">
                  <div className="mr-2 flex-shrink-0">
                    <Image
                      src="/lia-avatar.png"
                      alt="SofLIA"
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div
                    className="px-4 py-3 rounded-[16px_16px_16px_4px] bg-gray-100 dark:bg-[#1e2a35] flex gap-1.5 items-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#00D4B3] animate-[liaPulse_1s_infinite]" />
                    <div className="w-2 h-2 rounded-full bg-[#00D4B3] animate-[liaPulse_1s_infinite_0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-[#00D4B3] animate-[liaPulse_1s_infinite_0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="px-5 py-2 bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-500 dark:text-[#f87171] m-0">{error}</p>
                  <button onClick={clearError} className="bg-transparent border-none cursor-pointer p-1">
                    <XCircle className="w-4 h-4 text-red-500 dark:text-[#f87171]" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 pb-4 border-t border-gray-200 dark:border-[#1e2a35] bg-white dark:bg-[#0a0f14]">
              <div
                className="flex items-center gap-3 bg-gray-50 dark:bg-[rgba(255,255,255,0.05)] rounded-3xl px-4 py-2.5 border border-gray-200 dark:border-[#374151]"
              >
                <input
                  id="dashboard-chat-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Escribe un mensaje a SofLIA..."
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm placeholder:text-gray-400"
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center transition-colors
                    ${message.trim() && !isSending
                      ? 'bg-[#00D4B3] hover:bg-[#00c0a3] cursor-pointer'
                      : 'bg-gray-200 dark:bg-[#374151] cursor-not-allowed'}
                  `}
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>

            <style>{`
              @keyframes liaPulse {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Burbuja flotante de LIA */}
      <AnimatePresence>
        {(isLiaCollapsed || !isLiaPanelOpen) && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={() => {
              setIsLiaPanelOpen(true);
              setIsLiaCollapsed(false);
            }}
            className="fixed right-4 bottom-4 z-50 w-16 h-16 rounded-full shadow-2xl hover:shadow-[#0A2540]/50 dark:hover:shadow-[#00D4B3]/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group overflow-hidden ring-4 ring-[#0A2540]/20 dark:ring-[#00D4B3]/30"
            title="Abrir LIA Coach"
          >
            <div className="relative w-full h-full">
              <Image
                src="/lia-avatar.png"
                alt="SofLIA"
                fill
                className="object-cover group-hover:scale-110 transition-transform"
                sizes="64px"
              />
            </div>
            {/* Indicador de notificación */}
            {messages.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 z-10"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-full h-full bg-red-500 rounded-full"
                />
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal de Calendario */}
      <AnimatePresence>
        {isCalendarModalOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCalendarModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E9ECEF] dark:border-[#6C757D]/30">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                  <h2 className="text-lg font-semibold text-[#0A2540] dark:text-white">
                    Conectar Calendario
                  </h2>
                  <button
                    onClick={() => setIsCalendarModalOpen(false)}
                    className="p-2 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-[#6C757D] dark:text-gray-400" />
                  </button>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  <p className="text-xs text-[#6C757D] dark:text-gray-400 text-center mb-4">
                    {isGoogleConnected ? 'Gestiona tus calendarios conectados:' : 'Selecciona tu proveedor de calendario:'}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Google Calendar */}
                    <div className={`relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all ${connectedProvider === 'google'
                        ? 'bg-[#10B981]/10 dark:bg-[#10B981]/20 border-2 border-[#10B981]/30 shadow-sm'
                        : 'bg-white dark:bg-[#1E2329] border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#0A2540] dark:hover:border-[#00D4B3]'
                      }`}>
                      {connectedProvider === 'google' && (
                        <button
                          onClick={handleDisconnect}
                          className="absolute top-2 right-2 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors group"
                          title="Desconectar Google Calendar"
                        >
                          <X className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300" />
                        </button>
                      )}

                      <motion.button
                        onClick={() => connectedProvider !== 'google' && handleConnect('google')}
                        disabled={isConnecting || connectedProvider === 'google'}
                        whileHover={connectedProvider !== 'google' && !isConnecting ? { scale: 1.02 } : {}}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-col items-center gap-3 w-full disabled:cursor-default"
                      >
                        {connectingProvider === 'google' ? (
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        ) : (
                          <div className="w-8 h-8 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-8 h-8">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                          </div>
                        )}
                        <span className={`text-xs font-medium ${connectedProvider === 'google'
                            ? 'text-[#10B981] dark:text-[#10B981]'
                            : 'text-[#0A2540] dark:text-white'
                          }`}>
                          Google Calendar
                        </span>
                        {connectedProvider === 'google' && (
                          <span className="text-xs text-[#10B981] dark:text-[#10B981] font-medium">
                            Conectado
                          </span>
                        )}
                      </motion.button>
                    </div>

                    {/* Microsoft Calendar */}
                    <div className={`relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all ${connectedProvider === 'microsoft'
                        ? 'bg-[#10B981]/10 dark:bg-[#10B981]/20 border-2 border-[#10B981]/30 shadow-sm'
                        : 'bg-white dark:bg-[#1E2329] border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#0A2540] dark:hover:border-[#00D4B3]'
                      }`}>
                      {connectedProvider === 'microsoft' && (
                        <button
                          onClick={handleDisconnect}
                          className="absolute top-2 right-2 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors group"
                          title="Desconectar Microsoft Calendar"
                        >
                          <X className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300" />
                        </button>
                      )}

                      <motion.button
                        onClick={() => connectedProvider !== 'microsoft' && handleConnect('microsoft')}
                        disabled={isConnecting || connectedProvider === 'microsoft'}
                        whileHover={connectedProvider !== 'microsoft' && !isConnecting ? { scale: 1.02 } : {}}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-col items-center gap-3 w-full disabled:cursor-default"
                      >
                        {connectingProvider === 'microsoft' ? (
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        ) : (
                          <div className="w-8 h-8 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-8 h-8">
                              <path fill="#F25022" d="M1 1h10v10H1z" />
                              <path fill="#00A4EF" d="M1 13h10v10H1z" />
                              <path fill="#7FBA00" d="M13 1h10v10H13z" />
                              <path fill="#FFB900" d="M13 13h10v10H13z" />
                            </svg>
                          </div>
                        )}
                        <span className={`text-xs font-medium ${connectedProvider === 'microsoft'
                            ? 'text-[#10B981] dark:text-[#10B981]'
                            : 'text-[#0A2540] dark:text-white'
                          }`}>
                          Microsoft
                        </span>
                        {connectedProvider === 'microsoft' && (
                          <span className="text-xs text-[#10B981] dark:text-[#10B981] font-medium">
                            Conectado
                          </span>
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {!isGoogleConnected && (
                    <p className="text-xs text-center text-[#6C757D] dark:text-gray-400 mt-4">
                      Conecta tu calendario para sincronizar tus eventos
                    </p>
                  )}

                  {/* Error */}
                  {calendarError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-600 dark:text-red-400">{calendarError}</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Configuración de Calendarios */}
      <AnimatePresence>
        {isCalendarConfigOpen && connectedProvider && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCalendarConfigOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-[#6C757D]/30">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-[#6C757D]/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 dark:bg-accent/20">
                      <Settings className="w-5 h-5 text-accent" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Configuración
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsCalendarConfigOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#0A2540]/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Contenido */}
                <div className="p-5 space-y-5">
                  {/* Toggle: Solo eventos del plan */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#0A2540]/10 border border-gray-200 dark:border-[#6C757D]/20">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Solo eventos del plan
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Oculta eventos externos en el calendario
                      </p>
                    </div>
                    <motion.button
                      onClick={() => setShowOnlyPlanEvents(!showOnlyPlanEvents)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:ring-offset-2 cursor-pointer
                        ${showOnlyPlanEvents
                          ? 'bg-[#0A2540] dark:bg-[#0A2540]'
                          : 'bg-gray-300 dark:bg-[#6C757D]'
                        }
                      `}
                      role="switch"
                      aria-checked={showOnlyPlanEvents}
                      aria-label="Mostrar solo eventos del plan"
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.span
                        className="inline-block h-4 w-4 rounded-full bg-white shadow-md"
                        animate={{
                          x: showOnlyPlanEvents ? 22 : 4,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    </motion.button>
                  </div>

                  {/* Selección de calendarios */}
                  <CalendarSelectionPanel
                    provider={connectedProvider}
                    onSaveSuccess={() => {
                      setHasConfiguredCalendars(true);
                      setCalendarRefreshTrigger(prev => prev + 1);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <ToastNotification
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
        duration={toast.type === 'error' ? 6000 : 4000}
      />

      {/* Modal de Confirmación */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                confirmDialog.onCancel();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E9ECEF] dark:border-[#6C757D]/30"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                <h3 className="text-base font-semibold text-[#0A2540] dark:text-white">
                  Confirmar acción
                </h3>
              </div>

              {/* Contenido */}
              <div className="px-5 py-4">
                <p className="text-sm text-[#6C757D] dark:text-gray-400">
                  {confirmDialog.message}
                </p>
              </div>

              {/* Botones */}
              <div className="px-5 py-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 flex items-center justify-end gap-3">
                <button
                  onClick={confirmDialog.onCancel}
                  disabled={isDeletingPlan || isRecreatingPlan}
                  className="px-5 py-2 text-xs font-semibold text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  disabled={isDeletingPlan || isRecreatingPlan}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isDeletingPlan || isRecreatingPlan) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isDeletingPlan ? 'Eliminando...' : 'Procesando...'}
                    </>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {isMounted && <Joyride {...joyrideProps} />}
    </div>
  );
}

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Shield, Sparkles, X } from 'lucide-react'
import { SOFLIA_ADMIN_COLORS } from '../constants/admin-color-tokens'
import {
  AddCommunityModalFields,
  useAddCommunityModalForm,
} from './add-community-modal'
import type { AddCommunityModalProps } from './add-community-modal'

const colors = SOFLIA_ADMIN_COLORS

export function AddCommunityModal({
  isOpen,
  onClose,
  onSave,
}: AddCommunityModalProps) {
  const {
    formData,
    errors,
    error,
    courses,
    isSubmitting,
    isLoadingCourses,
    setFieldValue,
    handleSubmit,
  } = useAddCommunityModalForm({
    isOpen,
    onClose,
    onSave,
  })

  if (!isOpen) {
    return null
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm">
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10"
            style={{
              background: `linear-gradient(180deg, ${colors.bgSecondary} 0%, ${colors.bgPrimary} 100%)`,
            }}
          >
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className="rounded-2xl p-3"
                    style={{
                      background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
                    }}
                  >
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Crear comunidad
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Define identidad, acceso y relacion con cursos desde un
                      flujo tipado y validado.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-white/10 p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              <AddCommunityModalFields
                formData={formData}
                errors={errors}
                courses={courses}
                isLoadingCourses={isLoadingCourses}
                isSubmitting={isSubmitting}
                onFieldChange={setFieldValue}
              />

              <div
                className="flex flex-col gap-4 border-t border-white/10 pt-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="rounded-xl bg-[#00D4B3]/15 p-2">
                    <Shield className="h-5 w-5 text-[#00D4B3]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#00D4B3]">
                      Proteccion de datos y auditoria
                    </p>
                    <p className="text-xs text-gray-400">
                      El alta queda registrada y el payload sale normalizado
                      antes de persistirse.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
                      boxShadow: `0 10px 30px ${colors.accent}30`,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Creando...
                      </>
                    ) : (
                      <>
                        Crear comunidad
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

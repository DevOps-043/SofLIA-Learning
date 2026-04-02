'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Link2,
  Mail,
  MessageSquare,
  Send,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import type {
  BulkInviteForm,
  IndividualInviteForm,
  InviteRole,
  ModalStatus,
  UnifiedInviteModalController,
  UnifiedInviteTheme,
} from './types';

interface UnifiedInviteFormsViewProps {
  controller: UnifiedInviteModalController;
  mode: 'bulk' | 'individual';
  onClose: () => void;
  theme: UnifiedInviteTheme;
}

interface InviteRoleSelectorProps<TForm extends BulkInviteForm | IndividualInviteForm> {
  form: TForm;
  onRoleChange: (role: InviteRole) => void;
  roleLabels: UnifiedInviteModalController['roleLabels'];
  status: ModalStatus;
  theme: UnifiedInviteTheme;
}

function InviteRoleSelector<TForm extends BulkInviteForm | IndividualInviteForm>({
  form,
  onRoleChange,
  roleLabels,
  status,
  theme,
}: InviteRoleSelectorProps<TForm>) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(['member', 'admin', 'owner'] as const).map((role) => (
        <button
          className="p-3 rounded-xl border text-left transition-all disabled:opacity-50"
          disabled={status === 'loading'}
          key={role}
          onClick={() => onRoleChange(role)}
          style={{
            backgroundColor:
              form.role === role
                ? theme.isDark
                  ? `${theme.primaryColor}30`
                  : `${theme.primaryColor}10`
                : theme.inputBg,
            borderColor:
              form.role === role ? theme.primaryColor : theme.borderColor,
          }}
          type="button"
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield
              className="w-4 h-4"
              style={{
                color:
                  form.role === role
                    ? theme.isDark
                      ? '#FFFFFF'
                      : theme.primaryColor
                    : theme.mutedText,
              }}
            />
            <span
              className="text-sm font-medium"
              style={{
                color:
                  form.role === role
                    ? theme.isDark
                      ? '#FFFFFF'
                      : theme.primaryColor
                    : theme.textColor,
              }}
            >
              {roleLabels[role].label}
            </span>
          </div>
          <p className="text-xs hidden sm:block" style={{ color: theme.mutedText }}>
            {roleLabels[role].desc}
          </p>
        </button>
      ))}
    </div>
  );
}

export function UnifiedInviteFormsView({
  controller,
  mode,
  onClose,
  theme,
}: UnifiedInviteFormsViewProps) {
  const {
    bulkForm,
    error,
    handleBulkSubmit,
    handleIndividualSubmit,
    individualForm,
    roleLabels,
    setBulkForm,
    setIndividualForm,
    status,
    t,
  } = controller;

  const scrollStyle = {
    scrollbarColor: 'rgba(255,255,255,0.1) transparent',
    scrollbarWidth: 'thin' as const,
  };

  const primaryButtonStyle = {
    backgroundColor: theme.primaryColor,
    boxShadow: `0 4px 15px ${theme.primaryColor}40`,
    color: '#FFFFFF',
  };

  if (mode === 'individual') {
    return (
      <form className="flex flex-col overflow-hidden h-full" onSubmit={handleIndividualSubmit}>
        <div className="flex-1 overflow-y-auto p-6 space-y-5" style={scrollStyle}>
          {error && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400 flex-1">{error}</span>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.mutedText }}>
              {t('users.modals.invite.fields.email', 'Correo electronico')}{' '}
              <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: theme.mutedText }}
              />
              <input
                className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                disabled={status === 'loading'}
                onChange={(event) =>
                  setIndividualForm((currentForm) => ({
                    ...currentForm,
                    email: event.target.value,
                  }))
                }
                placeholder={t(
                  'users.modals.invite.placeholders.email',
                  'usuario@empresa.com'
                )}
                required
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  color: theme.textColor,
                }}
                type="email"
                value={individualForm.email}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.mutedText }}>
              {t('users.modals.invite.fields.role', 'Rol en la organizacion')}{' '}
              <span className="text-red-400">*</span>
            </label>
            <InviteRoleSelector
              form={individualForm}
              onRoleChange={(role) =>
                setIndividualForm((currentForm) => ({ ...currentForm, role }))
              }
              roleLabels={roleLabels}
              status={status}
              theme={theme}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.mutedText }}>
              {t('users.modals.invite.fields.position', 'Cargo / Posicion')}
              <span className="ml-1" style={{ color: theme.mutedText }}>
                ({t('common.optional', 'Opcional')})
              </span>
            </label>
            <div className="relative">
              <Briefcase
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: theme.mutedText }}
              />
              <input
                className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                disabled={status === 'loading'}
                maxLength={100}
                onChange={(event) =>
                  setIndividualForm((currentForm) => ({
                    ...currentForm,
                    position: event.target.value,
                  }))
                }
                placeholder={t(
                  'users.modals.invite.placeholders.position',
                  'Ej: Gerente de Ventas'
                )}
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  color: theme.textColor,
                }}
                type="text"
                value={individualForm.position}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.mutedText }}>
              {t('users.modals.invite.fields.message', 'Mensaje personalizado')}
              <span className="ml-1" style={{ color: theme.mutedText }}>
                ({t('common.optional', 'Opcional')})
              </span>
            </label>
            <div className="relative">
              <MessageSquare
                className="absolute left-3 top-3 w-4 h-4"
                style={{ color: theme.mutedText }}
              />
              <textarea
                className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors resize-none disabled:opacity-50"
                disabled={status === 'loading'}
                maxLength={500}
                onChange={(event) =>
                  setIndividualForm((currentForm) => ({
                    ...currentForm,
                    customMessage: event.target.value,
                  }))
                }
                placeholder={t(
                  'users.modals.invite.placeholders.message',
                  'Agrega un mensaje personalizado...'
                )}
                rows={3}
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  color: theme.textColor,
                }}
                value={individualForm.customMessage}
              />
            </div>
            <p className="text-xs mt-1 text-right" style={{ color: theme.mutedText }}>
              {individualForm.customMessage.length}/500
            </p>
          </div>

          <div
            className="p-4 rounded-xl border"
            style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
          >
            <div className="flex items-start gap-3">
              <Sparkles
                className="w-5 h-5 flex-shrink-0"
                style={{ color: theme.accentColor }}
              />
              <div className="text-sm" style={{ color: theme.mutedText }}>
                <p>
                  {t(
                    'users.modals.invite.hints.info',
                    'El usuario recibira un correo con un enlace para completar su registro. La invitacion expira en 7 dias.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="p-6 border-t flex items-center justify-end gap-3 shrink-0"
          style={{ borderColor: theme.borderColor }}
        >
          <button
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/5"
            disabled={status === 'loading'}
            onClick={onClose}
            style={{ color: theme.mutedText }}
            type="button"
          >
            {t('users.buttons.cancel', 'Cancelar')}
          </button>
          <motion.button
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 disabled:opacity-70"
            disabled={status === 'loading'}
            style={primaryButtonStyle}
            type="submit"
            whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
            whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
          >
            {status === 'loading' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t('users.buttons.sending', 'Enviando...')}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{t('users.buttons.sendInvite', 'Enviar Invitacion')}</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    );
  }

  return (
    <form className="flex flex-col overflow-hidden h-full" onSubmit={handleBulkSubmit}>
      <div className="flex-1 overflow-y-auto p-6 space-y-5" style={scrollStyle}>
        {error && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-400 flex-1">{error}</span>
          </motion.div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.mutedText }}>
            {t('users.modals.bulkInvite.fields.name', 'Nombre del enlace')}
            <span className="ml-1" style={{ color: theme.mutedText }}>
              ({t('common.optional', 'Opcional')})
            </span>
          </label>
          <input
            className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
            disabled={status === 'loading'}
            maxLength={100}
            onChange={(event) =>
              setBulkForm((currentForm) => ({
                ...currentForm,
                name: event.target.value,
              }))
            }
            placeholder={t(
              'users.modals.bulkInvite.placeholders.name',
              'Ej: Invitacion Equipo de Ventas'
            )}
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
            type="text"
            value={bulkForm.name}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.mutedText }}>
            {t('users.modals.bulkInvite.fields.maxUses', 'Numero maximo de registros')}{' '}
            <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Users
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: theme.mutedText }}
            />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
              disabled={status === 'loading'}
              max={10000}
              min={1}
              onChange={(event) =>
                setBulkForm((currentForm) => ({
                  ...currentForm,
                  maxUses: parseInt(event.target.value, 10) || 0,
                }))
              }
              required
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.borderColor,
                color: theme.textColor,
              }}
              type="number"
              value={bulkForm.maxUses}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: theme.mutedText }}>
            {t(
              'users.modals.bulkInvite.hints.maxUses',
              'Maximo de usuarios que pueden registrarse (1-10,000)'
            )}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.mutedText }}>
            {t('users.modals.bulkInvite.fields.role', 'Rol asignado')}{' '}
            <span className="text-red-400">*</span>
          </label>
          <InviteRoleSelector
            form={bulkForm}
            onRoleChange={(role) =>
              setBulkForm((currentForm) => ({ ...currentForm, role }))
            }
            roleLabels={roleLabels}
            status={status}
            theme={theme}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.mutedText }}>
            {t('users.modals.bulkInvite.fields.expiresAt', 'Fecha de expiracion')}{' '}
            <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: theme.mutedText }}
            />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
              disabled={status === 'loading'}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(event) =>
                setBulkForm((currentForm) => ({
                  ...currentForm,
                  expiresAt: event.target.value,
                }))
              }
              required
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.borderColor,
                color: theme.textColor,
              }}
              type="datetime-local"
              value={bulkForm.expiresAt}
            />
          </div>
        </div>

        <div
          className="p-4 rounded-xl border"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
        >
          <div className="flex items-start gap-3">
            <Sparkles
              className="w-5 h-5 flex-shrink-0"
              style={{ color: theme.accentColor }}
            />
            <div className="text-sm" style={{ color: theme.mutedText }}>
              <p>
                {t(
                  'users.modals.bulkInvite.hints.info',
                  'El enlace permitira que cualquier persona se registre en tu organizacion con el rol especificado.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="p-6 border-t flex items-center justify-end gap-3 shrink-0"
        style={{ borderColor: theme.borderColor }}
      >
        <button
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/5"
          disabled={status === 'loading'}
          onClick={onClose}
          style={{ color: theme.mutedText }}
          type="button"
        >
          {t('users.buttons.cancel', 'Cancelar')}
        </button>
        <motion.button
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 disabled:opacity-70"
          disabled={status === 'loading'}
          style={primaryButtonStyle}
          type="submit"
          whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
          whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
        >
          {status === 'loading' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('users.buttons.creating', 'Creando...')}</span>
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              <span>{t('users.buttons.createLink', 'Crear Enlace')}</span>
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}

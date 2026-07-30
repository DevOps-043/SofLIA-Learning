'use client'

import { useEffect, type CSSProperties } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useProfilePageLogic } from '../../hooks/useProfilePageLogic'
import { ProfileHero } from './ProfileHero'
import { ProfilePageHeader } from './ProfilePageHeader'
import { ProfilePersonalTab } from './ProfilePersonalTab'
import { ProfileSecurityTab } from './ProfileSecurityTab'
import { ProfileTabs } from './ProfileTabs'
import styles from './ProfileExperience.module.css'

type ProfilePageLogic = ReturnType<typeof useProfilePageLogic>

export function ProfilePageContent(logic: ProfilePageLogic) {
  const {
    colors,
    profile,
    stats,
    activeTab,
    setActiveTab,
    formData,
    toast,
    hideToast,
    imageError,
    setImageError,
    isRemovingProfilePicture,
    passwordErrors,
    currentPassword,
    newPassword,
    confirmPassword,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    setShowCurrentPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    isChangingPassword,
    saving,
    setPasswordValue,
    handleInputChange,
    handleSave,
    handleProfilePictureUpload,
    handleProfilePictureRemove,
    handleChangePassword,
    goBack,
    formatDate
  } = logic

  const hasOAuthAuthProvider = Boolean(profile?.auth_providers?.length)
  const canEditCredentials = profile
    ? !hasOAuthAuthProvider && profile.can_edit_credentials
    : false

  useEffect(() => {
    if (!canEditCredentials && activeTab === 'security') {
      setActiveTab('personal')
    }
  }, [activeTab, canEditCredentials, setActiveTab])

  if (!profile) {
    return null
  }

  const profileTheme = {
    '--profile-primary': colors.primary,
    '--profile-accent': colors.accent,
    '--profile-on-primary': colors.onPrimary,
    '--profile-on-accent': colors.onAccent,
    '--profile-success': colors.success,
    '--profile-warning': colors.warning,
    '--profile-error': colors.error,
    '--profile-canvas': colors.bgPrimary,
    '--profile-surface': colors.bgSecondary,
    '--profile-surface-alt': colors.bgTertiary,
    '--profile-text': colors.text,
    '--profile-muted': colors.textSecondary,
    '--profile-border': colors.border,
    colorScheme: colors.isLightMode ? 'light' : 'dark',
  } as CSSProperties

  return (
    <>
      <div className={styles.page} style={profileTheme}>
        <ProfilePageHeader saving={saving} goBack={goBack} handleSave={handleSave} />

        <main className={styles.main}>
          <ProfileHero
            profile={profile}
            stats={stats}
            colors={colors}
            imageError={imageError}
            setImageError={setImageError}
            isRemovingProfilePicture={isRemovingProfilePicture}
            handleProfilePictureUpload={handleProfilePictureUpload}
            handleProfilePictureRemove={handleProfilePictureRemove}
            formatDate={formatDate}
          />

          <ProfileTabs activeTab={activeTab} canEditCredentials={canEditCredentials} setActiveTab={setActiveTab} />

          <div className={styles.contentCard}>
            <AnimatePresence initial={false}>
              {activeTab === 'personal' || !canEditCredentials ? (
                <ProfilePersonalTab formData={formData} handleInputChange={handleInputChange} colors={colors} />
              ) : (
                <ProfileSecurityTab
                  profile={profile}
                  colors={colors}
                  currentPassword={currentPassword}
                  newPassword={newPassword}
                  confirmPassword={confirmPassword}
                  showCurrentPassword={showCurrentPassword}
                  showNewPassword={showNewPassword}
                  showConfirmPassword={showConfirmPassword}
                  setShowCurrentPassword={setShowCurrentPassword}
                  setShowNewPassword={setShowNewPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                  setPasswordValue={setPasswordValue}
                  passwordErrors={passwordErrors}
                  isChangingPassword={isChangingPassword}
                  handleChangePassword={handleChangePassword}
                />
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
      <ToastNotification
        isOpen={toast.isOpen}
        onClose={hideToast}
        message={toast.message}
        type={toast.type}
        position="top-right"
      />
    </>
  )
}

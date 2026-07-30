'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { AlertCircle, BookOpen, Briefcase, Calendar, Camera, Check, GraduationCap, Mail, Trash2, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ProfileColorPalette, UserProfile, UserStats } from '../../types/profile.types'
import styles from './ProfileExperience.module.css'

interface ProfileHeroProps {
  profile: UserProfile
  stats: UserStats | null
  colors: ProfileColorPalette
  imageError: boolean
  setImageError: (value: boolean) => void
  isRemovingProfilePicture: boolean
  handleProfilePictureUpload: (file: File) => Promise<void>
  handleProfilePictureRemove: () => Promise<void>
  formatDate: (dateString: string) => string
}

export function ProfileHero({
  profile,
  stats,
  colors,
  imageError,
  setImageError,
  isRemovingProfilePicture,
  handleProfilePictureUpload,
  handleProfilePictureRemove,
  formatDate
}: ProfileHeroProps) {
  const { t } = useTranslation('common')
  const hasProfilePicture = Boolean(profile.profile_picture_url && !imageError)
  const EmailStatusIcon = profile.email_verified ? Check : AlertCircle
  const emailStatusColor = profile.email_verified ? colors.success : colors.warning

  return (
    <section className={styles.hero}>
      <div className={styles.heroGrid}>
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className={styles.avatarBlock}
          initial={{ opacity: 0, scale: 0.94 }}
        >
          <div className={styles.avatarFrame}>
            {hasProfilePicture ? (
              <Image
                src={profile.profile_picture_url}
                alt={t('profile.hero.avatarAlt')}
                className={styles.avatarImage}
                fill
                sizes="(max-width: 640px) 104px, 136px"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <span className={styles.avatarFallback}>
                <User className="h-12 w-12" aria-hidden="true" />
              </span>
            )}
          </div>

          <input
            type="file"
            id="avatar-upload"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={event => {
              const file = event.target.files?.[0]
              if (!file) {
                return
              }

              void handleProfilePictureUpload(file)
            }}
          />
          <motion.label
            htmlFor="avatar-upload"
            aria-label={t('profile.hero.uploadPhoto')}
            title={t('profile.hero.uploadPhoto')}
            className={`${styles.avatarAction} ${styles.avatarUpload}`}
            whileTap={{ scale: 0.96 }}
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
          </motion.label>
          {hasProfilePicture ? (
            <motion.button
              aria-label={t('profile.hero.removePhoto')}
              className={`${styles.avatarAction} ${styles.avatarRemove}`}
              disabled={isRemovingProfilePicture}
              onClick={() => void handleProfilePictureRemove()}
              title={t('profile.hero.removePhoto')}
              type="button"
              whileTap={isRemovingProfilePicture ? undefined : { scale: 0.96 }}
            >
              {isRemovingProfilePicture ? (
                <span className={styles.spinner} aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
            </motion.button>
          ) : null}
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={styles.heroIdentity}
          initial={{ opacity: 0, y: 12 }}
          transition={{ delay: 0.08 }}
        >
          <span className={styles.heroEyebrow}>Perfil personal</span>
          <h1 className={styles.heroName}>{profile.display_name}</h1>
          <p className={styles.heroRole}>
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            {profile.job_title || t('profile.hero.noRole')}
          </p>
          <div className={styles.heroMeta}>
            <span className={styles.heroMetaItem}>
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {t('profile.hero.memberSince')} {formatDate(profile.created_at)}
            </span>
            {profile.email ? (
              <span className={styles.heroMetaItem}>
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <span className={styles.heroEmail}>{profile.email}</span>
              </span>
            ) : null}
            <span className={styles.verifiedBadge} style={{ color: emailStatusColor }}>
              <EmailStatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {profile.email_verified ? t('profile.hero.emailVerified') : t('profile.hero.emailUnverified')}
            </span>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={styles.stats}
          initial={{ opacity: 0, y: 12 }}
          transition={{ delay: 0.14 }}
        >
          {[
            {
              icon: BookOpen,
              value: stats?.completedLessons ?? 0,
              label: t('profile.hero.stats.lessons'),
            },
            {
              icon: GraduationCap,
              value: stats?.certificates ?? 0,
              label: t('profile.hero.stats.certificates'),
            },
          ].map(stat => {
            const StatIcon = stat.icon
            return (
              <div key={stat.label} className={styles.statCard}>
                <span className={styles.statIcon}>
                  <StatIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

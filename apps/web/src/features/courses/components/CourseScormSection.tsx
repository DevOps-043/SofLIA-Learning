'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SCORMUploader, useScormPackage, ScormPackage } from '@/features/scorm';
import Link from 'next/link';

interface CourseScormSectionProps {
  courseId: string;
  organizationId: string;
}

export function CourseScormSection({ courseId, organizationId }: CourseScormSectionProps) {
  const { packages, isLoading, refetch } = useScormPackage({ courseId, organizationId });
  const [showUploader, setShowUploader] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { t } = useTranslation('learn');

  const handleUploadSuccess = (packageData: ScormPackage) => {
    refetch();
    setShowUploader(false);
  };

  const handleDeleteRequest = (packageId: string) => {
    setPendingDeleteId(packageId);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDeleting(id);
    try {
      const response = await fetch(`/api/scorm/packages/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        refetch();
      }
    } catch (error) {
      techDebtLogger.error('Error deleting package:', error);
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      {/* Inline delete confirmation */}
      {pendingDeleteId && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-4">
          <p className="text-sm text-red-700">{t('scorm.confirmDelete')}</p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setPendingDeleteId(null)}
              className="px-3 py-1.5 text-sm bg-white border border-red-200 text-red-700 rounded hover:bg-red-50 transition-colors"
            >
              {t('scorm.cancelUpload')}
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              {t('scorm.delete')}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {t('scorm.title')}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {t('scorm.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            showUploader
              ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {showUploader ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t('scorm.cancelUpload')}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('scorm.uploadPackage')}
            </>
          )}
        </button>
      </div>

      {showUploader && (
        <div className="mb-6">
          <SCORMUploader
            courseId={courseId}
            organizationId={organizationId}
            onSuccess={handleUploadSuccess}
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-neutral-500 text-sm mt-2">{t('scorm.loading')}</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
          <svg className="w-12 h-12 mx-auto text-neutral-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-neutral-600 font-medium">{t('scorm.empty')}</p>
          <p className="text-neutral-500 text-sm mt-1">{t('scorm.emptyHint')}</p>
          {!showUploader && (
            <button
              onClick={() => setShowUploader(true)}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('scorm.uploadPackage')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors ${
                deleting === pkg.id ? 'opacity-50' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="font-medium text-neutral-900 truncate">{pkg.title}</h3>
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                    {pkg.version === 'SCORM_2004' ? 'SCORM 2004' : 'SCORM 1.2'}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {formatFileSize(pkg.file_size)}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {new Date(pkg.created_at).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    pkg.status === 'active'
                      ? 'bg-green-50 text-green-700'
                      : pkg.status === 'processing'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {pkg.status === 'active' ? t('scorm.statusActive') : pkg.status === 'processing' ? t('scorm.statusProcessing') : t('scorm.statusInactive')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/courses/${courseId}/scorm/${pkg.id}`}
                  className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                >
                  {t('scorm.preview')}
                </Link>
                <button
                  onClick={() => handleDeleteRequest(pkg.id)}
                  disabled={deleting === pkg.id}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                >
                  {deleting === pkg.id ? t('scorm.deleting') : t('scorm.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext';
import { inviteUserAction } from '../../auth/actions/invitation';
import { useThemeStore } from '../../../core/stores/themeStore';
import {
  type BulkInviteLink,
  type BusinessInviteBulkForm,
  type BusinessInviteIndividualForm,
  type BusinessInviteModalProps,
  type BusinessInviteRole,
  type CreatedLink,
  type InviteStatus,
  getBusinessInviteStatusConfig,
  getBusinessInviteTabs,
  getBusinessInviteUrl,
  getDefaultBusinessInviteExpiry,
} from '../services/business-invite-modal.service';

export function useBusinessInviteModalLogic({
  isOpen,
  onClose,
  onInviteSent,
  organizationId,
  organizationSlug,
  defaultTab = 'individual',
}: BusinessInviteModalProps) {
  const params = useParams();
  const orgSlug = organizationSlug || (params?.orgSlug as string);
  const { t } = useTranslation('business');
  const { styles } = useOrganizationStylesContext();
  const { resolvedTheme } = useThemeStore();
  const panelStyles = styles?.panel;

  const isDark = resolvedTheme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const primaryColor = panelStyles?.primary_button_color || '#0A2540';
  const accentColor = panelStyles?.accent_color || '#00D4B3';

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [individualForm, setIndividualForm] = useState<BusinessInviteIndividualForm>({
    email: '',
    role: 'member',
    position: '',
    customMessage: '',
  });
  const [individualStatus, setIndividualStatus] = useState<InviteStatus>('idle');
  const [individualError, setIndividualError] = useState<string | null>(null);
  const [individualSuccess, setIndividualSuccess] = useState<string | null>(null);

  const [bulkForm, setBulkForm] = useState<BusinessInviteBulkForm>({
    name: '',
    maxUses: 100,
    role: 'member',
    expiresAt: '',
  });
  const [bulkStatus, setBulkStatus] = useState<InviteStatus>('idle');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(null);
  const [copied, setCopied] = useState(false);

  const [links, setLinks] = useState<BulkInviteLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !bulkForm.expiresAt) {
      setBulkForm((prev) => ({
        ...prev,
        expiresAt: getDefaultBusinessInviteExpiry(),
      }));
    }
  }, [bulkForm.expiresAt, isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'manage') {
      void fetchLinks();
    }
  }, [activeTab, isOpen]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setActiveTab(defaultTab);
    setIndividualForm({ email: '', role: 'member', position: '', customMessage: '' });
    setIndividualStatus('idle');
    setIndividualError(null);
    setIndividualSuccess(null);
    setBulkForm({ name: '', maxUses: 100, role: 'member', expiresAt: '' });
    setBulkStatus('idle');
    setBulkError(null);
    setCreatedLink(null);
    setCopied(false);
    setLinksError(null);
    setOpenMenuId(null);
  }, [defaultTab, isOpen]);

  const fetchLinks = async () => {
    setLinksLoading(true);
    setLinksError(null);

    try {
      const response = await fetch(`/api/${orgSlug}/business/invite-links`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al cargar enlaces');
      }

      setLinks(data.links || []);
    } catch (error) {
      setLinksError(error instanceof Error ? error.message : 'Error al cargar enlaces');
    } finally {
      setLinksLoading(false);
    }
  };

  const handleIndividualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIndividualStatus('loading');
    setIndividualError(null);

    try {
      if (!organizationId) {
        throw new Error('No se encontro la organizacion');
      }

      const result = await inviteUserAction({
        email: individualForm.email,
        role: individualForm.role,
        organizationId,
        position: individualForm.position || undefined,
        customMessage: individualForm.customMessage || undefined,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setIndividualStatus('success');
      setIndividualSuccess(`Invitacion enviada exitosamente a ${individualForm.email}`);

      setTimeout(() => {
        onInviteSent?.();
        setIndividualForm({ email: '', role: 'member', position: '', customMessage: '' });
        setIndividualStatus('idle');
        setIndividualSuccess(null);
      }, 2000);
    } catch (error) {
      setIndividualStatus('error');
      setIndividualError(error instanceof Error ? error.message : 'Error al enviar invitacion');
    }
  };

  const handleBulkSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBulkStatus('loading');
    setBulkError(null);

    try {
      const response = await fetch(`/api/${orgSlug}/business/invite-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: bulkForm.name || null,
          maxUses: bulkForm.maxUses,
          role: bulkForm.role,
          expiresAt: bulkForm.expiresAt,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al crear el enlace');
      }

      setCreatedLink(data.link);
      setBulkStatus('success');
      onInviteSent?.();
    } catch (error) {
      setBulkStatus('error');
      setBulkError(error instanceof Error ? error.message : 'Error al crear el enlace');
    }
  };

  const getInviteUrl = (token: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return getBusinessInviteUrl(baseUrl, token);
  };

  const handleCopyLink = async (token: string, linkId?: string) => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(token));
      if (linkId) {
        setCopiedId(linkId);
        setTimeout(() => setCopiedId(null), 2000);
        return;
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failure should not block the modal workflow.
    }
  };

  const handleLinkAction = async (linkId: string, action: 'pause' | 'resume' | 'delete') => {
    setActionLoading(linkId);
    setOpenMenuId(null);

    try {
      if (action === 'delete') {
        const response = await fetch(`/api/${orgSlug}/business/invite-links/${linkId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al eliminar');
        }

        setLinks((prev) => prev.filter((link) => link.id !== linkId));
      } else {
        const response = await fetch(`/api/${orgSlug}/business/invite-links/${linkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al actualizar');
        }

        setLinks((prev) => prev.map((link) => (link.id === linkId ? data.link : link)));
      }
    } catch (error) {
      setLinksError(error instanceof Error ? error.message : 'Error en la operacion');
    } finally {
      setActionLoading(null);
    }
  };

  const roleLabels: Record<BusinessInviteRole, { label: string; desc: string }> = {
    member: { label: t('users.roles.member', 'Miembro'), desc: 'Acceso basico a la plataforma' },
    admin: { label: t('users.roles.admin', 'Administrador'), desc: 'Puede gestionar usuarios y contenido' },
    owner: { label: t('users.roles.owner', 'Propietario'), desc: 'Control total de la organizacion' },
  };

  return {
    isDark,
    textColor,
    mutedText,
    borderColor,
    inputBg,
    primaryColor,
    accentColor,
    t,
    activeTab,
    setActiveTab,
    tabs: getBusinessInviteTabs(links.length),
    individualForm,
    setIndividualForm,
    individualStatus,
    individualError,
    individualSuccess,
    handleIndividualSubmit,
    bulkForm,
    setBulkForm,
    bulkStatus,
    setBulkStatus,
    bulkError,
    createdLink,
    setCreatedLink,
    copied,
    handleBulkSubmit,
    links,
    linksLoading,
    linksError,
    setLinksError,
    copiedId,
    actionLoading,
    openMenuId,
    setOpenMenuId,
    fetchLinks,
    handleCopyLink,
    handleLinkAction,
    getInviteUrl,
    getStatusConfig: (status: string) => getBusinessInviteStatusConfig(status, mutedText, inputBg),
    roleLabels,
  };
}

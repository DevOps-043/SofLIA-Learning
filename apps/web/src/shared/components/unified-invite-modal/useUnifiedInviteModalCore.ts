'use client';

import { useCallback, useEffect, useState } from 'react';
import { inviteUserAction } from '../../../features/auth/actions/invitation';
import type {
  ModalStatus,
  UnifiedInviteLinkRecord,
  UseUnifiedInviteModalCoreOptions,
} from './types';
import {
  buildInviteRoleLabels,
  buildInviteStatusConfig,
  copyTextToClipboard,
  createDefaultBulkInviteForm,
  createDefaultIndividualInviteForm,
  normalizeInviteLinkRecord,
  normalizeInviteLinkRecords,
} from './utils';

export function useUnifiedInviteModalCore({
  inputBg,
  inviteLinksBasePath,
  isOpen,
  mutedText,
  onClose,
  onInviteSent,
  onLinkCreated,
  organizationId,
  t,
}: UseUnifiedInviteModalCoreOptions) {
  const [mode, setMode] = useState<'individual' | 'bulk' | 'manage'>(
    'individual'
  );
  const [status, setStatus] = useState<ModalStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [individualForm, setIndividualForm] = useState(
    createDefaultIndividualInviteForm()
  );
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [bulkForm, setBulkForm] = useState(createDefaultBulkInviteForm);
  const [createdLink, setCreatedLink] = useState<UnifiedInviteLinkRecord | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<UnifiedInviteLinkRecord[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const roleLabels = buildInviteRoleLabels(t);

  const fetchLinks = useCallback(async () => {
    setIsLoadingLinks(true);
    setLinksError(null);

    try {
      const response = await fetch(inviteLinksBasePath, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al cargar enlaces');
      }

      setLinks(normalizeInviteLinkRecords(data.links));
    } catch (requestError) {
      setLinksError(
        requestError instanceof Error
          ? requestError.message
          : 'Error al cargar enlaces'
      );
    } finally {
      setIsLoadingLinks(false);
    }
  }, [inviteLinksBasePath]);

  useEffect(() => {
    if (isOpen && !bulkForm.expiresAt) {
      setBulkForm(createDefaultBulkInviteForm());
    }
  }, [bulkForm.expiresAt, isOpen]);

  useEffect(() => {
    if (isOpen && mode === 'manage') {
      void fetchLinks();
    }
  }, [fetchLinks, isOpen, mode]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setMode('individual');
    setStatus('idle');
    setError(null);
    setIndividualForm(createDefaultIndividualInviteForm());
    setBulkForm(createDefaultBulkInviteForm());
    setSuccessEmail(null);
    setCreatedLink(null);
    setCopied(false);
    setLinks([]);
    setLinksError(null);
    setCopiedId(null);
    setActionLoading(null);
    setOpenMenuId(null);
  }, [isOpen]);

  const handleIndividualSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      if (!organizationId) {
        throw new Error('No se encontro la organizacion');
      }

      const result = await inviteUserAction({
        customMessage: individualForm.customMessage || undefined,
        email: individualForm.email,
        organizationId,
        position: individualForm.position || undefined,
        role: individualForm.role,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setStatus('success');
      setSuccessEmail(individualForm.email);

      window.setTimeout(() => {
        onInviteSent?.();
        onClose();
      }, 2000);
    } catch (submissionError) {
      setStatus('error');
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Error al enviar invitacion'
      );
    }
  };

  const handleBulkSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(inviteLinksBasePath, {
        body: JSON.stringify({
          expiresAt: bulkForm.expiresAt,
          maxUses: bulkForm.maxUses,
          name: bulkForm.name || null,
          role: bulkForm.role,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al crear el enlace');
      }

      setCreatedLink(normalizeInviteLinkRecord(data.link));
      setStatus('success');
      onLinkCreated?.();
    } catch (submissionError) {
      setStatus('error');
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Error al crear el enlace'
      );
    }
  };

  const getInviteUrl = (token?: string) => {
    const inviteToken = token || createdLink?.token;

    if (!inviteToken) {
      return '';
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/invite/${inviteToken}`;
  };

  const handleCopy = async () => {
    const wasCopied = await copyTextToClipboard(getInviteUrl());

    if (!wasCopied) {
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = async (link: UnifiedInviteLinkRecord) => {
    const wasCopied = await copyTextToClipboard(getInviteUrl(link.token));

    if (!wasCopied) {
      return;
    }

    setCopiedId(link.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLinkAction = async (
    linkId: string,
    action: 'delete' | 'pause' | 'resume'
  ) => {
    setActionLoading(linkId);
    setOpenMenuId(null);

    try {
      if (action === 'delete') {
        const response = await fetch(`${inviteLinksBasePath}/${linkId}`, {
          credentials: 'include',
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al eliminar');
        }

        setLinks((currentLinks) =>
          currentLinks.filter((link) => link.id !== linkId)
        );
      } else {
        const response = await fetch(`${inviteLinksBasePath}/${linkId}`, {
          body: JSON.stringify({ action }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al actualizar');
        }

        const nextLink = normalizeInviteLinkRecord(data.link);
        setLinks((currentLinks) =>
          currentLinks.map((link) => (link.id === linkId ? nextLink : link))
        );
      }
    } catch (actionError) {
      setLinksError(
        actionError instanceof Error
          ? actionError.message
          : 'Error en la operacion'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAnother = () => {
    setStatus('idle');
    setCreatedLink(null);
    setBulkForm(createDefaultBulkInviteForm());
  };

  const getStatusConfig = (linkStatus: string) =>
    buildInviteStatusConfig(t, linkStatus, mutedText, inputBg);

  return {
    actionLoading,
    bulkForm,
    copied,
    copiedId,
    createdLink,
    error,
    fetchLinks,
    getInviteUrl,
    getStatusConfig,
    handleBulkSubmit,
    handleCopy,
    handleCopyLink,
    handleCreateAnother,
    handleIndividualSubmit,
    handleLinkAction,
    individualForm,
    isLoadingLinks,
    links,
    linksError,
    mode,
    openMenuId,
    roleLabels,
    setBulkForm,
    setError,
    setIndividualForm,
    setLinksError,
    setMode,
    setOpenMenuId,
    setStatus,
    status,
    successEmail,
    t,
  };
}

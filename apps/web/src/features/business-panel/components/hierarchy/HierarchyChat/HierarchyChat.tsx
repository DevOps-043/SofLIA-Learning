import { AnimatePresence } from 'framer-motion'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { HierarchyChatType } from '../../../types/hierarchy.types'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import { ChatHeader } from './ChatHeader'
import { ChatInput } from './ChatInput'
import { ChatMessages } from './ChatMessages'
import { FilePreview } from './FilePreview'
import { ImageModal } from './ImageModal'
import { useChatLogic } from './hooks/useChatLogic'

interface HierarchyChatProps {
  entityType: 'region' | 'zone' | 'team' | 'node'
  entityId: string
  chatType: HierarchyChatType
  title?: string
  className?: string
}

export function HierarchyChat({
  entityType,
  entityId,
  chatType = 'vertical',
  title,
  className = '',
}: HierarchyChatProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const {
    chat,
    messages,
    participants,
    loading,
    error,
    sending,
    currentUser,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    editingMessageId,
    editContent,
    setEditContent,
    setEditingMessageId,
    startEditing,
    getMessageAttachment,
    messagesEndRef,
    messagesContainerRef,
    messageContent,
    setMessageContent,
    showEmojiPicker,
    setShowEmojiPicker,
    activeEmojiCategory,
    setActiveEmojiCategory,
    insertEmoji,
    handleFileSelect,
    selectedFile,
    filePreview,
    imageModal,
    setImageModal,
    fileInputRef,
    emojiPickerRef,
    removeSelectedFile,
  } = useChatLogic({
    entityType,
    entityId,
    chatType,
  })

  if (loading && !chat) {
    return (
      <div
        className={`flex h-[600px] items-center justify-center rounded-2xl border ${className}`}
        style={{
          backgroundColor: theme.panelBg,
          borderColor: theme.borderColor,
        }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primaryColor }} />
      </div>
    )
  }

  const handleDownload = (url: string, _name?: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div
        className={`flex h-[600px] flex-col overflow-hidden rounded-2xl border ${className}`}
        style={{
          backgroundColor: theme.panelBg,
          borderColor: theme.borderColor,
        }}
      >
        <ChatHeader
          title={title || chat?.name || t('hierarchy.chat.defaultTitle')}
          description={chat?.description || undefined}
          participantsCount={participants.length || chat?.participants_count || 0}
          onlineCount={0}
        />

        <div className="relative flex flex-1 flex-col overflow-hidden">
          {error && (
            <div
              className="mx-4 mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
              style={{
                backgroundColor: theme.isDark
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(239, 68, 68, 0.08)',
                borderColor: theme.dangerColor,
                color: theme.dangerColor,
              }}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <ChatMessages
            messages={messages}
            userId={currentUser?.id}
            editingMessageId={editingMessageId}
            editContent={editContent}
            onEditChange={setEditContent}
            onEditSubmit={handleEditMessage}
            onEditCancel={() => {
              setEditingMessageId(null)
              setEditContent('')
            }}
            onStartEdit={startEditing}
            onDelete={handleDeleteMessage}
            onImageClick={(url, name) => setImageModal({ url, name })}
            onDownload={handleDownload}
            getAttachment={getMessageAttachment}
            messagesEndRef={messagesEndRef}
            messagesContainerRef={messagesContainerRef}
          />
        </div>

        {selectedFile && (
          <FilePreview
            file={selectedFile}
            preview={filePreview}
            onRemove={removeSelectedFile}
          />
        )}

        <ChatInput
          messageContent={messageContent}
          onMessageChange={setMessageContent}
          onSend={handleSendMessage}
          isSending={sending}
          hasFile={Boolean(selectedFile)}
          showEmojiPicker={showEmojiPicker}
          onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
          activeEmojiCategory={activeEmojiCategory}
          onEmojiCategoryChange={setActiveEmojiCategory}
          onEmojiSelect={insertEmoji}
          onFileClick={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          emojiPickerRef={emojiPickerRef}
          onFileChange={handleFileSelect}
        />
      </div>

      <AnimatePresence>
        {imageModal && (
          <ImageModal
            url={imageModal.url}
            name={imageModal.name}
            onClose={() => setImageModal(null)}
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>
    </>
  )
}

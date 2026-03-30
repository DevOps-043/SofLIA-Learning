import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import type { HierarchyChatType } from '@/features/business-panel/types/hierarchy.types'
import { useChatLogic } from './hooks/useChatLogic'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ChatHeader } from './ChatHeader'

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
  className = ''
}: HierarchyChatProps) {
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const [modalImage, setModalImage] = useState<string | null>(null)

  const {
    chat,
    messages,
    loading,
    sending,
    currentUser,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    uploadFile,
    loadMoreMessages,
    hasMore,
    markAsRead,
    editingMessageId,
    editContent,
    setEditContent,
    setEditingMessageId,
    startEditing,
    getMessageAttachment,
    messagesEndRef,
    messagesContainerRef,
    setImageModal,
    // Input state
    messageContent,
    setMessageContent,
    showEmojiPicker,
    setShowEmojiPicker,
    activeEmojiCategory,
    setActiveEmojiCategory,
    insertEmoji,
    handleFileSelect,
    selectedFile,
    fileInputRef,
    emojiPickerRef
  } = useChatLogic({
    entityType: entityType as any,
    entityId,
    chatType
  })

  if (loading && !chat) {
    return (
      <div className={`flex items-center justify-center h-[600px] rounded-2xl border ${className} ${isDark ? 'bg-[#0F1419] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const primaryColor = styles?.primaryColor || '#3B82F6'
  const accentColor = styles?.accentColor || '#10B981'

  return (
    <div
      className={`flex flex-col h-[600px] rounded-2xl border overflow-hidden ${className}`}
      style={{
        backgroundColor: isDark ? '#0F1419' : '#F8FAFC',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
      }}
    >
      <ChatHeader
        title={title || chat?.name || 'Chat de Equipo'}
        description={chat?.description}
        participantsCount={chat?.participants_count || 0}
        onlineCount={0}
      />

      <div className="flex-1 overflow-hidden relative flex flex-col">
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
          onDownload={(url) => window.open(url, '_blank')}
          getAttachment={getMessageAttachment}
          messagesEndRef={messagesEndRef}
          messagesContainerRef={messagesContainerRef}
          primaryColor={primaryColor}
          accentColor={accentColor}
          isDark={isDark}
        />
      </div>

      <ChatInput
        messageContent={messageContent}
        onMessageChange={setMessageContent}
        onSend={handleSendMessage}
        isSending={sending}
        hasFile={!!selectedFile}
        showEmojiPicker={showEmojiPicker}
        onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
        activeEmojiCategory={activeEmojiCategory}
        onEmojiCategoryChange={setActiveEmojiCategory}
        onEmojiSelect={insertEmoji}
        onFileClick={() => fileInputRef.current?.click()}
        fileInputRef={fileInputRef}
        emojiPickerRef={emojiPickerRef}
        onFileChange={handleFileSelect}
        primaryColor={primaryColor}
        isDark={isDark}
      />
    </div>
  )
}


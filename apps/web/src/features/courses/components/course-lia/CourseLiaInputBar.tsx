import type { ChangeEventHandler, KeyboardEventHandler, RefObject } from 'react';

import type { CourseLiaThemeColors } from './CourseLia.types';
import type { CourseLiaAttachmentState } from './useCourseLiaAttachments';
import { CourseLiaAttachmentPreview } from './CourseLiaAttachmentPreview';
import { CourseLiaInputControls } from './CourseLiaInputControls';

interface CourseLiaInputBarProps {
  attachments: CourseLiaAttachmentState;
  canSendMessage: boolean;
  inputRef: RefObject<HTMLInputElement>;
  inputValue: string;
  isLightTheme: boolean;
  isLoading: boolean;
  isMobile: boolean;
  onInputChange: (value: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  onPrimaryAction: () => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaInputBar({
  attachments,
  canSendMessage,
  inputRef,
  inputValue,
  isLightTheme,
  isLoading,
  isMobile,
  onInputChange,
  onKeyDown,
  onPrimaryAction,
  themeColors,
}: CourseLiaInputBarProps) {
  return (
    <div style={{ padding: isMobile ? '10px 3% 12px' : '12px 16px 16px', borderTop: `1px solid ${themeColors.borderColor}` }}>
      <input
        ref={attachments.attachmentInputRef}
        type="file"
        accept="image/*"
        onChange={attachments.handleAttachmentSelect as ChangeEventHandler<HTMLInputElement>}
        style={{ display: 'none' }}
      />
      <CourseLiaAttachmentPreview
        attachment={attachments.selectedAttachment}
        isLightTheme={isLightTheme}
        onRemove={attachments.handleRemoveAttachment}
        themeColors={themeColors}
      />
      {attachments.attachmentError ? (
        <div style={{ marginBottom: '10px', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.12)', color: isLightTheme ? '#B91C1C' : '#FCA5A5', fontSize: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
          {attachments.attachmentError}
        </div>
      ) : null}
      <CourseLiaInputControls
        canSendMessage={canSendMessage}
        inputRef={inputRef}
        inputValue={inputValue}
        isLightTheme={isLightTheme}
        isLoading={isLoading}
        isMobile={isMobile}
        onAttachmentButtonClick={attachments.handleAttachmentButtonClick}
        onInputChange={onInputChange}
        onKeyDown={onKeyDown}
        onPrimaryAction={onPrimaryAction}
        selectedAttachment={Boolean(attachments.selectedAttachment)}
        themeColors={themeColors}
      />
    </div>
  );
}
